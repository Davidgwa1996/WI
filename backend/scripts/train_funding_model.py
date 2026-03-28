import pandas as pd
import xgboost as xgb
import joblib
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, roc_auc_score

print("Generating synthetic training data...")

# Create synthetic dataset (replace with real data)
np.random.seed(42)
n_samples = 500

data = {
    'github_stars': np.random.randint(0, 5000, n_samples),
    'twitter_followers': np.random.randint(0, 100000, n_samples),
    'discord_members': np.random.randint(0, 50000, n_samples),
    'market_cap': np.random.randint(0, 10000000, n_samples),
    'tvl': np.random.randint(0, 5000000, n_samples),
    'team_size': np.random.randint(1, 20, n_samples),
    'age_months': np.random.randint(1, 36, n_samples),
}

df = pd.DataFrame(data)

# Create target: 1 if project raised next round within 6 months
# Heuristic: projects with >1000 stars, >10000 followers, >5000 members likely to raise
df['raised_next_round'] = (
    (df['github_stars'] > 1000) & 
    (df['twitter_followers'] > 10000) & 
    (df['discord_members'] > 5000)
).astype(int)

# Add some noise (10% random)
random_raises = np.random.choice([0, 1], size=n_samples, p=[0.9, 0.1])
df.loc[random_raises == 1, 'raised_next_round'] = 1

print(f"Dataset shape: {df.shape}")
print(f"Positive samples: {df['raised_next_round'].sum()}")

# Train model
features = ["github_stars", "twitter_followers", "discord_members", "market_cap", "tvl", "team_size", "age_months"]
X = df[features]
y = df["raised_next_round"]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = xgb.XGBClassifier(
    n_estimators=200,
    learning_rate=0.05,
    max_depth=6,
    random_state=42,
    use_label_encoder=False,
    eval_metric='logloss'
)

model.fit(X_train, y_train)

y_pred = model.predict(X_test)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.2f}")
print(f"AUC: {roc_auc_score(y_test, model.predict_proba(X_test)[:,1]):.2f}")

# Save model
joblib.dump(model, "models/funding_predictor.pkl")
print("✓ Model saved to models/funding_predictor.pkl")
