"""Persist onboarding preference; tenancy/ownership still determine access."""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("onboarding_intent", sa.String(20), nullable=False, server_default="seeker"))


def downgrade():
    op.drop_column("users", "onboarding_intent")
