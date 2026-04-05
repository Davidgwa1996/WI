# backend/app/ai/ai_notifications.py
from app.utils.pubsub import publish_event

async def send_ai_alert(message: str) -> None:
    await publish_event({
        "type": "ai_alert",
        "message": message
    })