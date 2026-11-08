/**
 * Emily Ventura — analytics backend (Google Apps Script + Google Sheet).
 * Receives events from js/analytics.js and stores one row per event in the "Events" sheet.
 * Serves summary stats to dashboard.html (requires the secret key).
 * Setup steps: see backend/SETUP.md
 */
var DASHBOARD_KEY = 'CHANGE-ME-to-a-long-random-phrase';
var COLUMNS = ['ts','type','page','label','href','visitor','session','newVisitor','referrer',
               'utm_source','utm_campaign','device','screen','lang','seconds','scroll','title'];

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Events') || ss.insertSheet('Events');
  if (sh.getLastRow() === 0) { sh.appendRow(COLUMNS); sh.setFrozenRows(1); }
  return sh;
}

/** Collect an event (called by the website). */
function doPost(e) {
  try {
    var ev = JSON.parse(e.postData.contents);
    if (!ev || !ev.type || String(ev.type).length > 40) return out_({ok:false});
    var row = COLUMNS.map(function (c) {
      var v = ev[c]; if (v === undefined || v === null) return '';
      return String(v).slice(0, 300);
    });
    var lock = LockService.getScriptLock(); lock.waitLock(5000);
    sheet_().appendRow(row); lock.releaseLock();
    return out_({ok:true});
  } catch (err) { return out_({ok:false}); }
}

/** Return summary stats (called by dashboard.html). ?key=...&days=30 */
function doGet(e) {
  var p = e.parameter || {};
  if (p.key !== DASHBOARD_KEY) return out_({error:'unauthorized'});
  var days = Math.min(parseInt(p.days || '30', 10) || 30, 3650);
  var since = new Date(Date.now() - days * 864e5);
  var sh = sheet_(), n = sh.getLastRow();
  var rows = n > 1 ? sh.getRange(2, 1, n - 1, COLUMNS.length).getValues() : [];
  var I = {}; COLUMNS.forEach(function (c, i) { I[c] = i; });

  var visitors = {}, sessions = {}, newV = {}, byDay = {}, pages = {}, clicks = {}, refs = {}, devices = {},
      contacts = {contact_email:0, contact_phone:0, contact_instagram:0}, photos = {}, secs = [], pv = 0;
  for (var d = 0; d < days && d < 366; d++) byDay[fmt_(new Date(Date.now() - d * 864e5))] = {}; // zero-fill

  rows.forEach(function (r) {
    var t = new Date(r[I.ts]); if (isNaN(t) || t < since) return;
    var type = r[I.type], vid = r[I.visitor];
    visitors[vid] = 1; sessions[r[I.session]] = 1;
    if (type === 'pageview') {
      pv++; inc_(pages, r[I.page]);
      var day = fmt_(t); byDay[day] = byDay[day] || {}; byDay[day][vid] = 1;
      if (r[I.newVisitor] === true || r[I.newVisitor] === 'true') newV[vid] = 1;
      inc_(refs, host_(r[I.referrer]) || (r[I.utm_source] ? 'utm: ' + r[I.utm_source] : 'Direct'));
      inc_(devices, r[I.device] || 'unknown');
    } else if (type in contacts) { contacts[type]++; inc_(clicks, r[I.label] || type); }
    else if (type === 'click' || type === 'outbound') { inc_(clicks, r[I.label] || r[I.href]); }
    else if (type === 'photo_view') { inc_(photos, r[I.label]); }
    else if (type === 'page_exit' && r[I.seconds] !== '') { secs.push(Number(r[I.seconds])); }
  });

  var daily = Object.keys(byDay).sort().map(function (k) { return {date:k, visitors:Object.keys(byDay[k]).length}; });
  return out_({
    days: days,
    totals: {
      visitors: Object.keys(visitors).length,
      newVisitors: Object.keys(newV).length,
      sessions: Object.keys(sessions).length,
      pageviews: pv,
      avgSeconds: secs.length ? Math.round(secs.reduce(function(a,b){return a+b;},0) / secs.length) : 0,
      contactActions: contacts.contact_email + contacts.contact_phone + contacts.contact_instagram
    },
    contacts: contacts,
    daily: daily,
    pages: top_(pages), clicks: top_(clicks), referrers: top_(refs), devices: top_(devices), photos: top_(photos)
  });
}

function inc_(o, k) { k = k || '(none)'; o[k] = (o[k] || 0) + 1; }
function top_(o) { return Object.keys(o).map(function (k) { return {name:k, count:o[k]}; })
  .sort(function (a, b) { return b.count - a.count; }).slice(0, 15); }
function fmt_(d) { return Utilities.formatDate(d, Session.getScriptTimeZone(), 'yyyy-MM-dd'); }
function host_(u) { var m = String(u || '').match(/^https?:\/\/([^\/]+)/); return m ? m[1].replace(/^www\./, '') : ''; }
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
