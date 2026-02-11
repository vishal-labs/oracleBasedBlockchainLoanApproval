import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import pickle
import os

def generate_synthetic_data(n_samples=1000):
    """
    Generate synthetic data for credit scoring model training.
    
    Features:
    - balance_eth: Wallet balance (0-100 ETH)
    - tx_count: Number of transactions (0-5000)
    - days_active: Account age in days (0-2000)
    - has_social: 1 if social media linked, 0 otherwise
    - loan_ratio: Loan amount / Collateral (simulation) -> Here simplified to Loan Value / Balance
    
    Target:
    - credit_score: 300-850
    """
    np.random.seed(42)
    
    # Feature 1: Balance (Log-normal distribution to simulate wealth)
    balance_eth = np.random.lognormal(mean=1.0, sigma=1.0, size=n_samples)
    
    # Feature 2: Transaction Count (Correlated with balance)
    tx_count = balance_eth * np.random.randint(10, 50, size=n_samples) + np.random.randint(0, 100, size=n_samples)
    
    # Feature 3: Days Active
    days_active = np.random.randint(1, 2000, size=n_samples)
    
    # Feature 4: Social Media (Binary)
    has_social = np.random.choice([0, 1], size=n_samples, p=[0.4, 0.6])
    
    # Feature 5: Loan Value INR (Random request)
    loan_value_inr = np.random.randint(50000, 5000000, size=n_samples)
    
    # Target Generation (Rule-based with noise)
    # Base Score
    score = 600 + (np.log1p(balance_eth) * 20) + (np.log1p(tx_count) * 10) + (days_active * 0.05)
    score += (has_social * 50)
    
    # Penalty for high loan values relative to 'implied' collateral/wealth
    # In real world, we'd check collateral. Here we use loan size as risk proxy.
    score -= (np.log1p(loan_value_inr) * 5)
    
    # Add noise
    score += np.random.normal(0, 30, size=n_samples)
    
    # Clip to 300-850
    score = np.clip(score, 300, 850)
    
    X = pd.DataFrame({
        'balance_eth': balance_eth,
        'tx_count': tx_count,
        'days_active': days_active,
        'has_social': has_social,
        'loan_value_inr': loan_value_inr
    })
    
    y = score
    
    return X, y

def train_model():
    print("🤖 Generating synthetic training data...")
    X, y = generate_synthetic_data(5000)
    
    print("🧠 Training Random Forest Regressor...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    print("✅ Model trained!")
    print(f"   Feature Importances: {model.feature_importances_}")
    
    # Save model
    with open('credit_model.pkl', 'wb') as f:
        pickle.dump(model, f)
    print("💾 Model saved to 'credit_model.pkl'")

if __name__ == "__main__":
    train_model()
