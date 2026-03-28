from celery import Celery
from app.database import SessionLocal
from app.models import Project
from app.scrapers import (
    twitter, github, discord, coingecko, defillama,
    angellist, crunchbase, producthunt
)
from app.ai import llm_analyzer, sentiment, momentum, funding_predictor, ensemble
from app.analytics import (
    monte_carlo_funding_probability,
    detect_growth_spike,
    calculate_correlation,
    sentiment_momentum
)
import asyncio
from app.websocket_manager import manager   # <-- changed import

celery = Celery('tasks', broker='redis://redis:6379/0')

@celery.task
def update_all_projects():
    db = SessionLocal()
    projects = db.query(Project).all()
    for project in projects:
        # Update scraped metrics
        twitter.update_twitter_metrics(project, db)
        github.update_github_metrics(project, db)
        discord.update_discord_metrics(project, db)
        coingecko.update_market_data(project, db)
        defillama.update_defillama_tvl(project, db)

        # AI scores
        project.llm_score = llm_analyzer.llm_early_stage_score(project)
        project.sentiment_score = sentiment.get_sentiment_score(project.id)
        project.momentum_score = momentum.calculate_momentum_score(project)
        project.funding_prediction = funding_predictor.predict_funding(project)
        project.overall_score = ensemble.overall_score(project)

        # Advanced analytics
        monte_carlo = monte_carlo_funding_probability(project)
        anomaly = detect_growth_spike(project)
        # sentiment_trend = sentiment_momentum(project.id)  # optional
        # correlation = asyncio.run(fetch_and_calc_correlation(project))  # optional

        # Store in extra_data
        project.extra_data['monte_carlo_prob'] = monte_carlo
        project.extra_data['anomaly_detected'] = anomaly

        db.commit()

        # Broadcast comprehensive update
        loop = asyncio.new_event_loop()
        loop.run_until_complete(manager.broadcast({
            "type": "full_update",
            "project_id": project.id,
            "overall_score": project.overall_score,
            "llm_score": project.llm_score,
            "sentiment_score": project.sentiment_score,
            "funding_prediction": project.funding_prediction,
            "momentum_score": project.momentum_score,
            "twitter_followers": project.twitter_followers,
            "github_stars": project.github_stars,
            "discord_members": project.discord_members,
            "market_cap": project.market_cap,
            "monte_carlo_prob": monte_carlo,
            "anomaly_detected": anomaly
        }))
    db.close()