# Feature Engineering & Turbine Power Curve Mapping
# Convert raw horizontal wind vectors into hub-height scalar speeds, wind ramp rates, and cut-out target labels
import xarray as xr
import numpy as np
import pandas as pd

def process_storm_features(nc_filepath):
    ds = xr.open_dataset(nc_filepath)
    
    # 1. Total 100m Hub-Height Wind Speed: W_100 = sqrt(u100^2 + v100^2)
    u100 = ds['u100']
    v100 = ds['v100']
    w100 = np.sqrt(u100**2 + v100**2)
    
    # 2. Convert to DataFrame
    df = w100.to_dataframe(name='wind_speed_100m').reset_index()
    
    # 3. Compute Ramp Rate (delta_speed / delta_t)
    df['ramp_rate_1h'] = df.groupby(['latitude', 'longitude'])['wind_speed_100m'].diff(1)
    
    # 4. Target Label: High-Wind Cut-Out Event (True if Speed >= 25 m/s)
    CUT_OUT_THRESHOLD = 25.0 # m/s
    df['cut_out_event'] = (df['wind_speed_100m'] >= CUT_OUT_THRESHOLD).astype(int)
    
    # 5. Turbine Power Curve Output Approximation (0% power when cut-out triggered)
    df['power_output_pct'] = np.where(df['wind_speed_100m'] >= CUT_OUT_THRESHOLD, 0.0, 1.0)
    
    return df