def overall_score(project):
    """Weighted ensemble for early‑stage focus."""
    weights = {
        "llm": 0.35,
        "sentiment": 0.15,
        "funding": 0.30,
        "momentum": 0.20
    }
    scores = {
        "llm": project.llm_score or 0,
        "sentiment": project.sentiment_score or 50,
        "funding": project.funding_prediction or 0,
        "momentum": project.momentum_score or 0
    }
    total = sum(scores[k] * weights[k] for k in weights)
    return min(max(total, 0), 100)