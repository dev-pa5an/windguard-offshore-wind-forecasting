# we need,
# 100 m hub height wind components (u100 & v100)
# 10 m gust components (i10fg) over North Sea offshore wind corridors.
import cdsapi

def fetch_era5_storm_data(output_filename, year, month, days):
    c = cdsapi.Client()
    c.retrieve(
        'reanalysis-era5-single-levels',
        {
            'product_type': 'reanalysis',
            'format': 'netcdf',
            'variable': [
                '100m_u_component_of_wind',
                '100m_v_component_of_wind',
                'instantaneous_10m_wind_gust_since_previous_post_processing',
            ],
            'year': str(year),
            'month': str(month),
            'day': days,
            'time': [f"{h:02d}:00" for h in range(24)],
            'area': [4, 8-10], # North Sea offshore wind corridor bounding box
        },
        output_filename
    )
