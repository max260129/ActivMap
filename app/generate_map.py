import os
import shutil
import math
import osmnx as ox
import geopandas as gpd
import matplotlib as mpl
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse, Rectangle, PathPatch, Polygon
from matplotlib.path import Path
import numpy as np
import pandas as pd
import matplotlib.transforms as transforms
from shapely.geometry import LineString
import svgutils.compose as sc


# Définir un répertoire absolu pour les cartes générées
base_dir = os.path.dirname(os.path.abspath(__file__))
generated_dir = os.path.join(base_dir, "generated_maps")
if not os.path.exists(generated_dir):
    os.makedirs(generated_dir)


# Pour que le texte reste en format texte dans le SVG
mpl.rcParams['svg.fonttype'] = 'none'

def generate_map(latitude=43.832197, longitude=4.349661, distance=150):
    # --- Nettoyage des fichiers précédents ---
    output_png1 = os.path.join(generated_dir, "map_stylized.png")
    output_png2 = os.path.join(generated_dir, "map_stylized2.png")
    output_svg = os.path.join(generated_dir, "map_stylized.svg")

    for f in [output_png1, output_png2, output_svg]:
        if os.path.exists(f):
            os.remove(f)
            print(f"{f} supprimé.")
    
    cache_dir = ".osmnx_cache"
    if os.path.exists(cache_dir):
        shutil.rmtree(cache_dir)
        print(f"{cache_dir} supprimé.")
    
    # --- Paramètres de base ---
    purple_color = "#800080"  # Couleur violette pour certaines routes non piétonnes
    simplify_tolerance = 0.00003
    uniform_linewidth = 8

    # --- Paramètres pour les ellipses (POI) ---
    ellipse_width = 0.00013
    ellipse_height = 0.00004
    ellipse_color = "#ff6600"

    # --- Paramètres pour les entrées ---
    entrance_color = "#ff6600"
    entrance_marker = (4, 2, 0)  # Étoile
    entrance_markersize = 10

    # --- Paramètres pour les flèches/losanges (sens de circulation) ---
    symbol_color = "#ff6600"
    arrow_size = 0.00008
    diamond_size = 0.00008

    # --- Paramètres pour les arrêts de bus ---
    bus_stop_color = "#ff6600"  # Couleur orange pour les arrêts de bus
    bus_stop_size = 0.00008

    # --- Styles par couche ---
    styles = {
        "highway_crossing": {"color": "#ff6600", "marker": "s", "markersize": 16},
        "highway_bus_stop": {"color": bus_stop_color},
        "amenity_library": {"color": ellipse_color},
        "amenity_place_of_worship": {"color": ellipse_color},
        "tourism_museum": {"color": ellipse_color},
        "tourism_gallery": {"color": ellipse_color},
        "amenity_theatre": {"color": ellipse_color},
        "amenity_arts_centre": {"color": ellipse_color},
        "entrances": {"color": entrance_color, "marker": entrance_marker, "markersize": entrance_markersize},
        "highway_steps": {"color": "#ff6600", "linewidth": uniform_linewidth},
        "highway_footway": {"color": "#ffffff", "linewidth": uniform_linewidth},
        "highway_tertiary": {"color": purple_color, "linewidth": uniform_linewidth},
        "highway_living_street": {"color": purple_color, "linewidth": uniform_linewidth},
        "highway_residential": {"color": purple_color, "linewidth": uniform_linewidth},
        "highway_secondary": {"color": purple_color, "linewidth": uniform_linewidth},
        "leisure_garden": {"color": "#6bb05b", "alpha": 0.5},
        "landuse_village_green": {"color": "#6bb05b", "alpha": 0.5},
        "natural_water": {"color": "#1375be", "alpha": 0.7},
        "building": {"color": "#000000", "alpha": 1},
        "leisure_park": {"color": "#6CB257", "alpha": 0.5}
    }

    # --- Couches ---
    node_layers = [
        ("highway_crossing", "crossing"),
        ("highway_bus_stop", "bus_stop")
    ]
    polygon_layers = [
        ("leisure_park", {"leisure": "park"}),
        ("landuse_village_green", {"landuse": "village_green"}),
        ("leisure_garden", {"leisure": "garden"}),
        ("natural_water", {"natural": "water"}),
        ("building", {"building": True})
    ]
    road_layers = [
        ("highway_footway", "footway"),
        ("highway_residential", "residential"),
        ("highway_living_street", "living_street"),
        ("highway_tertiary", "tertiary"),
        ("highway_secondary", "secondary")
    ]
    steps_layer = ("highway_steps", "steps")
    
    # --- Fonctions utilitaires ---
    def safe_equals(df, col, val):
        if col in df.columns:
            return (df[col] == val)
        else:
            return pd.Series([False] * len(df), index=df.index)
    
    def add_stair_symbol(ax, linestring, color="#ff6600", scale=0.00015):
        if linestring.is_empty or len(linestring.coords) < 2:
            return
        coords = list(linestring.coords)
        x1, y1 = coords[0]
        x2, y2 = coords[-1]
        angle_radians = math.atan2(y2 - y1, x2 - x1) + math.pi / 2
        centroid = linestring.centroid
        cx, cy = centroid.x, centroid.y
        rects_local = [
            (0.00, 0.00, 0.8, 0.08),
            (0.15, 0.12, 0.5, 0.08),
            (0.30, 0.24, 0.3, 0.08),
        ]
        for (rx, ry, rw, rh) in rects_local:
            final_x = cx + (rx - 0.5)*scale
            final_y = cy + (ry - 0.5)*scale
            rect = Rectangle((final_x, final_y), rw*scale, rh*scale,
                             facecolor=color, edgecolor=None, zorder=15)
            t = transforms.Affine2D().rotate_around(cx, cy, angle_radians) + ax.transData
            rect.set_transform(t)
            ax.add_patch(rect)
    
    def add_crossing_symbol(ax, point, edges_gdf, width=0.00008, height=0.00008, color="#ff6600"):
        try:
            x, y = point.x, point.y
            distances = edges_gdf.geometry.distance(point)
            if distances.empty:
                angle_radians = 0
            else:
                closest_edge_idx = distances.idxmin()
                closest_edge = edges_gdf.loc[closest_edge_idx].geometry
                offset = 0.00001
                point_before = closest_edge.interpolate(closest_edge.project(point) - offset)
                point_after = closest_edge.interpolate(closest_edge.project(point) + offset)
                dx = point_after.x - point_before.x
                dy = point_after.y - point_before.y
                angle_radians = math.atan2(dy, dx)
            square = Rectangle((x - width/2, y - height/2), width, height,
                            facecolor=color, edgecolor=None, zorder=30)
            line_width = width * 0.15
            vertices = [
                (x - line_width/2, y - height/2),
                (x + line_width/2, y - height/2),
                (x + line_width/2, y + height/2),
                (x - line_width/2, y + height/2),
                (x - line_width/2, y - height/2)
            ]
            codes = [Path.MOVETO, Path.LINETO, Path.LINETO, Path.LINETO, Path.CLOSEPOLY]
            path = Path(vertices, codes)
            line = PathPatch(path, facecolor="black", edgecolor=None, zorder=31)
            t = transforms.Affine2D().rotate_around(x, y, angle_radians) + ax.transData
            square.set_transform(t)
            line.set_transform(t)
            ax.add_patch(square)
            ax.add_patch(line)
        except AttributeError:
            # Si le point n'a pas d'attributs x et y, essayer d'utiliser son centroïde
            try:
                centroid = point.centroid
                add_crossing_symbol(ax, centroid, edges_gdf, width, height, color)
            except Exception as e:
                print(f"Erreur lors du traitement d'un passage piéton: {e}")
                return
    
    def add_bus_stop_symbol(ax, point, width=bus_stop_size, height=bus_stop_size, color=bus_stop_color):
        try:
            x, y = point.x, point.y
            square = Rectangle((x - width/2, y - height/2), width, height,
                            facecolor=color, edgecolor=None, zorder=30)
            ax.add_patch(square)
        except AttributeError:
            # Si le point n'a pas d'attributs x et y, essayer d'utiliser son centroïde
            try:
                centroid = point.centroid
                add_bus_stop_symbol(ax, centroid, width, height, color)
            except Exception as e:
                print(f"Erreur lors du traitement d'un arrêt de bus: {e}")
                return
    
    def add_arrows_on_route(route_geometry, ax, is_one_way, start_node, end_node, nodes=None):
        if isinstance(route_geometry, LineString):
            line = route_geometry
        else:
            line = route_geometry.geoms[0]
        line_length = line.length
        if line_length == 0:
            return
        center_point = line.interpolate(0.5 * line_length)
        x_center, y_center = center_point.x, center_point.y
        coords = list(line.coords)
        x1, y1 = coords[0]
        x2, y2 = coords[-1]
        dx = x2 - x1
        dy = y2 - y1
        norm = math.hypot(dx, dy)
        if norm == 0:
            return
        dx /= norm
        dy /= norm
        if nodes is not None:
            start_coords = nodes.loc[start_node].geometry
            end_coords = nodes.loc[end_node].geometry
            dist_to_start = math.hypot(x1 - start_coords.x, y1 - start_coords.y)
            dist_to_end = math.hypot(x1 - end_coords.x, y1 - end_coords.y)
            if dist_to_start > dist_to_end:
                dx, dy = -dx, -dy
        if is_one_way:
            print("Ajout d'un triangle (sens unique)")
            triangle_vertices = [
                (x_center + dx * (arrow_size / 2), y_center + dy * (arrow_size / 2)),
                (x_center - dx * (arrow_size / 2) - dy * (arrow_size / 2),
                 y_center - dy * (arrow_size / 2) + dx * (arrow_size / 2)),
                (x_center - dx * (arrow_size / 2) + dy * (arrow_size / 2),
                 y_center - dy * (arrow_size / 2) - dx * (arrow_size / 2))
            ]
            triangle = Polygon(triangle_vertices, closed=True,
                               facecolor=symbol_color, edgecolor=None, zorder=20)
            ax.add_patch(triangle)
        else:
            print(f"Ajout d'un losange pour route double sens (start={start_node}, end={end_node})")
            perp_dx, perp_dy = -dy, dx
            diamond_vertices = [
                (x_center - dx * (diamond_size / 2), y_center - dy * (diamond_size / 2)),
                (x_center + perp_dx * (diamond_size / 2), y_center + perp_dy * (diamond_size / 2)),
                (x_center + dx * (diamond_size / 2), y_center + dy * (diamond_size / 2)),
                (x_center - perp_dx * (diamond_size / 2), y_center - perp_dy * (diamond_size / 2))
            ]
            diamond = Polygon(diamond_vertices, closed=True,
                              facecolor=symbol_color, edgecolor=None, zorder=20)
            ax.add_patch(diamond)
    
    def add_ellipses_for_poi(condition, layer_name):
        poi_subset = polygons[condition]
        print(f"{layer_name}: {len(poi_subset)} éléments")
        if not poi_subset.empty:
            poi_subset = poi_subset.copy()
            poi_subset['geometry'] = poi_subset['geometry'].centroid
            for point in poi_subset['geometry']:
                try:
                    ellipse = Ellipse((point.x, point.y), width=ellipse_width,
                                      height=ellipse_height, color=styles[layer_name]["color"], zorder=15)
                    ax.add_patch(ellipse)
                except AttributeError:
                    # Si le point n'a pas d'attributs x et y, utiliser son centroïde
                    try:
                        centroid = point.centroid
                        ellipse = Ellipse((centroid.x, centroid.y), width=ellipse_width,
                                         height=ellipse_height, color=styles[layer_name]["color"], zorder=15)
                        ax.add_patch(ellipse)
                    except Exception as e:
                        print(f"Erreur lors du traitement d'un POI: {e}")
                        continue
    
    # --- Téléchargement du graphe ---
    print(f"Téléchargement du graphe pour (lat={latitude}, lon={longitude}, dist={distance})")
    G = ox.graph_from_point((latitude, longitude), dist=distance, network_type="all", retain_all=True)
    nodes, edges = ox.graph_to_gdfs(G)
    print(f"Nœuds: {len(nodes)}, Arêtes: {len(edges)}")
    
    # Correction pour gérer les listes dans la colonne "highway"
    edges["highway"] = edges["highway"].apply(lambda x: str(x) if isinstance(x, list) else x)
    print("Types de highway dans edges:", edges["highway"].unique())
    
    # --- Téléchargement des polygones et POI ---
    tags = {"building": True, "leisure": True, "landuse": True, "natural": True,
            "amenity": True, "tourism": True, "highway": True}
    try:
        polygons = ox.features_from_point((latitude, longitude), tags, dist=distance)
        print(f"Polygones et POI: {len(polygons)}")
    except ox._errors.InsufficientResponseError:
        polygons = gpd.GeoDataFrame()
        print("Aucun polygone/POI correspondant : GDF vide.")
    
    # --- Téléchargement des entrées ---
    entrance_tags = {"entrance": True}
    entrances = ox.features_from_point((latitude, longitude), entrance_tags, dist=distance)
    print(f"Entrées: {len(entrances)}")
    
    # --- Téléchargement explicite des arrêts de bus ---
    print("Récupération explicite des arrêts de bus via features_from_point...")
    bus_stop_tags = {"highway": "bus_stop"}
    try:
        bus_stops = ox.features_from_point((latitude, longitude), bus_stop_tags, dist=distance)
        bus_stops = bus_stops[bus_stops.geometry.type == "Point"]
        print(f"Arrêts de bus récupérés (géométries) : {len(bus_stops)}")
    except ox._errors.InsufficientResponseError:
        bus_stops = gpd.GeoDataFrame()
        print("Aucun arrêt de bus trouvé dans cette zone.")
    
    # --- Création de la figure ---
    fig, ax = plt.subplots(figsize=(10, 10))
    
    # --- Tracé des polygones ---
    print("Tracé des polygones...")
    for layer_name, filter_dict in polygon_layers:
        if layer_name == "building":
            condition = polygons["building"].notna() if "building" in polygons.columns else pd.Series([False] * len(polygons), index=polygons.index)
        else:
            condition = pd.Series([True] * len(polygons), index=polygons.index)
            for key, value in filter_dict.items():
                condition &= (polygons[key] == value) if key in polygons.columns else False
        subset = polygons[condition]
        print(f"{layer_name}: {len(subset)} éléments")
        if not subset.empty:
            subset = subset.copy()
            subset['geometry'] = subset['geometry'].simplify(tolerance=simplify_tolerance, preserve_topology=True)
            subset.plot(ax=ax, color=styles[layer_name]["color"], alpha=styles[layer_name].get("alpha", 1), zorder=1)
    
    # --- Tracé des routes depuis le graphe ---
    print("Tracé des routes depuis le graphe...")
    for layer_name, highway_value in road_layers:
        sub = edges[edges["highway"] == highway_value]
        print(f"{layer_name}: {len(sub)} éléments")
        if not sub.empty:
            sub = sub.copy()
            sub['geometry'] = sub['geometry'].simplify(tolerance=simplify_tolerance, preserve_topology=True)
            sub.plot(ax=ax, color=styles[layer_name]["color"], linewidth=uniform_linewidth, zorder=2)
            if highway_value in ["residential", "living_street", "tertiary", "secondary"]:
                for idx, edge in sub.iterrows():
                    route_geometry = edge.geometry
                    oneway_value = edge.get('oneway', False)
                    is_one_way = (oneway_value.lower() == 'yes') if isinstance(oneway_value, str) else bool(oneway_value)
                    start_node = edge.name[0]
                    end_node = edge.name[1]
                    add_arrows_on_route(route_geometry, ax, is_one_way, start_node, end_node, nodes=nodes)
    
    # --- Récupération explicite des routes residential ---
    print("Récupération explicite des routes residential via features_from_point...")
    try:
        residential_roads = ox.features_from_point((latitude, longitude),
                                                   tags={"highway": "residential"},
                                                   dist=distance)
        residential_roads = residential_roads[residential_roads.geometry.type == "LineString"]
        print(f"Routes residential récupérées (géométries) : {len(residential_roads)}")
    except ox._errors.InsufficientResponseError:
        residential_roads = gpd.GeoDataFrame()
        print("Aucune route residential trouvée dans cette zone.")
    
    if not residential_roads.empty:
        residential_roads['geometry'] = residential_roads['geometry'].simplify(tolerance=simplify_tolerance, preserve_topology=True)
        residential_roads.plot(ax=ax, color=purple_color, linewidth=uniform_linewidth, zorder=2)
        for idx, edge in residential_roads.iterrows():
            route_geometry = edge.geometry
            oneway_value = edge.get('oneway', False)
            is_one_way = (oneway_value.lower() == 'yes') if isinstance(oneway_value, str) else bool(oneway_value)
            if isinstance(route_geometry, LineString):
                coords = list(route_geometry.coords)
                start_node = coords[0]
                end_node = coords[-1]
                add_arrows_on_route(route_geometry, ax, is_one_way, start_node, end_node)
    
    # --- Téléchargement et tracé des escaliers ---
    print("Récupération explicite des escaliers via features_from_point...")
    try:
        stairs_gdf = ox.features_from_point((latitude, longitude),
                                            tags={"highway": "steps"},
                                            dist=distance)
        print(f"Escaliers récupérés (géométries) : {len(stairs_gdf)}")
    except ox._errors.InsufficientResponseError:
        stairs_gdf = gpd.GeoDataFrame()
        print("Aucun escalier trouvé dans cette zone.")
    
    if not stairs_gdf.empty:
        stairs_gdf['geometry'] = stairs_gdf['geometry'].simplify(tolerance=simplify_tolerance, preserve_topology=True)
        for _, row in stairs_gdf.iterrows():
            add_stair_symbol(ax, row.geometry, color="#ff6600", scale=0.00015)
    
    print("Tracé des escaliers depuis le graphe (edges)...")
    layer_name, highway_value = steps_layer
    sub = edges[edges["highway"] == highway_value]
    print(f"{layer_name}: {len(sub)} éléments (dans edges)")
    if not sub.empty:
        sub = sub.copy()
        sub['geometry'] = sub['geometry'].simplify(tolerance=simplify_tolerance, preserve_topology=True)
        sub.plot(ax=ax, color=styles[layer_name]["color"], linewidth=uniform_linewidth, zorder=5)
    
    # --- Tracé des passages piétons et arrêts de bus (depuis les nœuds du graphe) ---
    print("Tracé des passages piétons et arrêts de bus (depuis les nœuds du graphe)...")
    for layer_name, node_value in node_layers:
        sub_nodes = nodes[nodes["highway"] == node_value]
        print(f"{layer_name}: {len(sub_nodes)} éléments")
        if not sub_nodes.empty:
            for _, row in sub_nodes.iterrows():
                point = row.geometry
                if node_value == "crossing":
                    add_crossing_symbol(ax, point, edges, width=0.00008, height=0.00008, color=styles[layer_name]["color"])
                elif node_value == "bus_stop":
                    add_bus_stop_symbol(ax, point, width=bus_stop_size, height=bus_stop_size, color=styles[layer_name]["color"])
    
    # --- Tracé des arrêts de bus (depuis features_from_point) ---
    print("Tracé des arrêts de bus (depuis features_from_point)...")
    if not bus_stops.empty:
        for _, row in bus_stops.iterrows():
            point = row.geometry
            add_bus_stop_symbol(ax, point, width=bus_stop_size, height=bus_stop_size, color=styles["highway_bus_stop"]["color"])
    
    # --- Tracé des points d'intérêt (POI) ---
    print("Tracé des bibliothèques...")
    add_ellipses_for_poi(safe_equals(polygons, "amenity", "library"), "amenity_library")
    print("Tracé des lieux de culte...")
    add_ellipses_for_poi(safe_equals(polygons, "amenity", "place_of_worship"), "amenity_place_of_worship")
    print("Tracé des musées...")
    add_ellipses_for_poi(safe_equals(polygons, "tourism", "museum"), "tourism_museum")
    print("Tracé des galeries...")
    add_ellipses_for_poi(safe_equals(polygons, "tourism", "gallery"), "tourism_gallery")
    print("Tracé des théâtres...")
    add_ellipses_for_poi(safe_equals(polygons, "amenity", "theatre"), "amenity_theatre")
    print("Tracé des centres d'art...")
    add_ellipses_for_poi(safe_equals(polygons, "amenity", "arts_centre"), "amenity_arts_centre")
    
    # --- Tracé des entrées ---
    print("Tracé des entrées...")
    if not entrances.empty:
        entrances_nodes = entrances[entrances['geometry'].geom_type == 'Point']
        print(f"Entrées (nœuds): {len(entrances_nodes)}")
        if not entrances_nodes.empty:
            entrances_nodes.plot(ax=ax, color=entrance_color, marker=entrance_marker,
                                 markersize=entrance_markersize * 2, zorder=15)
    
    # --- Ajustement du zoom et sauvegarde ---
    deg_lat = distance / 111320.0
    deg_lon = distance / (111320.0 * math.cos(math.radians(latitude)))
    ax.set_xlim(longitude - deg_lon, longitude + deg_lon)
    ax.set_ylim(latitude - deg_lat, latitude + deg_lat)
    ax.set_axis_off()
    
    plt.savefig(output_png1, dpi=300, bbox_inches="tight", pad_inches=0)
    print(f"Carte PNG générée : {output_png1}")
    plt.savefig(output_png2, dpi=150, bbox_inches="tight", pad_inches=0)
    print(f"Carte PNG générée : {output_png2}")
    plt.savefig(output_svg, format="svg", bbox_inches=0, pad_inches=0)
    print(f"Carte SVG générée : {output_svg}")
    plt.close()
    
    return output_svg

if __name__ == "__main__":
    generate_map() 