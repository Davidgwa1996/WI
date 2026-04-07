from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user
from app.config import settings
from app.database import get_db
from app.models import Organization, User

try:
    import stripe
except Exception:
    stripe = None

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])


@router.get("/status")
def subscription_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    organization = (
        db.query(Organization)
        .filter(Organization.id == current_user.organization_id)
        .first()
    )

    if not organization:
        return {"plan": "starter", "is_active": False, "stripe_customer_id": None}

    if not organization.stripe_customer_id or stripe is None or not getattr(settings, "STRIPE_SECRET_KEY", None):
        return {
            "plan": getattr(organization, "plan", "starter"),
            "is_active": bool(getattr(organization, "is_active", True)),
            "stripe_customer_id": organization.stripe_customer_id,
        }

    try:
        stripe.api_key = settings.STRIPE_SECRET_KEY
        subs = stripe.Subscription.list(customer=organization.stripe_customer_id, limit=5)
        active = any(item.status in {"active", "trialing", "past_due"} for item in subs.data)

        return {
            "plan": getattr(organization, "plan", "starter"),
            "is_active": active,
            "stripe_customer_id": organization.stripe_customer_id,
        }
    except Exception:
        return {
            "plan": getattr(organization, "plan", "starter"),
            "is_active": bool(getattr(organization, "is_active", True)),
            "stripe_customer_id": organization.stripe_customer_id,
        }