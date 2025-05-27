import geopandas as gpd

# 1. 读取热力图数据
hexbin_gdf = gpd.read_file("/Users/likun/USS/GMPDV/Assessment/Group Assessment/Assessment/Business_and_consumption/Data/hexbin_layer_with_visual.geojson")

# 2. 读取巴黎边界（假设为单一 Polygon 或 MultiPolygon）
paris_boundary = gpd.read_file("/Users/likun/USS/GMPDV/Assessment/Group Assessment/Assessment/Data/Business and Consumption/boundary paris_boundary_no_interborder.geojson")

# 3. 确保坐标系一致（如有必要）
if hexbin_gdf.crs != paris_boundary.crs:
    paris_boundary = paris_boundary.to_crs(hexbin_gdf.crs)

# 4. 执行空间裁剪
clipped = gpd.overlay(hexbin_gdf, paris_boundary, how="intersection")

# 5. 保存为新文件
clipped.to_file("hexbin_clipped_to_paris.geojson", driver="GeoJSON")