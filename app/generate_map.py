import os
import shutil
import math
import osmnx as ox
import geopandas as gpd
import matplotlib as mpl
import matplotlib.pyplot as plt
from matplotlib.patches import Ellipse, Rectangle, Polygon
from shapely.geometry import LineString, MultiLineString

ox.config(use_cache=False, log_console=False)

base_dir = os.path.dirname(os.path.abspath(__file__))
generated_dir = os.path.join(base_dir, "generated_maps")
if not os.path.exists(generated_dir):
    os.makedirs(generated_dir)

mpl.rcParams['svg.fonttype'] = 'none'

def generate_map(latitude=43.832197, longitude=4.349661, distance=150):
    png1 = os.path.join(generated_dir, "map_stylized.png")
    png2 = os.path.join(generated_dir, "map_stylized2.png")
    svg  = os.path.join(generated_dir, "map_stylized.svg")
    for f in (png1, png2, svg):
        if os.path.exists(f): os.remove(f)
    cache = ox.settings.cache_folder
    if os.path.exists(cache): shutil.rmtree(cache)

    # calcul de la bbox
    deg_lat = distance / 111320.0
    deg_lon = distance / (111320.0 * math.cos(math.radians(latitude)))
    north, south = latitude + deg_lat, latitude - deg_lat
    east,  west  = longitude + deg_lon, longitude - deg_lon

    # extraire tous les highways bruts
    raw = ox.geometries_from_bbox(north, south, east, west, {"highway": True})
    highways = raw[raw.geom_type.isin(["LineString","MultiLineString"])].explode(index_parts=False)
    highways["highway"] = highways["highway"].apply(lambda x: x[0] if isinstance(x, list) and x else x)

    # extraire graphe
    G = ox.graph_from_bbox(north, south, east, west,
                            network_type="all",
                            simplify=False,
                            retain_all=True,
                            truncate_by_edge=True)
    nodes, edges = ox.graph_to_gdfs(G)
    edges["highway"] = edges["highway"].apply(lambda x: x[0] if isinstance(x, list) and x else x)

    purple = "#800080"
    base_lw = 8
    road_styles = [
        ('motorway', purple, base_lw),
        ('trunk', purple, base_lw),
        ('primary', purple, base_lw * 1.2),
        ('secondary', purple, 6),
        ('tertiary', purple, 6),
        ('residential', purple, base_lw),
        ('living_street', purple, base_lw),
        ('unclassified', purple, base_lw),
        ('service', purple, 6),
        ('footway', '#ffffff', 4)
    ]
    extra_attrs = ['cycleway:left','busway:left','bicycle:lanes:backward','lane','share_busway']

    fig, ax = plt.subplots(figsize=(10,10))

    # tracer polygones et contours
    poly_cfg = [
        ('landuse','garden','#6CB257',0.5),
        ('leisure','garden','#6CB257',0.5),
        ('landuse','village_green','#6CB257',0.5),
        ('natural','water','#1375be',0.7),
        ('building',True,'#000000',1),
        ('amenity','school','#000000',1),
        ('leisure','park','#000000',1)
    ]
    for key,val,col,alpha in poly_cfg:
        df = ox.geometries_from_bbox(north, south, east, west, {key: val})
        if not df.empty:
            df2 = df.copy()
            df2['geometry'] = df2['geometry'].simplify(tolerance=0.00003, preserve_topology=True)
            df2.plot(ax=ax, color=col, alpha=alpha, zorder=1)
            df2.boundary.plot(ax=ax, color=col, linewidth=1, zorder=2)

    # tracer barrières (clôtures/murs) au-dessus
    barriers = ox.geometries_from_bbox(north, south, east, west, {"barrier": ["fence","wall"]})
    b = barriers[barriers.geom_type.isin(["LineString","MultiLineString"])].explode(index_parts=False)
    b.plot(ax=ax, color="#000000", linewidth=1.5, linestyle='--', zorder=10)

    # tracer highways bruts en fond
    highways.plot(ax=ax, color=purple, linewidth=base_lw, zorder=3)

    # tracer highways stylés
    for i, (hwy, col, lw) in enumerate(road_styles):
        sub = highways[highways['highway'] == hwy]
        if sub.empty: continue
        s2 = sub.copy()
        s2['geometry'] = s2['geometry'].simplify(tolerance=0.00003, preserve_topology=True)
        s2.plot(ax=ax, color=col, linewidth=lw, zorder=4 + i)

    # fallback graphe non présent dans highways
    rest = edges.loc[~edges.index.isin(highways.index)]
    if not rest.empty:
        r2 = rest.copy()
        r2['geometry'] = r2['geometry'].simplify(tolerance=0.00003, preserve_topology=True)
        r2.plot(ax=ax, color=purple, linewidth=base_lw, zorder=4)

    # attributs spéciaux
    for attr in extra_attrs:
        if attr in edges.columns:
            sub = edges[edges[attr].notna()]
            if not sub.empty:
                su = sub.copy()
                su['geometry'] = su['geometry'].simplify(tolerance=0.00003, preserve_topology=True)
                su.plot(ax=ax, color=purple, linewidth=base_lw, zorder=12)

    # flèches/losanges
    for _, row in edges.iterrows():
        geom = row.geometry
        if isinstance(geom, (LineString, MultiLineString)):
            line = geom if isinstance(geom, LineString) else geom.geoms[0]
            if line.length > 0:
                onew = row.get('oneway', False) in (True, 'yes')
                mid = line.interpolate(0.5 * line.length)
                x0, y0 = line.coords[0]; x1, y1 = line.coords[-1]
                dx, dy = x1 - x0, y1 - y0; n = math.hypot(dx, dy)
                if n == 0: continue
                dx, dy = dx/n, dy/n; cx, cy = mid.x, mid.y; t = 0.00005
                if onew:
                    verts = [(cx + dx*t, cy + dy*t),
                             (cx - dx*t - dy*t, cy - dy*t + dx*t),
                             (cx - dx*t + dy*t, cy - dy*t - dx*t)]
                else:
                    px, py = -dy, dx
                    verts = [(cx - dx*t, cy - dy*t),
                             (cx + px*t, cy + py*t),
                             (cx + dx*t, cy + dy*t),
                             (cx - px*t, cy - py*t)]
                ax.add_patch(Polygon(verts, closed=True, facecolor='#ff6600', zorder=11))

    # symboles piétons
    node_gdf = ox.graph_to_gdfs(G, nodes=True, edges=False)
    for _, row in node_gdf[node_gdf['highway'].isin(['crossing','bus_stop'])].iterrows():
        x, y = row.geometry.x, row.geometry.y
        ax.add_patch(Rectangle((x - 0.00004, y - 0.00004), 0.00008, 0.00008,
                               facecolor='#ff6600', edgecolor=None, zorder=13))

    # POIs
    poi = ['library','place_of_worship','museum','gallery','theatre','arts_centre']
    for key in poi:
        df = ox.geometries_from_bbox(north, south, east, west, {'amenity': key, 'tourism': key})
        for p in df.geometry.centroid:
            ax.add_patch(Ellipse((p.x, p.y), 0.00013, 0.00004,
                                  facecolor='#ff6600', zorder=9))

    # entrées
    ent = ox.geometries_from_bbox(north, south, east, west, {'entrance': True})
    for p in ent.geometry.centroid:
        ax.add_patch(Ellipse((p.x, p.y), 0.00013, 0.00004,
                              facecolor='#ff6600', zorder=9))

    ax.set_xlim(west, east)
    ax.set_ylim(south, north)
    ax.set_axis_off()

    plt.savefig(png1, dpi=300, bbox_inches='tight', pad_inches=0)
    plt.savefig(png2, dpi=150, bbox_inches='tight', pad_inches=0)
    plt.savefig(svg, format='svg', bbox_inches=0, pad_inches=0)
    plt.close()

    return svg
