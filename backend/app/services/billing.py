from app.config import settings


def get_stripe_client():
    stripe_key = getattr(settings, "STRIPE_SECRET_KEY", None)
    if not stripe_key:
        return None

    try:
        import stripe
        stripe.api_key = stripe_key
        return stripe
    except Exception as e:
        print(f"Warning: Stripe unavailable: {e}")
        return None


def create_checkout_session(
    price_id: str,
    success_url: str,
    cancel_url: str,
    customer_email: str | None = None,
):
    stripe = get_stripe_client()
    if stripe is None:
        return None

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[
                {
                    "price": price_id,
                    "quantity": 1,
                }
            ],
            mode="subscription",
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=customer_email,
        )
        return session
    except Exception as e:
        print(f"Warning: Stripe checkout creation failed: {e}")
        return None


def create_billing_portal_session(customer_id: str, return_url: str):
    stripe = get_stripe_client()
    if stripe is None:
        return None

    try:
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=return_url,
        )
        return session
    except Exception as e:
        print(f"Warning: Stripe billing portal creation failed: {e}")
        return None