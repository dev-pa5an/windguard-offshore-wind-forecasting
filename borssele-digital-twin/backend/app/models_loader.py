import os
from pathlib import Path
from typing import Dict
import lightgbm as lgb

def load_lightgbm_models(model_dir: Path) -> Dict[str, lgb.Booster]:
    """Loads 24 sequential LightGBM model boosters (model_h1.txt through model_h24.txt)."""
    models: Dict[str, lgb.Booster] = {}
    
    if not model_dir.exists():
        print(f"Warning: Model directory {model_dir} does not exist.")
        return models

    print(f"Loading LightGBM model boosters from {model_dir}...")
    for h in range(1, 25):
        # Matches model_h1.txt ... model_h24.txt (or lgb_model_h_1.txt if customized)
        m_file = model_dir / f"model_h{h}.txt"
        if not m_file.exists():
            m_file = model_dir / f"lgb_model_h_{h}.txt"
            
        if m_file.exists():
            try:
                models[f"h_{h}"] = lgb.Booster(model_file=str(m_file))
            except Exception as e:
                print(f"Error loading model h_{h}: {e}")
        else:
            print(f"Warning: Missing model file for horizon h_{h}")
            
    return models