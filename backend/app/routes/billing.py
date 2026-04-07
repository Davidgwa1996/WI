from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth.dependencies import get_current_user, require_roles
from app.config import settings
from app.database import get_db
from app.models import Organization, User

try:
    import stripe
except Exception:
    stripe = None

router = APIRouter(prefix="/billing", tags=["billing"])


@router.post("/checkout")
def create_checkout_session(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    if stripe is None or not getattr(settings, "STRIPE_SECRET_KEY", None):
        raise HTTPException(status_code=500, detail="Stripe is not configured.")

    price_id = str(payload.get("price_id", "")).strip()
    success_url = str(payload.get("success_url", "")).strip()
    cancel_url = str(payload.get("cancel_url", "")).strip()

    if not price_id or not success_url or not cancel_url:
        raise HTTPException(status_code=400, detail="price_id, success_url and cancel_url are required.")

    stripe.api_key = settings.STRIPE_SECRET_KEY

    organization = (
        db.query(Organization)
        .filter(Organization.id == current_user.organization_id)
        .first()
    )
    if not organization:
        raise HTTPException(status_code=404, detail="Organization not found.")

    customer_id = organization.stripe_customer_id

    if not customer_id:
        customer = stripe.Customer.create(
            email=current_user.email,
            name=organization.name,
            metadata={
                "organization_id": organization.id,
                "organization_slug": organization.slug,
            },
        )
        customer_id = customer["id"]
        organization.stripe_customer_id = customer_id
        db.add(organization)
        db.commit()
        db.refresh(organization)

    session = stripe.checkout.Session.create(
        mode="subscription",
        customer=customer_id,
        line_items=[{"price": price_id, "quantity": 1}],
        success_url=success_url,
        cancel_url=cancel_url,
        allow_promotion_codes=True,
        billing_address_collection="auto",
    )

    return {"checkout_url": session.url, "session_id": session.id}


@router.post("/portal")
def create_billing_portal(
    payload: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles("owner", "admin")),
):
    if stripe is None or not getattr(settings, "STRIPE_SECRET_KEY", None):
        raise HTTPException(status_code=500, detail="Stripe is not configured.")

    return_url = str(payload.get("return_url", "")).strip()
    if not return_url:
        raise HTTPException(status_code=400, detail="return_url is required.")

    stripe.api_key = settings.STRIPE_SECRET_KEY

    organization = (
        db.query(Organization)
        .filter(Organization.id == current_user.organization_id)
        .first()
    )
    if not organization or not organization.stripe_customer_id:
        raise HTTPException(status_code=404, detail="Stripe customer not found.")

    portal = stripe.billing_portal.Session.create(
        customer=organization.stripe_customer_id,
        return_url=return_url,
    )

    return {"portal_url": portal.url}