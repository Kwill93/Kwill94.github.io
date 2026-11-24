#!/usr/bin/env python3
"""Fetch home/commercial service companies within 50 miles of downtown
Indianapolis from OpenStreetMap (Overpass API) and write data/companies.json.

Usage: python3 scripts/fetch_osm.py
"""
import json, math, os, sys, time, urllib.parse, urllib.request

CENTER = (39.7684, -86.1581)          # Monument Circle, Indianapolis
RADIUS_M = 80467                      # 50 miles
ENDPOINTS = ["https://overpass-api.de/api/interpreter",
             "https://overpass.kumi.systems/api/interpreter"]

# (OSM key, value) -> dashboard category
CATEGORIES = {
    ("craft", "hvac"): "HVAC",
    ("shop", "hvac"): "HVAC",
    ("craft", "plumber"): "Plumbing",
    ("shop", "plumber"): "Plumbing",
    ("craft", "electrician"): "Electrical",
    ("craft", "gardener"): "Landscaping",
    ("craft", "landscaper"): "Landscaping",
    ("craft", "landscape_gardener"): "Landscaping",
    ("office", "landscape_architect"): "Landscaping",
    ("shop", "garden_centre"): None,  # retail, excluded
    ("craft", "roofer"): "Roofing",
    ("craft", "painter"): "Painting",
    ("craft", "carpenter"): "Carpentry",
    ("craft", "builder"): "General Contractor",
    ("office", "construction_company"): "General Contractor",
    ("craft", "insulation"): "Insulation",
    ("craft", "tiler"): "Flooring & Tile",
    ("craft", "floorer"): "Flooring & Tile",
    ("shop", "flooring"): "Flooring & Tile",
    ("craft", "glaziery"): "Windows & Glass",
    ("craft", "window_construction"): "Windows & Glass",
    ("craft", "locksmith"): "Locksmith",
    ("shop", "locksmith"): "Locksmith",
    ("craft", "pest_control"): "Pest Control",
    ("shop", "pest_control"): "Pest Control",
    ("office", "pest_control"): "Pest Control",
    ("craft", "cleaning"): "Cleaning",
    ("office", "cleaning"): "Cleaning",
    ("craft", "chimney_sweeper"): "Chimney",
    ("craft", "plasterer"): "Drywall & Plaster",
    ("craft", "stonemason"): "Masonry & Concrete",
    ("craft", "concrete"): "Masonry & Concrete",
    ("craft", "bricklayer"): "Masonry & Concrete",
    ("craft", "scaffolder"): "General Contractor",
    ("craft", "metal_construction"): "Welding & Fabrication",
    ("craft", "welder"): "Welding & Fabrication",
    ("craft", "electronics_repair"): "Appliance & Electronics Repair",
    ("shop", "appliance"): None,
    ("craft", "handyman"): "Handyman",
    ("craft", "tree_surgeon"): "Tree Service",
    ("craft", "arborist"): "Tree Service",
    ("craft", "septic_tank"): "Septic & Drain",
    ("craft", "well_driller"): "Well Drilling",
    ("craft", "fence"): "Fencing",
    ("craft", "pool"): "Pools",
    ("shop", "swimming_pool"): "Pools",
    ("craft", "garage_door"): "Garage Doors",
    ("craft", "solar"): "Solar",
    ("craft", "pavement"): "Paving",
    ("craft", "paving"): "Paving",
}
# Free-text keyword fallback for businesses tagged generically (office=company etc.)
KEYWORDS = [
    ("HVAC", ["hvac", "heating", "air conditioning", "cooling", "furnace"]),
    ("Plumbing", ["plumb", "rooter", "drain"]),
    ("Electrical", ["electric"]),
    ("Landscaping", ["landscap", "lawn", "mowing", "turf"]),
    ("Roofing", ["roofing", "roofers"]),
    ("Pest Control", ["pest", "termite", "exterminat"]),
    ("Tree Service", ["tree service", "tree care"]),
]

def overpass_query():
    pairs = {(k, v) for (k, v) in CATEGORIES}
    lines = []
    for k, v in sorted(pairs):
        lines.append(f'  nwr["{k}"="{v}"](around:{RADIUS_M},{CENTER[0]},{CENTER[1]});')
    rx = "|".join(w for _, ws in KEYWORDS for w in ws)
    for k in ("office", "shop", "craft"):
        lines.append(f'  nwr["{k}"]["name"~"{rx}",i](around:{RADIUS_M},{CENTER[0]},{CENTER[1]});')
    return "[out:json][timeout:300];\n(\n" + "\n".join(lines) + "\n);\nout center tags;"

