import geopandas as gpd
import pandas as pd
from shapely.geometry import Point

# === 路径设置 ===
commerce_csv_path = "Data/Business and Consumption/COMMERCE_CULTUREL_with_arrondissement.csv"
boundary_geojson_path = "Data/Business and Consumption/boundary paris_boundary.geojson"
output_geojson_path = "commerce_filtered.geojson"

# === 1. 加载商业 CSV 并转换为 GeoDataFrame ===
df = pd.read_csv(commerce_csv_path)
gdf_commerce = gpd.GeoDataFrame(
    df,
    geometry=gpd.points_from_xy(df.longitude, df.latitude),
    crs="EPSG:4326"
)

# === 2. 加载巴黎边界 GeoJSON ===
gdf_boundary = gpd.read_file(boundary_geojson_path).to_crs("EPSG:4326")

# === 3. 过滤点是否在边界内 ===
gdf_filtered = gdf_commerce[gdf_commerce.geometry.within(gdf_boundary.unary_union)]

# === 4. 保存为 GeoJSON ===
gdf_filtered.to_file(output_geojson_path, driver="GeoJSON")
print(f"✅ 过滤完成，结果保存至: {output_geojson_path}")