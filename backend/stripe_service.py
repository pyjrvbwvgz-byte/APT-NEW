"""Real Stripe SDK integration: webhook verification + customer portal."""
import os
import logging
import asyncio
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
import stripe

load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger(__name__)

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
STRIPE_PAYMENT_LINK = os.environ.get("STRIPE_PAYMENT_LINK", "")

if STRIPE_SECRET_KEY:
    stripe.api_key = STRIPE_SECRET_KEY


def verify_webhook(payload: bytes, signature: str) -> Optional[dict]:
    """Verifies Stripe webhook signature and returns the event as a plain dict."""
    if not STRIPE_WEBHOOK_SECRET:
        logger.warning("STRIPE_WEBHOOK_SECRET not set")
        return None
    import json as _json
    try:
        # Throws on bad signature
        stripe.Webhook.construct_event(payload, signature, STRIPE_WEBHOOK_SECRET)
        # Parse payload ourselves to get a plain dict (Stripe objects are awkward)
        return _json.loads(payload.decode("utf-8"))
    except stripe.SignatureVerificationError as e:
        logger.warning("invalid stripe signature: %s", e)
        return None
    except Exception as e:
        logger.warning("webhook parse error: %s", e)
        return None


async def create_portal_session(stripe_customer_id: str, return_url: str) -> Optional[str]:
    """Creates a Stripe Customer Portal session and returns the URL."""
    if not STRIPE_SECRET_KEY:
        return None
    try:
        session = await asyncio.to_thread(
            stripe.billing_portal.Session.create,
            customer=stripe_customer_id,
            return_url=return_url,
        )
        return session.url
    except Exception as e:
        logger.error("portal session failed: %s", e)
        return None


async def retrieve_session_customer(checkout_session_id: str) -> Optional[dict]:
    """Retrieves a checkout session and returns {customer_id, customer_email, subscription_id}."""
    if not STRIPE_SECRET_KEY:
        return None
    try:
        sess = await asyncio.to_thread(
            stripe.checkout.Session.retrieve,
            checkout_session_id,
        )
        return {
            "customer_id": sess.get("customer"),
            "customer_email": sess.get("customer_email") or (sess.get("customer_details") or {}).get("email"),
            "subscription_id": sess.get("subscription"),
            "payment_status": sess.get("payment_status"),
        }
    except Exception as e:
        logger.warning("retrieve session failed: %s", e)
        return None
