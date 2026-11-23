import os, time, json, logging
from datetime import timedelta
from sqlalchemy import select
from pywebpush import webpush, WebPushException
from .native_push import send as native_send, NativePushError, configured
from .core import DB
from .models import PushDelivery, PushSubscription, Notice, Tenancy, now

logging.basicConfig(level=logging.INFO)


def deliver_once():
    with DB() as db:
        job = db.scalar(
            select(PushDelivery)
            .where(PushDelivery.state == "pending", PushDelivery.next_attempt <= now())
            .order_by(PushDelivery.id)
            .with_for_update(skip_locked=True)
            .limit(1)
        )
        if not job:
            return False
        sub = db.get(PushSubscription, job.subscription_id)
        notice = db.get(Notice, job.notice_id)
        # Recheck tenant access at delivery time (tenant may have checked out).
        active = (
            db.scalar(
                select(Tenancy).where(
                    Tenancy.user_id == sub.user_id,
                    Tenancy.property_id == notice.property_id,
                    Tenancy.active == True,
                )
            )
            if sub
            else None
        )
        if not active:
            job.state = "cancelled"
            db.commit()
            return True
        job.attempts += 1
        try:
            if sub.endpoint.startswith("native:"):
                native_send(sub.endpoint, notice.id)
            else:
                webpush(
                    subscription_info={"endpoint": sub.endpoint, "keys": sub.keys},
                    data=json.dumps(
                        {
                            "title": "StayNest update",
                            "body": "Your hostel has posted a new update. Open StayNest to view it.",
                            "tag": "notice-" + str(notice.id),
                            "url": "/",
                        }
                    ),
                    vapid_private_key=os.environ["VAPID_PRIVATE_KEY"],
                    vapid_claims={"sub": os.environ["VAPID_SUBJECT"]},
                    timeout=10,
                )
            job.state = "sent"
        except (WebPushException, NativePushError) as exc:
            status = exc.status if isinstance(exc, NativePushError) else (exc.response.status_code if exc.response is not None else 0)
            job.state = (
                "failed" if status in (404, 410) or job.attempts >= 5 else "pending"
            )
            job.next_attempt = now() + timedelta(
                seconds=min(3600, 30 * 2**job.attempts)
            )
            logging.warning(
                "Push delivery %s attempt %s status %s", job.id, job.attempts, status
            )
        db.commit()
        return True


if __name__ == "__main__":
    if not (configured("android") or configured("ios") or all(
        os.getenv(k) for k in ("VAPID_PRIVATE_KEY", "VAPID_PUBLIC_KEY", "VAPID_SUBJECT")
    )):
        raise SystemExit("Configure Web Push, FCM or APNs before starting the push worker")
    while True:
        try:
            if not deliver_once():
                time.sleep(3)
        except Exception:
            logging.exception("Push worker iteration failed")
            time.sleep(5)
