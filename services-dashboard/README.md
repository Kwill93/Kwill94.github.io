# Indianapolis Service Companies Dashboard

Interactive map and directory of home and commercial service companies (HVAC, plumbing,
electrical, landscaping, roofing, pest control, and more) within 50 miles of downtown
Indianapolis.

- **Map:** clustered pins, colored by category, with the 50-mile radius drawn on it.
- **Filters:** search, category chips, city, radius slider, has-phone/has-website, sort.
- **Click a company:** address, phone, website, email, employees, hours, distance, plus
  quick links to Google Maps, LinkedIn (for headcount), BBB, and the Indiana Secretary of
  State business search.
- **Export CSV** of whatever is currently filtered.

Live at `https://kwill94.github.io/services-dashboard/` once merged to the Pages branch.

## Data

`data/companies.json` is generated from OpenStreetMap through the Overpass API:

```bash
cd services-dashboard
python3 scripts/fetch_osm.py   # standard library only, takes about 1 to 3 minutes
```

To add or remove trades, edit the `CATEGORIES` map in `scripts/fetch_osm.py`.

**Limitations:** OpenStreetMap is free and open, but it is community-maintained. Coverage
of small contractors is incomplete, and **employee count is rarely recorded**. When it's
missing, the dashboard shows "Not listed" and links to LinkedIn and BBB for a lookup.
For fuller coverage and headcounts you'd need a paid source (Google Places API, Data Axle,
D&B, ZoomInfo). Records from such a source can be merged into the same JSON schema.

Map libraries (Leaflet 1.9.4, Leaflet.markercluster 1.5.3) are vendored in `vendor/`.
