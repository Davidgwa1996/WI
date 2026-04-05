import re
import numpy as np
from functools import lru_cache
from textblob import TextBlob
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from app.database import get_mongo_db


def clean_text(text: str) -> str:
    text = re.sub(r"http\S+", "", text or "")
    text = re.sub(r"@\w+", "", text)
    text = re.sub(r"#", "", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:512]


@lru_cache(maxsize=1)
def _load_transformer_sentiment():
    try:
        from transformers import pipeline
        return pipeline("sentiment-analysis")
    except Exception as e:
        print(f"Warning: transformer sentiment unavailable: {e}")
        return None


@lru_cache(maxsize=1)
def _get_vader():
    return SentimentIntensityAnalyzer()


def _score_with_transformer(model, text: str) -> float | None:
    if model is None or not text:
        return None

    try:
        result = model(text[:512])[0]
        label = str(result.get("label", "")).upper()
        raw_score = float(result.get("score", 0.0)) * 100

        if "POSITIVE" in label:
            return round(raw_score, 2)

        if "NEGATIVE" in label:
            return round(100 - raw_score, 2)

        return 50.0
    except Exception as e:
        print(f"Warning: transformer sentiment inference failed: {e}")
        return None


def _score_with_vader(text: str) -> float:
    try:
        analyzer = _get_vader()
        scores = analyzer.polarity_scores(text)
        compound = scores.get("compound", 0.0)
        return round((compound + 1) * 50, 2)
    except Exception:
        return 50.0


def _score_with_textblob(text: str) -> float:
    try:
        blob = TextBlob(text)
        polarity = blob.sentiment.polarity
        return round((polarity + 1) / 2 * 100, 2)
    except Exception:
        return 50.0


def get_sentiment_score(project_id: int, text: str = "", limit: int = 200) -> float:
    """
    Production-safe sentiment scorer.

    Priority:
    1. Use explicit text if passed in.
    2. Otherwise read recent MongoDB messages for the project.
    3. Prefer transformer model when available.
    4. Fall back to VADER.
    5. Fall back to TextBlob.

    Returns a 0-100 score, with 50 as neutral fallback.
    """
    collected_texts: list[str] = []

    direct_text = clean_text(text)
    if len(direct_text) >= 5:
        collected_texts.append(direct_text)

    db = get_mongo_db()
    if db is not None and not collected_texts:
        try:
            messages = list(
                db.messages.find({"project_id": project_id})
                .sort("timestamp", -1)
                .limit(limit)
            )

            for msg in messages:
                msg_text = clean_text(msg.get("text", ""))
                if len(msg_text) >= 5:
                    collected_texts.append(msg_text)
        except Exception as e:
            print(f"Warning: Mongo sentiment fetch failed: {e}")

    if not collected_texts:
        return 50.0

    transformer_model = _load_transformer_sentiment()
    scores: list[float] = []

    for item in collected_texts:
        score = _score_with_transformer(transformer_model, item)

        if score is None:
            score = _score_with_vader(item)

        if score is None:
            score = _score_with_textblob(item)

        scores.append(float(score))

    if not scores:
        return 50.0

    return round(float(np.mean(scores)), 2)