"""Production features: password recovery, OTP verification, multi-photo gallery and merchant routing."""
from alembic import op
import sqlalchemy as sa

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("phone_verified", sa.Boolean(), nullable=False, server_default=sa.false()))
    op.add_column("properties", sa.Column("photos", sa.JSON(), nullable=True, server_default="[]"))
    op.add_column("properties", sa.Column("video_url", sa.String(500), nullable=False, server_default=""))
    op.add_column("properties", sa.Column("merchant_account_id", sa.String(64), nullable=False, server_default=""))

    op.create_table(
        "password_reset_tokens",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("expires", sa.DateTime(), nullable=False),
        sa.Column("used", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_password_reset_tokens_user_id", "password_reset_tokens", ["user_id"])
    op.create_index("ix_password_reset_tokens_token_hash", "password_reset_tokens", ["token_hash"])

    op.create_table(
        "otp_verifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("phone", sa.String(20), nullable=False),
        sa.Column("code_hash", sa.String(64), nullable=False),
        sa.Column("expires", sa.DateTime(), nullable=False),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("verified", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_otp_verifications_phone", "otp_verifications", ["phone"])


def downgrade():
    op.drop_table("otp_verifications")
    op.drop_table("password_reset_tokens")
    op.drop_column("properties", "merchant_account_id")
    op.drop_column("properties", "video_url")
    op.drop_column("properties", "photos")
    op.drop_column("users", "phone_verified")
