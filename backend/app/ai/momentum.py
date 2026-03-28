def calculate_momentum_score(project):
    """
    Compute momentum score (0-100) from growth rates.
    Weighted combination of Twitter, GitHub, Discord growth.
    """
    tw_growth = project.twitter_follower_growth_30d or 0
    gh_growth = project.github_star_growth_30d or 0
    dc_growth = project.discord_growth_30d or 0

    # Normalize growth: cap at 100% growth (100 points)
    scores = []
    for growth in [tw_growth, gh_growth, dc_growth]:
        if growth is not None:
            scores.append(min(max(growth, -100), 100))  # cap at -100 to 100

    if not scores:
        return 0

    # Average the scores, then shift to 0-100 (if negative growth gives <50)
    avg = sum(scores) / len(scores)
    # Map from -100..100 to 0..100
    return (avg + 100) / 2