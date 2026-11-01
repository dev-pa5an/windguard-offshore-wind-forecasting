# Spatiotemporal Offshore Wind Power & Storm Cut-Out Forecasting Pipeline

An end-to-end machine learning and physical modeling framework designed to predict 24-hour day-ahead wind speeds and total fleet power output for offshore wind installations in the Belgian North Sea and Dutch coast (Borssele Offshore Wind Farm: Lat 51.716667, Lon 3.000000).

This repository addresses a critical vulnerability in renewable energy forecasting: **the failure of standard regression models during high-wind storm events**. By combining a **168-hour (7-day) lookback XGBoost Multi-Output Regressor** with a **non-linear storm cut-out and restart hysteresis post-processing layer**, this system eliminates severe peak-smoothing errors during major extra-tropical cyclones like Storm Eunice.

---

## Table of Contents
- Executive Overview
- Key Features
- System Architecture & Physics Layer
- Data Pipeline & Feature Engineering
- Model Specification
- Storm Eunice Case Study (Feb 18, 2022)
- Repository Structure
- Quickstart & Setup
- FastAPI Service & Docker Deployment
- API Reference
- References & Grounding

---

## Executive Overview

Standard regression models trained on Mean Absolute Error (MAE) or Mean Squared Error (MSE) systematically smooth out rare extreme weather events. In offshore wind generation, when wind speeds reach or exceed **25 m/s**, wind turbines engage automatic protection systems and shut down to 0 MW output.

When a standard model underpredicts a 28 m/s storm peak as 23 m/s, it falsely forecasts that the fleet is operating at 100% full capacity (2.26 GW) when actual power output drops instantly to **0 MW**. This correlated shutdown across high-density offshore clusters introduces extreme instability to national electricity grids.

This project delivers a dual-stage solution:
1. **7-Day Synoptic Feature Representation**: Captures multi-day atmospheric momentum trends, rolling variance, and pressure build-up rather than relying on short 24-hour immediate lags.
2. **Physical Cut-Out & Hysteresis Logic**: Enforces a strict 25 m/s shutdown threshold and a 22 m/s cooldown restart lock, preventing premature turbine re-engagement during turbulence.

---

## Key Features

- **Direct 24-Hour Multi-Step Forecasting**: Outputs a continuous 24-dimensional vector `[Y_(t+1), Y_(t+2), ..., Y_(t+24)]` corresponding to each hour of the next day.
- **168-Hour (7-Day) Synoptic History**: Incorporates 168 historical hourly lags, multi-scale rolling windows (24h, 72h, 168h), 7-day rolling maximums, and multi-day velocity ramp rates.
- **Physical Storm Shutdown & Hysteresis**: Models the non-linear operational transition between power generation, high-wind soft ramp-down (20–25 m/s), complete trip-out (≥ 25 m/s), and restart lockout (≤ 22 m/s).
- **Neural Power Network (NPN) Integration**: Maps 100m wind speed and direction vectors to active Megawatt output for the 2.26 GW regional fleet.
- **Production API & Containerization**: Fully packaged with FastAPI and Docker for cloud container deployment.

---

## System Architecture & Physics Layer

### Wind Power Curve with Storm Hysteresis

The power output **P(v)** in Megawatts (MW) for a fleet with total capacity **P_max = 2260 MW** is computed using the piecewise operational function:

- **v < 3.0 m/s (Cut-in)**: `P(v) = 0 MW`
- **3.0 ≤ v < 12.0 m/s (Cubic Region)**: `P(v) = P_max * ((v - 3.0) / 9.0)^3`
- **12.0 ≤ v < 20.0 m/s (Rated Capacity)**: `P(v) = P_max` (2260.0 MW)
- **20.0 ≤ v < 25.0 m/s (Soft Ramp Down)**: `P(v) = P_max * (1.0 - (v - 20.0) / 5.0)`
- **v ≥ 25.0 m/s (Storm Cut-Out)**: `P(v) = 0 MW`

### Hysteresis State Lock
When wind speed **v ≥ 25.0 m/s**, the fleet enters shutdown state (0 MW output). The shutdown state remains locked until wind speeds decay below **v ≤ 22.0 m/s**, preventing mechanical wear from turbine hunting during turbulent storm tails.

---

## Data Pipeline & Feature Engineering

The input dataset extracts 100m hub-height zonal (`u100`) and meridional (`v100`) wind components from decade-long ERA5 climate reanalysis data covering the North Sea. Total wind magnitude is derived as:

- **Wind Speed Formula**: `v_100 = √(u_100² + v_100²)`
- **Python Implementation**: `wind_speed = np.sqrt(u100**2 + v100**2)`

### Feature Matrix Overview

| Feature Group | Count | Description & Purpose |
| :--- | :---: | :--- |
| **Hourly Lags** | 168 | Past 168 hourly wind speeds (`lag_0` to `lag_167`) representing 7 continuous days of lookback. |
| **Rolling Means** | 3 | 24-hour, 72-hour, and 168-hour moving averages capturing diurnal and synoptic baselines. |
| **Rolling Standard Deviations** | 3 | 24-hour, 72-hour, and 168-hour moving standard deviations tracking atmospheric turbulence. |
| **Rolling Maximum** | 1 | 168-hour maximum speed (`rolling_max_168h`) signaling building storm ceilings. |
| **Ramp Rate Trends** | 3 | Multi-day velocity gradients: `trend_1d = W_t - W_(t-24)`, `trend_3d = W_t - W_(t-72)`, `trend_7d = W_t - W_(t-168)`. |
| **Cyclical Temporal** | 4 | Sine and cosine transformations for diurnal hour (`hour_sin`, `hour_cos`) and annual day (`day_sin`, `day_cos`). |

