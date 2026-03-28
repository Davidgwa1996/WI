from celery import Celery
from app.config import settings
from app.database import SessionLocal
from app.models import Project
from app.scrapers import twitter, github, discord, coingecko, defillama
from app.ai import llm_analyzer, sentiment, momentum, funding_predictor, ensemble

celery = Celery('tasks', broker=settings.REDIS_URL)

@celery.task
def update_all_projects():
    db = SessionLocal()
    projects = db.query(Project).all()
    for project in projects:
        twitter.update_twitter_metrics(project, db)
        github.update_github_metrics(project, db)
        discord.update_discord_metrics(project, db)
        coingecko.update_market_data(project, db)
        defillama.update_defillama_tvl(project, db)

        project.llm_score = llm_analyzer.llm_early_stage_score(project)
        project.sentiment_score = sentiment.get_sentiment_score(project.id)
        project.momentum_score = momentum.calculate_momentum_score(project)
        project.funding_prediction = funding_predictor.predict_funding(project)
        project.overall_score = ensemble.overall_score(project)
        db.commit()
    db.close()