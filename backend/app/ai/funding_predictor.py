import joblib
import numpy as np
import os
from datetime import datetime
from app.config import settings

_model = None

def load_model():
    global _model
    if _model is None:
        if os.path.exists(settings.MODEL_PATH):
            try:
                _model = joblib.load(settings.MODEL_PATH)
            except Exception as e:
                print(f"Error loading model: {e}. Using heuristic.")
                _model = None
    return _model

def predict_funding(project):
    model = load_model()
    if model is not None:
        try:
            features = np.array([
                project.github_stars or 0,
                project.twitter_followers or 0,
                project.discord_members or 0,
                project.market_cap or 0,
                project.tvl or 0,
                project.team_size or 0,
                (datetime.utcnow() - project.created_at).days / 30.0 if project.created_at else 12,
            ]).reshape(1, -1)
            if hasattr(model, "predict_proba"):
                prob = model.predict_proba(features)[0]
                if len(prob) == 1:
                    return prob[0] * 100
                else:
                    return prob[1] * 100 if len(prob) > 1 else 0
            else:
                return model.predict(features)[0] * 100
        except Exception as e:
            print(f"Model prediction failed: {e}. Using heuristic.")

    # Heuristic based on metrics
    score = 0
    if project.github_stars > 100:
        score += 30
    elif project.github_stars > 50:
        score += 20
    elif project.github_stars > 10:
        score += 10

    if project.twitter_followers > 5000:
        score += 30
    elif project.twitter_followers > 1000:
        score += 20
    elif project.twitter_followers > 100:
        score += 10

    if project.discord_members > 1000:
        score += 20
    elif project.discord_members > 500:
        score += 10

    if project.team_size > 5:
        score += 10

    if project.market_cap and project.market_cap > 1e6:
        score += 10

    return min(100, score)
