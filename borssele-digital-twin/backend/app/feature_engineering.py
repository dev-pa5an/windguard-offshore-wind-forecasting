import pandas as pd
import numpy as np

def extract_features(df: pd.DataFrame) -> pd.DataFrame:
    """Extracts and computes meteorological features required by the telemetry engine."""
    processed = df.copy()
    
    # Correctly compute scalar wind speed magnitude from u and v vector components
    if 'u100' in processed.columns and 'v100' in processed.columns:
        processed['wind_speed_100m'] = np.sqrt(processed['u100']**2 + processed['v100']**2)
        
    if 'u10' in processed.columns and 'v10' in processed.columns:
        processed['wind_speed_10m'] = np.sqrt(processed['u10']**2 + processed['v10']**2)

    return processed