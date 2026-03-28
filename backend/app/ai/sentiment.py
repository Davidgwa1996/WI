import re
import numpy as np
from textblob import TextBlob
from app.database import get_mongo_db

def clean_text(text):
    text = re.sub(r'http\S+', '', text)
    text = re.sub(r'@\w+', '', text)
    text = re.sub(r'#', '', text)
    return text[:512]

def get_sentiment_score(project_id, limit=200):
    db = get_mongo_db()
    if db is None:
        return 50

    messages = list(db.messages.find(
        {"project_id": project_id}
    ).sort("timestamp", -1).limit(limit))

    if not messages:
        return 50

    scores = []
    for msg in messages:
        text = msg.get("text", "")
        if not text:
            continue
        text = clean_text(text)
        if len(text) < 5:
            continue
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        score = (polarity + 1) / 2 * 100
        scores.append(score)

    if not scores:
        return 50
    return np.mean(scores)
