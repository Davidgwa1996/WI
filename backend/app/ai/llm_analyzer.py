import openai
import time
from app.config import settings

openai.api_key = settings.OPENAI_API_KEY

def llm_early_stage_score(project, retries=2):
    """Fallback heuristic if OpenAI fails."""
    if settings.OPENAI_API_KEY:
        try:
            context = f"""
Project Name: {project.name}
Description: {project.description or 'Not provided'}
Sector: {project.sector or 'Unknown'}
Stage: {project.stage or 'Unknown'}
Team Size: {project.team_size or 'Unknown'}
Funding Raised: ${project.funding_raised or 0}
Website: {project.website or 'Not provided'}
Twitter: {project.twitter_handle or 'Not provided'}
GitHub: {project.github_repo or 'Not provided'}
"""
            prompt = f"""
You are a world-class venture capital analyst specializing in Web3 and crypto investments.
Evaluate the following early-stage project for investment potential. Provide a score from 0 to 100, where 100 is exceptional.

Consider the following weighted criteria:
- Innovation & Technology (25%): Is the project solving a novel problem? Is the technology differentiated?
- Market Opportunity (25%): Is the target market large and growing? Is the timing right?
- Team & Execution (25%): Do the founders have relevant experience? Is there a strong track record?
- Tokenomics & Business Model (25%): Is the value capture mechanism sound? Is the token utility clear?

Project details:
{context}

Return only the final integer score (0-100) with no additional text.
"""
            for attempt in range(retries):
                try:
                    response = openai.ChatCompletion.create(
                        model="gpt-3.5-turbo",
                        messages=[{"role": "user", "content": prompt}],
                        temperature=0.2,
                        max_tokens=10,
                        timeout=10
                    )
                    score_text = response.choices[0].message.content.strip()
                    score = int(score_text)
                    return max(0, min(100, score))
                except Exception as e:
                    print(f"LLM error (attempt {attempt+1}): {e}")
                    time.sleep(1)
        except Exception as e:
            print(f"LLM error: {e}")
    # Fallback heuristic
    score = 50  # base
    if project.twitter_followers and project.twitter_followers > 1000:
        score += min(project.twitter_followers / 20000, 20)
    if project.github_stars and project.github_stars > 100:
        score += min(project.github_stars / 2000, 20)
    if project.team_size and project.team_size > 5:
        score += 10
    return min(100, score)
