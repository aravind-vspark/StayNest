import os, hashlib, secrets, time
from pathlib import Path
from datetime import timedelta
from collections import defaultdict
from argon2 import PasswordHasher
from argon2.exceptions import VerificationError, InvalidHashError
from fastapi import Depends, HTTPException, Request
from sqlalchemy import create_engine, select, event
from sqlalchemy.orm import sessionmaker
from .models import Session, User, now

ENV = os.getenv("APP_ENV", "production").strip().lower()
if ENV not in {"development", "test", "production"}:
    raise RuntimeError("APP_ENV must be development, test, or production")
ORIGIN = os.getenv("APP_ORIGIN", "http://localhost:8000").rstrip("/")
DB_URL = os.getenv("DATABASE_URL", "sqlite:///./staynest.db")
if DB_URL.startswith("postgres://"):
    DB_URL = DB_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DB_URL.startswith("postgresql://") and not DB_URL.startswith("postgresql+psycopg://"):
    DB_URL = DB_URL.replace("postgresql://", "postgresql+psycopg://", 1)

if ENV == "production" and (
    not ORIGIN.startswith("https://")
    or not DB_URL.startswith("postgresql")
):
    raise RuntimeError(
        "Production requires HTTPS APP_ORIGIN and PostgreSQL DATABASE_URL"
    )
engine = create_engine(
    DB_URL,
    pool_pre_ping=True,
    **(
        {"connect_args": {"check_same_thread": False}}
        if DB_URL.startswith("sqlite")
        else {}
    ),
)
if DB_URL.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def sqlite_fk(dbapi_connection, _):
        dbapi_connection.execute("PRAGMA foreign_keys=ON")


DB = sessionmaker(engine, expire_on_commit=False)
PH = PasswordHasher()
DUMMY = PH.hash(secrets.token_urlsafe(32))
MEDIA = Path(os.getenv("MEDIA_DIR", "./media"))
MEDIA.mkdir(parents=True, exist_ok=True)


def get_db():
    with DB() as db:
        yield db


def current(request: Request, db=Depends(get_db)):
    raw = request.cookies.get("staynest_session", "")
    if not raw:
        raise HTTPException(401, "Please sign in")
    s = db.get(Session, hashlib.sha256(raw.encode()).hexdigest())
    if not s or s.expires < now():
        raise HTTPException(401, "Session expired")
    user = db.get(User, s.user_id)
    if not user or user.deleted:
        raise HTTPException(401, "Account unavailable")
    return user


def optional_user(request: Request, db=Depends(get_db)):
    raw = request.cookies.get("staynest_session", "")
    if not raw:
        return None
    s = db.get(Session, hashlib.sha256(raw.encode()).hexdigest())
    if not s or s.expires < now():
        return None
    user = db.get(User, s.user_id)
    if not user or user.deleted:
        return None
    return user


def issue_session(db, user, response):
    raw = secrets.token_urlsafe(48)
    db.add(
        Session(
            token=hashlib.sha256(raw.encode()).hexdigest(),
            user_id=user.id,
            expires=now() + timedelta(days=7),
        )
    )
    db.commit()
    response.set_cookie(
        "staynest_session",
        raw,
        httponly=True,
        secure=ENV == "production",
        samesite="lax",
        max_age=604800,
        path="/",
    )


def verify(password, stored):
    try:
        return PH.verify(stored, password)
    except (VerificationError, InvalidHashError):
        return False


_local = defaultdict(list)


def throttle(key, limit=15, seconds=60):
    url = os.getenv("REDIS_URL")
    if url:
        import redis

        try:
            r = redis.Redis.from_url(url, socket_timeout=2)
            bucket = f"staynest:limit:{key}:{int(time.time())//seconds}"
            with r.pipeline() as p:
                p.incr(bucket)
                p.expire(bucket, seconds + 1)
                count = p.execute()[0]
        except redis.RedisError:
            raise HTTPException(503, "Please try again shortly")
        if count > limit:
            raise HTTPException(429, "Too many requests. Try again later.")
    else:
        t = time.time()
        _local[key] = [v for v in _local[key] if v > t - seconds]
        if len(_local[key]) >= limit:
            raise HTTPException(429, "Too many requests. Try again later.")
        _local[key].append(t)
