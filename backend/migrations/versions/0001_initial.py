"""Initial StayNest schema; do not edit after deployment."""

from alembic import op
from migrations.schema_0001 import Base

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    Base.metadata.create_all(bind=op.get_bind())


def downgrade():
    raise RuntimeError(
        "Destructive downgrade disabled. Restore a verified backup instead."
    )