def fetch(q):
    data = urllib.parse.urlencode({"data": q}).encode()
    last = None
    for attempt in range(4):
        for url in ENDPOINTS:
            try:
                req = urllib.request.Request(url, data=data,
                        headers={"User-Agent": "service-companies-dashboard/1.0"})
                with urllib.request.urlopen(req, timeout=360) as r:
                    return json.load(r)
            except Exception as e:  # noqa
                last = e
                print(f"  {url} failed: {e}", file=sys.stderr)
        time.sleep(10 * (attempt + 1))
    raise SystemExit(f"Overpass failed: {last}")

def miles(lat, lon):
    R = 3958.8
    p1, p2 = math.radians(CENTER[0]), math.radians(lat)
    dp, dl = p2 - p1, math.radians(lon - CENTER[1])
    a = math.sin(dp/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(dl/2)**2
    return 2 * R * math.asin(math.sqrt(a))

def categorize(t):
    cats = []
    for (k, v), c in CATEGORIES.items():
        vals = [x.strip() for x in t.get(k, "").split(";")]
        if v in vals:
            if c is None:
                return []
            cats.append(c)
    hay = " ".join(t.get(x, "") for x in ("name", "description", "service", "trade")).lower()
    for c, words in KEYWORDS:
        if any(w in hay for w in words):
            cats.append(c)
    return sorted(set(cats))

def first(t, *keys):
    for k in keys:
        if t.get(k):
            return t[k].split(";")[0].strip()
    return None

def main():
    q = overpass_query()
    print("Querying Overpass…", file=sys.stderr)
    raw = fetch(q)
    out, seen = [], set()
    for el in raw.get("elements", []):
        t = el.get("tags", {})
        name = t.get("name")
        if not name:
            continue
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        if lat is None:
            continue
        cats = categorize(t)
        if not cats:
            continue
        key = (name.lower(), round(lat, 3), round(lon, 3))
        if key in seen:
            continue
        seen.add(key)
        street = " ".join(x for x in (t.get("addr:housenumber"), t.get("addr:street")) if x)
        if t.get("addr:unit"):
            street += f" #{t['addr:unit']}"
        web = first(t, "website", "contact:website", "url")
        if web and not web.startswith("http"):
            web = "https://" + web
        emp = first(t, "employees", "staff", "number_of_employees")
        out.append({
            "id": f"{el['type'][0]}{el['id']}",
            "name": name,
            "categories": cats,
            "lat": round(lat, 6), "lon": round(lon, 6),
            "distance_mi": round(miles(lat, lon), 1),
            "address": street or None,
            "city": t.get("addr:city"),
            "state": t.get("addr:state"),
            "zip": t.get("addr:postcode"),
            "phone": first(t, "phone", "contact:phone"),
            "email": first(t, "email", "contact:email"),
            "website": web,
            "facebook": first(t, "contact:facebook", "facebook"),
            "hours": t.get("opening_hours"),
            "employees": emp,
            "operator": t.get("operator") or t.get("brand"),
            "description": t.get("description"),
            "osm_url": f"https://www.openstreetmap.org/{el['type']}/{el['id']}",
        })
    dest = os.path.join(os.path.dirname(__file__), "..", "data", "companies.json")
    # Keep anything a previous Google Places enrichment added, so the weekly
    # OSM refresh doesn't throw it away.
    try:
        prev = json.load(open(dest)).get("companies", [])
    except (OSError, ValueError):
        prev = []
    prev_by_id = {c["id"]: c for c in prev}
    for c in out:
        old = prev_by_id.get(c["id"])
        if old and old.get("google_url"):
            for k in ("address", "city", "state", "zip", "phone", "website", "hours"):
                c[k] = c[k] or old.get(k)
            for k in ("rating", "rating_count", "google_url"):
                c[k] = old.get(k)
    out += [c for c in prev if c.get("source") == "google"]
    out.sort(key=lambda c: (c["categories"][0], c["name"].lower()))
    with open(dest, "w") as f:
        json.dump({"generated": time.strftime("%Y-%m-%d"), "center": CENTER,
                   "radius_mi": 50, "source": "OpenStreetMap contributors (ODbL)",
                   "companies": out}, f, separators=(",", ":"))
    print(f"Wrote {len(out)} companies -> {os.path.normpath(dest)}", file=sys.stderr)

if __name__ == "__main__":
    main()
