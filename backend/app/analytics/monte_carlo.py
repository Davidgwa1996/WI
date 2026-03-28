import numpy as np

def monte_carlo_funding_probability(project, num_simulations=10000):
    """
    Simulate the probability that the project raises its next round within 6 months.
    Uses the funding_prediction (0-100) as mean and 20% volatility.
    """
    mu = project.funding_prediction / 100.0
    sigma = 0.2  # 20% standard deviation
    samples = np.random.normal(mu, sigma, num_simulations)
    samples = np.clip(samples, 0, 1)
    probability = np.mean(samples > 0.5) * 100
    return probability