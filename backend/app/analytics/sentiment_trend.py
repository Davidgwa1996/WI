import numpy as np
from app.database import get_mongo_db
from datetime import datetime, timedelta

def sentiment_momentum(project_id, days=7):
    """
    Compute the moving average of sentiment scores over the last 'days'.
    Uses sentiment scores stored in MongoDB (each with timestamp).
    """
    db = get_mongo_db()
    cutoff = datetime.utcnow() - timedelta(days=days)
    messages = db.sentiment_history.find({
        "project_id": project_id,
        "timestamp": {"$gte": cutoff}
    }).sort("timestamp", 1)
    scores = [msg["score"] for msg in messages]
    if not scores:
        return 50.0  # neutral
    # Simple moving average
    return np.mean(scores)