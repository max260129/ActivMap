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
    print("USING MODIFIED VERSION WITH ALL FEATURES")
    
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
    purple_color = "#800080"  
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
        "leisure_park": {"color": "#6CB257", "alpha": 0.5},
        "highway_primary": {"color": purple_color, "linewidth": uniform_linewidth*1.2},  # Increased width for primary
        "highway_trunk": {"color": purple_color, "linewidth": uniform_linewidth},
        "highway_motorway": {"color": purple_color, "linewidth": uniform_linewidth},
        "highway_service": {"color": purple_color, "linewidth": uniform_linewidth},
        "highway_unclassified": {"color": purple_color, "linewidth": uniform_linewidth},
        "amenity_school": {"color": "#000000", "alpha": 1},  # Écoles en noir
        "cycleway_left": {"color": purple_color, "linewidth": uniform_linewidth},
        "busway_left": {"color": purple_color, "linewidth": uniform_linewidth},
        "bicycle_lanes_backward": {"color": purple_color, "linewidth": uniform_linewidth},
        "lane": {"color": purple_color, "linewidth": uniform_linewidth},
        "share_busway": {"color": purple_color, "linewidth": uniform_linewidth},
    }

    # --- Couches ---
    node_layers = [
        ("highway_crossing", "crossing"),
        ("highway_bus_stop", "bus_stop")
    ]
    
    # Ajout des écoles aux polygones
    polygon_layers = [
        ("leisure_park", {"leisure": "park"}),
        ("landuse_village_green", {"landuse": "village_green"}),
        ("leisure_garden", {"leisure": "garden"}),
        ("natural_water", {"natural": "water"}),
        ("building", {"building": True}),
        ("amenity_school", {"amenity": "school"})  # Ajout des écoles
    ]
    
    # Définir l'ordre de rendu des routes (du moins important au plus important)
    # Ajout de tous les types de routes possibles selon la hiérarchie OSM
    road_layers = [
        ("highway_footway", "footway"),
        ("highway_service", "service"),
        ("highway_unclassified", "unclassified"),
        ("highway_residential", "residential"),
        ("highway_living_street", "living_street"),
        ("highway_tertiary", "tertiary"),
        ("highway_secondary", "secondary"),
        ("highway_primary", "primary"),
        ("highway_trunk", "trunk"),
        ("highway_motorway", "motorway"),
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
    
    def add_arrows_on_route(route_geometry, ax, is_one_way, start_node=None, end_node=None, nodes=None):
        if isinstance(route_geometry, LineString):
            line = route_geometry
        else:
            try:
                line = route_geometry.geoms[0]
            except AttributeError:
                print(f"Géométrie non supportée: {type(route_geometry)}")
                return
                
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
        
        # Vérifier si nous avons des informations sur les nœuds
        if nodes is not None and start_node is not None and end_node is not None:
            try:
                start_coords = nodes.loc[start_node].geometry
                end_coords = nodes.loc[end_node].geometry
                dist_to_start = math.hypot(x1 - start_coords.x, y1 - start_coords.y)
                dist_to_end = math.hypot(x1 - end_coords.x, y1 - end_coords.y)
                if dist_to_start > dist_to_end:
                    dx, dy = -dx, -dy
            except (KeyError, AttributeError) as e:
                print(f"Erreur lors de l'accès aux nœuds: {e}")
                # Continuer sans ajuster la direction
                
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
            print(f"Ajout d'un losange pour route double sens")
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
    # Utiliser network_type="all" pour récupérer tous les types de routes
    G = ox.graph_from_point((latitude, longitude), dist=distance, network_type="all", retain_all=True)
    nodes, edges = ox.graph_to_gdfs(G)
    print(f"Nœuds: {len(nodes)}, Arêtes: {len(edges)}")
    
    # Correction pour gérer les listes dans la colonne "highway"
    # si c'est une liste, on prend son premier élément
    edges["highway"] = edges["highway"].apply(
        lambda x: x[0] if isinstance(x, list) and len(x) > 0 else x
    )
    
    # Afficher tous les types de routes disponibles pour le débogage
    highway_types = sorted(edges["highway"].dropna().unique())
    print("→ Highway types disponibles:", highway_types)
    
    # Afficher toutes les colonnes disponibles dans edges pour le débogage
    print("→ Colonnes disponibles dans edges:", edges.columns.tolist())
    
    # --- Téléchargement des polygones et POI ---
    tags = {
        "building": True, 
        "leisure": True, 
        "landuse": True, 
        "natural": True,
        "amenity": True, 
        "tourism": True, 
        "highway": True,
        "cycleway": True,
        "busway": True,
        "bicycle": True,
        "lane": True,
        "share_busway": True
    }
    
    try:
        polygons = ox.features_from_point((latitude, longitude), tags, dist=distance)
        print(f"Polygones et POI: {len(polygons)}")
        
        # Afficher toutes les colonnes disponibles dans polygons pour le débogage
        print("→ Colonnes disponibles dans polygons:", polygons.columns.tolist())
        
        # Afficher les valeurs uniques pour amenity pour le débogage
        if 'amenity' in polygons.columns:
            amenity_values = sorted(polygons['amenity'].dropna().unique())
            print("→ Valeurs uniques pour amenity:", amenity_values)
        
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
        elif layer_name == "amenity_school":
            condition = safe_equals(polygons, "amenity", "school")
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
    # Définir un zorder de base pour les routes et l'incrémenter pour chaque type
    # pour assurer que les routes plus importantes sont au-dessus des moins importantes
    base_road_zorder = 5
    
    print("Tracé des routes depuis le graphe...")
    for i, (layer_name, highway_value) in enumerate(road_layers):
        sub = edges[edges["highway"] == highway_value]
        print(f"{layer_name}: {len(sub)} éléments")
        if not sub.empty:
            sub = sub.copy()
            sub['geometry'] = sub['geometry'].simplify(tolerance=simplify_tolerance, preserve_topology=True)
            # Utiliser un zorder croissant pour chaque type de route
            current_zorder = base_road_zorder + i
            sub.plot(ax=ax, color=styles[layer_name]["color"], linewidth=styles[layer_name]["linewidth"], zorder=current_zorder)
            print(f"  → Rendu avec zorder={current_zorder}")
            
            # Ajouter des flèches/losanges pour indiquer le sens de circulation
            if highway_value in ["residential", "living_street", "tertiary", "secondary", "primary", "trunk", "motorway", "unclassified"]:
                for idx, edge in sub.iterrows():
                    route_geometry = edge.geometry
                    oneway_value = edge.get('oneway', False)
                    is_one_way = oneway_value is True or oneway_value == 'yes'
                    
                    # Vérifier si idx est un tuple de 2 éléments (u, v) comme attendu
                    if isinstance(idx, tuple) and len(idx) == 2:
                        start_node, end_node = idx
                        add_arrows_on_route(route_geometry, ax, is_one_way, start_node, end_node, nodes)
                    else:
                        # Si idx n'est pas un tuple de 2 éléments, passer None pour start_node et end_node
                        print(f"Index non standard pour l'arête: {idx}, type: {type(idx)}")
                        add_arrows_on_route(route_geometry, ax, is_one_way)
    
    # --- Traitement des attributs spécifiques des routes ---
    print("Traitement des attributs spécifiques des routes...")
    
    # Liste des attributs spécifiques à vérifier
    specific_attributes = [
        "cycleway:left", 
        "busway:left", 
        "bicycle:lanes:backward",
        "lane",
        "share_busway"
    ]
    
    # Pour chaque attribut spécifique, vérifier s'il existe dans les colonnes de edges
    for attr in specific_attributes:
        attr_key = attr.replace(":", "_")
        if attr in edges.columns:
            sub = edges[edges[attr].notna()]
            print(f"{attr}: {len(sub)} éléments")
            if not sub.empty:
                sub = sub.copy()
                sub['geometry'] = sub['geometry'].simplify(tolerance=simplify_tolerance, preserve_topology=True)
                # Utiliser un zorder élevé pour ces routes spéciales
                current_zorder = base_road_zorder + len(road_layers) + 1
                sub.plot(ax=ax, color=purple_color, linewidth=uniform_linewidth, zorder=current_zorder)
                print(f"  → Rendu avec zorder={current_zorder}")
    
    # --- Vérification spécifique pour les routes primaires ---
    primary_roads = edges[edges["highway"] == "primary"]
    print(f"Routes primaires: {len(primary_roads)} éléments")
    if not primary_roads.empty:
        primary_roads = primary_roads.copy()
        primary_roads['geometry'] = primary_roads['geometry'].simplify(tolerance=simplify_tolerance, preserve_topology=True)
        # Utiliser un zorder très élevé pour s'assurer que les routes primaires sont visibles
        primary_zorder = base_road_zorder + len(road_layers) + 2
        primary_roads.plot(ax=ax, color=purple_color, linewidth=uniform_linewidth*1.2, zorder=primary_zorder)
        print(f"  → Rendu des routes primaires avec zorder={primary_zorder}")
    
    # --- Tracé des escaliers ---
    sub_steps = edges[edges["highway"] == "steps"]
    print(f"highway_steps: {len(sub_steps)} éléments")
    if not sub_steps.empty:
        sub_steps = sub_steps.copy()
        sub_steps['geometry'] = sub_steps['geometry'].simplify(tolerance=simplify_tolerance, preserve_topology=True)
        sub_steps.plot(ax=ax, color=styles["highway_steps"]["color"], linewidth=styles["highway_steps"]["linewidth"], zorder=base_road_zorder + len(road_layers))
        for _, edge in sub_steps.iterrows():
            add_stair_symbol(ax, edge.geometry)
    
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
