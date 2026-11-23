"""Transactional outbox for tenant announcements; at-least-once delivery."""

from sqlalchemy import select
from .models import Tenancy, PushSubscription, PushDelivery


def enqueue(db, notice):
    db.flush()
    users = select(Tenancy.user_id).where(
        Tenancy.property_id == notice.property_id, Tenancy.active == True
    )
    for sub in db.scalars(
        select(PushSubscription).where(PushSubscription.user_id.in_(users))
    ):
        db.add(PushDelivery(subscription_id=sub.id, notice_id=notice.id))
