'''
Train a classifier (e.g., Random Forest or XGBoost Classifier) or a time-series model (e.g., LSTM/GRU) 
to predict whether a wind farm area will experience a high-wind cut-out shutdown N-hours ahead (e.g., 1-hour to 6-hour lead time)
'''

from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, recall_score

def train_cut_out_predictor(df_train, forecast_horizon_hours=3):
    # Shift target to create N-hour lookahead horizon
    df_train['target_lead_event'] = df_train.groupby(['latitude', 'longitude'])['cut_out_event'].shift(-forecast_horizon_hours)
    
    clean_data = df_train.dropna()
    features = ['wind_speed_100m', 'ramp_rate_1h']
    X = clean_data[features]
    y = clean_data['target_lead_event']
    
    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X, y)
    
    return clf