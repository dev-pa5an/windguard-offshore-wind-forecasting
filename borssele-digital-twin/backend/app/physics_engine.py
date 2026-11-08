def compute_turbine_power(wind_speed: float, rating_mw: float = 8.0, efficiency: float = 0.96) -> float:
    """
    Computes turbine power output using the kinetic energy formula:
    P = 0.5 * rho * A * v^3
    where rho = 1.225 kg/m^3 (air density) and A = 18,626 m^2 (swept area for 8MW turbine).
    """
    if wind_speed < 3.0 or wind_speed >= 25.0:
        return 0.0
        
    air_density = 1.225
    rotor_area = 18626.0  # standard for 164m rotor diameter
    
    raw_power_watts = 0.5 * air_density * rotor_area * (wind_speed ** 3)
    raw_power_mw = (raw_power_watts * efficiency) / 1e6
    
    return float(round(min(rating_mw, raw_power_mw), 2))