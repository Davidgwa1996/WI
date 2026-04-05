import numpy as np


def detect_growth_spike(
    project,
    metric: str = "twitter_follower_growth_30d",
    threshold: float = 2.0,
    min_history: int = 5,
    max_history: int = 10,
) -> bool:
    """
    Detect whether the current metric value is anomalous using a Z-score threshold.

    Rules:
    - Historical values are stored in project.extra_data["<metric>_history"]
    - At least `min_history` valid historical values are required
    - The current value is always appended after evaluation
    - Only the most recent `max_history` values are kept

    Example:
        metric="twitter_follower_growth_30d"
        history key => "twitter_follower_growth_30d_history"
    """
    # Ensure extra_data is always a dict
    if not hasattr(project, "extra_data") or not isinstance(project.extra_data, dict):
        project.extra_data = {}

    history_key = f"{metric}_history"

    raw_history = project.extra_data.get(history_key, [])
    if not isinstance(raw_history, list):
        raw_history = []

    # Safely coerce current value
    try:
        current = float(getattr(project, metric, 0.0) or 0.0)
    except (TypeError, ValueError):
        current = 0.0

    # Clean historical values
    cleaned_history = []
    for value in raw_history:
        try:
            cleaned_history.append(float(value))
        except (TypeError, ValueError):
            continue

    anomaly_detected = False

    if len(cleaned_history) >= min_history:
        mean = float(np.mean(cleaned_history))
        std = float(np.std(cleaned_history))

        if std > 0:
            z_score = (current - mean) / std
            anomaly_detected = z_score > threshold

            project.extra_data[f"{metric}_z_score"] = round(z_score, 4)
            project.extra_data[f"{metric}_mean"] = round(mean, 4)
            project.extra_data[f"{metric}_std"] = round(std, 4)
        else:
            project.extra_data[f"{metric}_z_score"] = 0.0
            project.extra_data[f"{metric}_mean"] = round(mean, 4)
            project.extra_data[f"{metric}_std"] = 0.0

    # Always append current value after evaluation
    cleaned_history.append(current)
    project.extra_data[history_key] = cleaned_history[-max_history:]

    return anomaly_detected