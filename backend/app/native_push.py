"""FCM HTTP v1 and APNs alert delivery. Credentials stay on the server."""
import os, json, time, base64, re
from pathlib import Path
import httpx
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.asymmetric.utils import decode_dss_signature

_google = None
_apple = None


class NativePushError(Exception):
    def __init__(self, status=0):
        self.status = status
        super().__init__(f"Native push provider status {status}")


def configured(platform):
    if platform == "android":
        return bool(os.getenv("FCM_SERVICE_ACCOUNT_FILE"))
    return all(os.getenv(k) for k in ("APNS_KEY_FILE", "APNS_KEY_ID", "APNS_TEAM_ID", "APNS_TOPIC"))


def apple_token():
    global _apple
    current = int(time.time())
    if _apple and current - _apple[0] < 2700:
        return _apple[1]
    def encode(value):
        return base64.urlsafe_b64encode(json.dumps(value, separators=(",", ":")).encode()).rstrip(b"=")
    unsigned = encode({"alg": "ES256", "kid": os.environ["APNS_KEY_ID"]}) + b"." + encode({"iss": os.environ["APNS_TEAM_ID"], "iat": current})
    key = serialization.load_pem_private_key(Path(os.environ["APNS_KEY_FILE"]).read_bytes(), password=None)
    r, s = decode_dss_signature(key.sign(unsigned, ec.ECDSA(hashes.SHA256())))
    token = (unsigned + b"." + base64.urlsafe_b64encode(r.to_bytes(32, "big") + s.to_bytes(32, "big")).rstrip(b"=")).decode()
    _apple = current, token
    return token


def send(endpoint, notice_id):
    platform, token = endpoint.removeprefix("native:").split(":", 1)
    title = "StayNest update"
    body = "Your hostel has posted an update. Open StayNest to view it."
    try:
        if platform == "android":
            global _google
            from google.oauth2 import service_account
            from google.auth.transport.requests import Request
            if _google is None:
                _google = service_account.Credentials.from_service_account_file(os.environ["FCM_SERVICE_ACCOUNT_FILE"], scopes=["https://www.googleapis.com/auth/firebase.messaging"])
            if not _google.valid:
                _google.refresh(Request())
            if not re.fullmatch(r"[a-z0-9-]+", _google.project_id):
                raise ValueError("Invalid Firebase project")
            with httpx.Client(timeout=10) as client:
                response = client.post(f"https://fcm.googleapis.com/v1/projects/{_google.project_id}/messages:send",
                    headers={"Authorization": f"Bearer {_google.token}"},
                    json={"message": {"token": token, "notification": {"title": title, "body": body},
                        "data": {"notice_id": str(notice_id)}, "android": {"notification": {"channel_id": "hostel-updates"}}}})
        elif platform == "ios":
            host = "api.sandbox.push.apple.com" if os.getenv("APNS_ENV") == "sandbox" else "api.push.apple.com"
            with httpx.Client(http2=True, timeout=10) as client:
                response = client.post(f"https://{host}/3/device/{token}",
                    headers={"authorization": "bearer " + apple_token(), "apns-topic": os.environ["APNS_TOPIC"], "apns-push-type": "alert", "apns-priority": "10", "apns-collapse-id": f"notice-{notice_id}"},
                    json={"aps": {"alert": {"title": title, "body": body}, "sound": "default"}})
        else:
            raise NativePushError(410)
        if response.status_code >= 400:
            raise NativePushError(response.status_code)
    except NativePushError:
        raise
    except Exception:
        # Never include tokens, key files or provider response bodies in logs.
        raise NativePushError(0) from None