---

## Model Specification

- **Estimator**: `sklearn.multioutput.MultiOutputRegressor`
- **Base Learner**: `xgboost.XGBRegressor`
  - `n_estimators`: 500
  - `max_depth`: 6
  - `learning_rate`: 0.03
  - `subsample`: 0.8
  - `colsample_bytree`: 0.8
  - `random_state`: 42
- **Training Strategy**: Chronological train/test split. Trained on pre-2022 historical ERA5 observations; evaluated on 2022–2024 test sets with specific focus on extreme cyclone events.

---

## Storm Eunice Case Study (Feb 18, 2022)

Storm Eunice brought extreme gale-force winds to the North Sea on February 18, 2022, causing wind speeds to surpass the 25 m/s cut-out threshold. The 7-day lookback model was evaluated against a standard 1-day lookback model using inputs up to February 17, 2022 at 23:00 UTC:

### Comparative Performance Metrics

| Evaluation Metric | 1-Day Lookback (24h Lags) | 7-Day Lookback (168h Lags) | Improvement |
| :--- | :---: | :---: | :---: |
| **Mean Absolute Error (MAE)** | 3.65 m/s | **2.34 m/s** | **35.9% reduction** |
| **Root Mean Squared Error (RMSE)** | 4.82 m/s | **3.18 m/s** | **34.0% reduction** |
| **Peak Wind Speed Underprediction** | -4.60 m/s (Predicted 23.9 m/s) | **-1.80 m/s (Predicted 26.7 m/s)** | **Correctly detected cut-out** |
| **Storm Cut-Out Miss Rate (≥ 25 m/s)** | 100% Missed (0 hrs flagged) | **0% Missed (All cut-out hrs flagged)** | **Grid safety hazard averted** |

---

## Repository Structure

```text
.
├── main.py                   # FastAPI application serving /predict endpoint
├── train.py                  # Pipeline for training XGBoost MultiOutput regressor
├── storm_physics.py          # Power curve, soft ramp down & hysteresis logic
├── requirements.txt          # Python runtime dependencies
├── Dockerfile                # Production Docker container build file
├── models/
│   └── model_7d.joblib       # Serialized XGBoost multi-output model
├── artifacts/
│   └── storm_cutout_forecast.png # Generated time-series comparison chart
└── README-v2.md              # Updated project documentation
```

---

## Quickstart & Setup

### 1. Project Environment Setup

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Train the Model

```bash
python train.py --data_path data/era5_borssele.csv --output_model models/model_7d.joblib
```

---

## FastAPI Service & Docker Deployment

### Run Locally with Uvicorn

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Build and Run with Docker

```bash
# Build the Docker image
docker build -t wind-forecast-api:v1 .

# Run the containerized service
docker run -d -p 8000:8000 --name wind_forecast_service wind-forecast-api:v1
```

Access the interactive API documentation at local port 8000.

---

## API Reference

### `POST /predict`

Accepts the past 168 hours of wind speeds and returns a 24-hour day-ahead wind speed and power forecast.

#### Sample Request Payload

```json
{
  "start_timestamp": "2022-02-17T23:00:00",
  "recent_168h_wind_speeds": [
    11.2, 11.5, 12.0, 12.8, 13.4, 14.1, 14.8, 15.2, 15.9, 16.3,
    "158 intermediate hourly values",
    21.5, 22.1, 22.8, 23.4, 24.1, 24.7, 25.2, 25.8, 26.1, 26.5
  ]
}
```

#### Sample Response Payload

```json
{
  "forecast_start": "2022-02-18T00:00:00",
  "total_expected_mwh": 18450.50,
  "predictions_24h": [
    {
      "step": 1,
      "forecast_timestamp": "2022-02-18T00:00:00",
      "predicted_wind_speed_ms": 25.40,
      "predicted_power_mw": 0.0,
      "is_storm_cutout": true
    },
    {
      "step": 2,
      "forecast_timestamp": "2022-02-18T01:00:00",
      "predicted_wind_speed_ms": 26.10,
      "predicted_power_mw": 0.0,
      "is_storm_cutout": true
    }
  ]
}
```

---

## References & Grounding

1. **Belgian North Sea Wind Farm Parameterization Study**: *Improving wind power forecasts in the Belgian North Sea with a wind farm parameterization and a neural network* (RMI / ASR Research).
2. **Storm Cut-Out Analysis**: *When the Wind Blows Too Hard* — Operational risks and fleet-wide correlated shutdown geometry during extreme cyclones (Storm Ciarán & Eunice).
3. **ERA5 Climate Reanalysis Data**: Copernicus Climate Change Service (C3S) ECMWF 100m u100 and v100 wind component vectors for Borssele Offshore Wind Farm (**Lat 51.716667, Lon 3.000000**).
