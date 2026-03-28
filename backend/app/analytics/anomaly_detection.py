import numpy as np
from scipy import stats

def detect_growth_spike(project, metric='twitter_follower_growth_30d', threshold=2.0):
    """
    Detect if recent growth rate is a statistical anomaly (Z‑score > threshold).
    Requires storing historical values in project.extra_data.
    """
    history_key = f"{metric}_history"
    history = project.extra_data.get(history_key, [])
    if len(history) < 5:
        return False
    current = getattr(project, metric, 0)
    mean = np.mean(history)
    std = np.std(history)
    if std == 0:
        return False
    z_score = (current - mean) / std
    # Update history (append current, keep last 10)
    history.append(current)
    project.extra_data[history_key] = history[-10:]
    return z_score > threshold