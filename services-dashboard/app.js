(() => {
  'use strict';

  const PALETTE = ['#2563eb', '#dc2626', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#db2777',
    '#65a30d', '#ea580c', '#4f46e5', '#0d9488', '#b45309', '#9333ea', '#475569'];
  const state = { all: [], filtered: [], cats: new Set(), selected: null, markers: new Map(), colors: {} };
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtPct = (n, d) => (d ? Math.round((100 * n) / d) + '%' : '–');

  // ---- Map -----------------------------------------------------------------
  const map = L.map('map', { preferCanvas: true }).setView([39.7684, -86.1581], 9);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap contributors',
  }).addTo(map);
  const radiusCircle = L.circle([39.7684, -86.1581], { radius: 80467, color: '#2563eb', weight: 1, fill: false, dashArray: '4 4' }).addTo(map);
  const cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45, chunkedLoading: true });
  map.addLayer(cluster);

  const pinIcon = (color, big) => L.divIcon({
    className: '',
    html: `<svg width="${big ? 30 : 22}" height="${big ? 40 : 30}" viewBox="0 0 22 30"><path d="M11 0C4.9 0 0 4.9 0 11c0 8.2 11 19 11 19s11-10.8 11-19C22 4.9 17.1 0 11 0z" fill="${color}" stroke="#fff" stroke-width="1.5"/><circle cx="11" cy="11" r="4" fill="#fff"/></svg>`,
    iconSize: big ? [30, 40] : [22, 30], iconAnchor: big ? [15, 40] : [11, 30], popupAnchor: [0, -28],
  });

  // ---- Helpers ---------------------------------------------------------------
  const cityLine = (c) => [c.city, [c.state || (c.city ? 'IN' : ''), c.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const fullAddress = (c) => [c.address, cityLine(c)].filter(Boolean).join(', ');
  const FIELDS = ['address', 'city', 'zip', 'phone', 'website', 'email', 'hours', 'employees'];
  const completeness = (c) => FIELDS.filter((f) => c[f]).length / FIELDS.length;
  const phoneHref = (p) => 'tel:' + p.replace(/[^\d+]/g, '');

  // ---- Load ------------------------------------------------------------------
  fetch('data/companies.json').then((r) => r.json()).then((data) => {
    state.all = data.companies || [];
    if (!state.all.length) {
      $('subtitle').textContent = 'No company data yet. Run services-dashboard/scripts/fetch_osm.py to populate data/companies.json.';
      return;
    }
    const counts = {};
    state.all.forEach((c) => c.categories.forEach((k) => (counts[k] = (counts[k] || 0) + 1)));
    const catNames = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    catNames.forEach((k, i) => (state.colors[k] = PALETTE[i % PALETTE.length]));
    $('subtitle').textContent = `${state.all.length.toLocaleString()} companies within ${data.radius_mi} miles of downtown Indianapolis · data refreshed ${data.generated}`;

    $('chips').innerHTML = `<button class="chip" data-cat="" aria-pressed="true">All</button>` + catNames.map((k) =>
      `<button class="chip" data-cat="${esc(k)}" aria-pressed="false"><span class="dot" style="background:${state.colors[k]}"></span>${esc(k)} <span class="n">${counts[k]}</span></button>`).join('');

    const cities = [...new Set(state.all.map((c) => c.city).filter(Boolean))].sort();
    $('city').insertAdjacentHTML('beforeend', cities.map((c) => `<option>${esc(c)}</option>`).join(''));

    state.all.forEach((c) => {
      const m = L.marker([c.lat, c.lon], { icon: pinIcon(state.colors[c.categories[0]]), title: c.name });
      m.on('click', () => select(c.id));
      state.markers.set(c.id, m);
    });

    const fromHash = decodeURIComponent(location.hash.slice(1));
    apply();
    if (fromHash && state.markers.has(fromHash)) select(fromHash);
  }).catch((e) => { $('subtitle').textContent = 'Could not load data/companies.json: ' + e; });

  // ---- Filtering -------------------------------------------------------------
  function apply() {
    const q = $('search').value.trim().toLowerCase();
    const city = $('city').value;
    const radius = +$('radius').value;
    const needPhone = $('hasPhone').checked, needWeb = $('hasWeb').checked;
    state.filtered = state.all.filter((c) =>
      (!state.cats.size || c.categories.some((k) => state.cats.has(k))) &&
      (!city || c.city === city) &&
      c.distance_mi <= radius &&
      (!needPhone || c.phone) && (!needWeb || c.website) &&
      (!q || [c.name, c.address, c.city, c.zip, c.operator, c.categories.join(' ')].join(' ').toLowerCase().includes(q)));

    const sort = $('sort').value;
    state.filtered.sort(sort === 'distance' ? (a, b) => a.distance_mi - b.distance_mi
      : sort === 'completeness' ? (a, b) => completeness(b) - completeness(a) || a.name.localeCompare(b.name)
        : (a, b) => a.name.localeCompare(b.name));

    radiusCircle.setRadius(radius * 1609.34);
    cluster.clearLayers();
    cluster.addLayers(state.filtered.map((c) => state.markers.get(c.id)));
    renderKpis();
    renderList();
  }

  function renderKpis() {
    const f = state.filtered, n = f.length;
    $('kpiCount').textContent = n.toLocaleString();
    $('kpiCats').textContent = new Set(f.flatMap((c) => c.categories)).size;
    $('kpiPhone').textContent = fmtPct(f.filter((c) => c.phone).length, n);
    $('kpiWeb').textContent = fmtPct(f.filter((c) => c.website).length, n);
    $('kpiCities').textContent = new Set(f.map((c) => c.city).filter(Boolean)).size;
  }

  function renderList() {
    const list = $('list');
    $('listCount').textContent = `${state.filtered.length.toLocaleString()} results`;
    const MAX = 600; // keep the DOM light; map still shows all
    list.innerHTML = state.filtered.slice(0, MAX).map((c) => `
      <li data-id="${esc(c.id)}" class="${c.id === state.selected ? 'active' : ''}">
        <div class="nm">${esc(c.name)}</div>
        <div class="meta">${c.categories.map((k) => `<span class="tag"><span class="dot" style="background:${state.colors[k]}"></span>${esc(k)}</span>`).join('')}
          <span>${esc(c.city || '')}${c.city ? ' · ' : ''}${c.distance_mi} mi</span></div>
      </li>`).join('') + (state.filtered.length > MAX ? `<li class="meta">Showing first ${MAX}. Narrow the filters to see more.</li>` : '');
  }

  // ---- Detail panel ----------------------------------------------------------
  function select(id) {
    const c = state.all.find((x) => x.id === id);
    if (!c) return;
    if (state.selected && state.markers.has(state.selected)) {
      const prev = state.all.find((x) => x.id === state.selected);
      state.markers.get(state.selected).setIcon(pinIcon(state.colors[prev.categories[0]]));
    }
    state.selected = id;
    history.replaceState(null, '', '#' + encodeURIComponent(id));
    const m = state.markers.get(id);
    m.setIcon(pinIcon(state.colors[c.categories[0]], true));
    cluster.zoomToShowLayer(m, () => map.panTo([c.lat, c.lon]));
    document.querySelectorAll('#list li').forEach((li) => li.classList.toggle('active', li.dataset.id === id));
    const li = document.querySelector(`#list li[data-id="${CSS.escape(id)}"]`);
    if (li) li.scrollIntoView({ block: 'nearest' });

    const na = '<span class="na">Not listed</span>';
    const row = (label, val) => `<dt>${label}</dt><dd>${val || na}</dd>`;
    const addr = fullAddress(c);
    const q = encodeURIComponent(`${c.name} ${c.city || 'Indianapolis'} IN`);
    const pct = Math.round(completeness(c) * 100);

    $('detailBody').innerHTML = `
      <h2>${esc(c.name)}</h2>
      <div class="meta">${c.categories.map((k) => `<span class="tag"><span class="dot" style="background:${state.colors[k]}"></span>${esc(k)}</span>`).join(' ')}</div>
      <dl>
        ${row('Address', addr && esc(addr))}
        ${row('Phone', c.phone && `<a href="${esc(phoneHref(c.phone))}">${esc(c.phone)}</a>`)}
        ${row('Website', c.website && `<a href="${esc(c.website)}" target="_blank" rel="noopener">${esc(c.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, ''))}</a>`)}
        ${row('Email', c.email && `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`)}
        ${row('Employees', c.employees && esc(c.employees))}
        ${row('Hours', c.hours && esc(c.hours))}
        ${c.rating ? row('Google rating', `${c.rating} ★ (${(c.rating_count || 0).toLocaleString()} reviews)`) : ''}
        ${c.operator ? row('Operator / brand', esc(c.operator)) : ''}
        ${c.facebook ? row('Facebook', `<a href="${esc(c.facebook.startsWith('http') ? c.facebook : 'https://facebook.com/' + c.facebook)}" target="_blank" rel="noopener">Page</a>`) : ''}
        ${c.description ? row('About', esc(c.description)) : ''}
        ${row('Distance', `${c.distance_mi} mi from downtown Indy`)}
        ${row('Coordinates', `${c.lat.toFixed(5)}, ${c.lon.toFixed(5)}`)}
        <dt>Profile complete</dt><dd>${pct}%<div class="completeness"><span style="width:${pct}%"></span></div></dd>
      </dl>
      <h3>Research further</h3>
      <div class="links">
        <a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr ? c.name + ', ' + addr : c.lat + ',' + c.lon)}">Google Maps</a>
        <a target="_blank" rel="noopener" href="https://www.google.com/search?q=${q}">Google</a>
        <a target="_blank" rel="noopener" href="https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent(c.name)}">LinkedIn (employees)</a>
        <a target="_blank" rel="noopener" href="https://www.bbb.org/search?find_country=USA&find_text=${encodeURIComponent(c.name)}&find_loc=${encodeURIComponent((c.city || 'Indianapolis') + ', IN')}">BBB</a>
        <a target="_blank" rel="noopener" href="https://bsd.sos.in.gov/publicbusinesssearch">IN Sec. of State</a>
        ${c.google_url ? `<a target="_blank" rel="noopener" href="${esc(c.google_url)}">Google listing</a>` : ''}
        ${c.osm_url ? `<a target="_blank" rel="noopener" href="${esc(c.osm_url)}">Edit / source (OSM)</a>` : ''}
      </div>`;
    $('detail').hidden = false;
  }

  function closeDetail() {
    $('detail').hidden = true;
    if (state.selected) {
      const prev = state.all.find((x) => x.id === state.selected);
      state.markers.get(state.selected).setIcon(pinIcon(state.colors[prev.categories[0]]));
    }
    state.selected = null;
    history.replaceState(null, '', location.pathname);
    document.querySelectorAll('#list li.active').forEach((li) => li.classList.remove('active'));
  }

  // ---- CSV export ------------------------------------------------------------
  function exportCsv() {
    const cols = ['name', 'categories', 'address', 'city', 'state', 'zip', 'phone', 'email', 'website', 'employees', 'hours', 'distance_mi', 'lat', 'lon', 'osm_url'];
    const cell = (v) => { const s = Array.isArray(v) ? v.join('; ') : String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
    const csv = [cols.join(',')].concat(state.filtered.map((c) => cols.map((k) => cell(c[k])).join(','))).join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: 'indy-service-companies.csv' });
    a.click(); URL.revokeObjectURL(a.href);
  }

  // ---- Events ----------------------------------------------------------------
  let t;
  $('search').addEventListener('input', () => { clearTimeout(t); t = setTimeout(apply, 150); });
  ['city', 'sort', 'hasPhone', 'hasWeb'].forEach((id) => $(id).addEventListener('change', apply));
  $('radius').addEventListener('input', (e) => { $('radiusOut').textContent = e.target.value; apply(); });
  $('chips').addEventListener('click', (e) => {
    const b = e.target.closest('.chip'); if (!b) return;
    const k = b.dataset.cat;
    if (!k) state.cats.clear(); else state.cats.has(k) ? state.cats.delete(k) : state.cats.add(k);
    document.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.cat ? state.cats.has(c.dataset.cat) : !state.cats.size)));
    apply();
  });
  $('list').addEventListener('click', (e) => { const li = e.target.closest('li[data-id]'); if (li) select(li.dataset.id); });
  $('closeDetail').addEventListener('click', closeDetail);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDetail(); });
  $('exportBtn').addEventListener('click', exportCsv);
})();
