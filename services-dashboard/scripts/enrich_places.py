#!/usr/bin/env python3
"""Optional: enrich data/companies.json with Google Places (API "New").

Fills in missing phone/website/hours/address on existing OpenStreetMap records
and adds companies OSM is missing. Needs GOOGLE_PLACES_API_KEY in the environment.

Cost note: one Text Search request per (trade, town, page). With the defaults
below, expect roughly 500-1,000 requests per run; check current Google pricing.
Set MAX_REQUESTS to cap it.
"""
import json, os, re, sys, time, urllib.request
from fetch_osm import CENTER, miles

KEY = os.environ.get("GOOGLE_PLACES_API_KEY")
MAX_REQUESTS = int(os.environ.get("MAX_REQUESTS", "800"))
URL = "https://places.googleapis.com/v1/places:searchText"
FIELDS = ",".join("places." + f for f in (
    "id", "displayName", "formattedAddress", "addressComponents", "location",
    "nationalPhoneNumber", "websiteUri", "regularOpeningHours.weekdayDescriptions",
    "rating", "userRatingCount", "businessStatus", "googleMapsUri")) + ",nextPageToken"

TRADES = {
    "HVAC": "HVAC contractor", "Plumbing": "plumber", "Electrical": "electrician",
    "Landscaping": "landscaping company", "Roofing": "roofing contractor",
    "Pest Control": "pest control", "Tree Service": "tree service",
    "Painting": "painting contractor", "General Contractor": "general contractor",
    "Cleaning": "cleaning service", "Garage Doors": "garage door repair",
    "Fencing": "fence contractor",
}
TOWNS = ["Indianapolis", "Carmel", "Fishers", "Noblesville", "Westfield", "Zionsville",
         "Lebanon", "Brownsburg", "Avon", "Plainfield", "Danville", "Mooresville",
         "Martinsville", "Greenwood", "Franklin", "Shelbyville", "Greenfield", "Anderson",
         "Columbus", "Bloomington", "Crawfordsville", "Frankfort", "Tipton", "New Castle"]

def norm(s):
    s = re.sub(r"[^a-z0-9 ]", "", (s or "").lower())
    return re.sub(r"\b(inc|llc|co|corp|company|the|and)\b", "", s).split()

def same(a, b):
    na, nb = set(norm(a["name"])), set(norm(b["name"]))
    close = miles_between(a, b) < 0.25
    return close and na and nb and len(na & nb) / min(len(na), len(nb)) >= 0.5

def miles_between(a, b):
    return abs(a["lat"] - b["lat"]) * 69 + abs(a["lon"] - b["lon"]) * 53

def search(text, token=None):
    body = {"textQuery": text, "pageSize": 20,
            "locationBias": {"circle": {"center": {"latitude": CENTER[0], "longitude": CENTER[1]}, "radius": 50000}}}
    if token:
        body["pageToken"] = token
    req = urllib.request.Request(URL, data=json.dumps(body).encode(), method="POST", headers={
        "Content-Type": "application/json", "X-Goog-Api-Key": KEY, "X-Goog-FieldMask": FIELDS})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)

def to_record(p, cat):
    comp = {t: c.get("shortText") for c in p.get("addressComponents", []) for t in c.get("types", [])}
    lat, lon = p["location"]["latitude"], p["location"]["longitude"]
    street = " ".join(x for x in (comp.get("street_number"), comp.get("route")) if x)
    hours = p.get("regularOpeningHours", {}).get("weekdayDescriptions")
    return {
        "id": "g" + p["id"], "name": p["displayName"]["text"], "categories": [cat],
        "lat": round(lat, 6), "lon": round(lon, 6), "distance_mi": round(miles(lat, lon), 1),
        "address": street or None, "city": comp.get("locality"), "state": comp.get("administrative_area_level_1"),
        "zip": comp.get("postal_code"), "phone": p.get("nationalPhoneNumber"), "email": None,
        "website": p.get("websiteUri"), "facebook": None, "hours": "; ".join(hours) if hours else None,
        "employees": None, "operator": None, "description": None,
        "rating": p.get("rating"), "rating_count": p.get("userRatingCount"),
        "google_url": p.get("googleMapsUri"), "osm_url": None, "source": "google",
    }

def main():
    if not KEY:
        raise SystemExit("GOOGLE_PLACES_API_KEY is not set; skipping enrichment.")
    path = os.path.join(os.path.dirname(__file__), "..", "data", "companies.json")
    data = json.load(open(path))
    companies = data["companies"]
    by_gid = {}
    n = added = merged = 0
    for cat, phrase in TRADES.items():
        for town in TOWNS:
            token = None
            for _ in range(3):
                if n >= MAX_REQUESTS:
                    break
                n += 1
                try:
                    res = search(f"{phrase} in {town}, Indiana", token)
                except Exception as e:  # noqa
                    print(f"  {phrase}/{town}: {e}", file=sys.stderr)
                    break
                for p in res.get("places", []):
                    if p.get("businessStatus") not in (None, "OPERATIONAL") or "location" not in p:
                        continue
                    rec = to_record(p, cat)
                    if rec["distance_mi"] > 50:
                        continue
                    if rec["id"] in by_gid:
                        if cat not in by_gid[rec["id"]]["categories"]:
                            by_gid[rec["id"]]["categories"].append(cat)
                        continue
                    match = next((c for c in companies if same(c, rec)), None)
                    if match:
                        for k in ("address", "city", "state", "zip", "phone", "website", "hours"):
                            match[k] = match.get(k) or rec[k]
                        for k in ("rating", "rating_count", "google_url"):
                            match[k] = rec[k]
                        if cat not in match["categories"]:
                            match["categories"].append(cat)
                        by_gid[rec["id"]] = match
                        merged += 1
                    else:
                        companies.append(rec)
                        by_gid[rec["id"]] = rec
                        added += 1
                token = res.get("nextPageToken")
                if not token:
                    break
                time.sleep(2)
    for c in companies:
        c["categories"] = sorted(set(c["categories"]))
    companies.sort(key=lambda c: (c["categories"][0], c["name"].lower()))
    data["source"] = "OpenStreetMap contributors (ODbL) + Google Places"
    json.dump(data, open(path, "w"), separators=(",", ":"))
    print(f"{n} requests · merged {merged} · added {added} · total {len(companies)}", file=sys.stderr)

if __name__ == "__main__":
    main()
