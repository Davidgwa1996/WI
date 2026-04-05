# backend/app/utils/pubsub.py
import json
import asyncio
from app.utils.redis_client import redis_client
from app.websocket_manager import manager

CHANNEL = "realtime_events"

async def publish_event(event: dict) -> None:
    redis_client.publish(CHANNEL, json.dumps(event))

async def listen_to_events() -> None:
    pubsub = redis_client.pubsub()
    pubsub.subscribe(CHANNEL)

    while True:
        message = pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
        if message and message.get("type") == "message":
            try:
                payload = json.loads(message["data"])
                await manager.broadcast(payload)
            except Exception as exc:
                print(f"Pub/Sub broadcast error: {exc}")
        await asyncio.sleep(0.1)