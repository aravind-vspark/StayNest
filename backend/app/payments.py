import os, hmac, hashlib
import httpx
from fastapi import HTTPException
from .models import now


PLATFORM_CONVENIENCE_FEE_PAISE = int(os.getenv("PLATFORM_CONVENIENCE_FEE_PAISE", "0"))


def config(property_id, merchant_account_id=None):
    # Support multi-owner collection via Razorpay Route or platform gateway.
    # If PAYMENT_PROPERTY_ID is set to a specific ID, restrict to it unless set to '*' or 'all'.
    allowed_prop = os.getenv("PAYMENT_PROPERTY_ID")
    if allowed_prop and allowed_prop not in ("*", "all") and str(property_id) != allowed_prop:
        raise HTTPException(503, "Online collection is not enabled for this property")
    key_id = os.getenv("RAZORPAY_KEY_ID")
    key_secret = os.getenv("RAZORPAY_KEY_SECRET")
    if not key_id or not key_secret:
        raise HTTPException(503, "Online collection is not enabled for this property")
    return key_id, key_secret


def gateway(method, path, keys, data=None):
    try:
        with httpx.Client(timeout=15) as client:
            r = client.request(
                method, "https://api.razorpay.com/v1/" + path, auth=keys, json=data
            )
        r.raise_for_status()
        return r.json()
    except (httpx.HTTPError, ValueError):
        raise HTTPException(502, "Payment provider unavailable. Please retry.")


def signature(secret, message, supplied):
    return hmac.compare_digest(
        hmac.new(secret.encode(), message, hashlib.sha256).hexdigest(), supplied
    )


def validate_order(invoice, order):
    if (not isinstance(order.get("id"), str) or not order["id"].startswith("order_")
        or order.get("receipt") != f"staynest-{invoice.id}"
        or order.get("amount") != invoice.amount or order.get("currency") != "INR"):
        raise HTTPException(502, "Payment provider returned an inconsistent order")


def recover_order(invoice, keys):
    # Receipt is stable across retries, including a lost response or DB rollback.
    result = gateway("GET", f"orders?receipt=staynest-{invoice.id}&count=100", keys)
    orders = [o for o in result.get("items", []) if o.get("receipt") == f"staynest-{invoice.id}"]
    if len(orders) > 1:
        raise HTTPException(409, "Multiple payment orders found; contact support")
    if orders:
        validate_order(invoice, orders[0])
        return orders[0]
    return None


def capture(invoice, payment):
    if (
        payment.get("order_id") != invoice.order_id
        or payment.get("amount") != invoice.amount
        or payment.get("currency") != "INR"
    ):
        raise HTTPException(400, "Payment does not match invoice")
    if payment.get("status") != "captured":
        raise HTTPException(409, "Payment is not captured yet. Check again shortly.")
    if invoice.status == "paid":
        if invoice.payment_id != payment["id"]:
            raise HTTPException(409, "Invoice already settled by another payment")
        return
    invoice.status = "paid"
    invoice.payment_id = payment["id"]
    invoice.paid_at = now()
