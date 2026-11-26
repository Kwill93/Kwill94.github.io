/**
 * Bar Mitzvah RSVP collector — Google Apps Script
 * ------------------------------------------------
 * Paste this whole file into Extensions → Apps Script of a new Google Sheet,
 * run `setup` once, then Deploy → New deployment → Web app
 * (Execute as: Me, Who has access: Anyone). Copy the Web app URL into
 * `rsvpEndpoint` in config.js. Full steps in README.md.
 *
 * Creates three tabs:
 *   RSVPs   — one row per household (re-submitting with the same email
 *             replaces their earlier row, so the sheet is always current)
 *   Guests  — one row per person: name, age group, dietary needs, allergies
 *             (hand this tab to the caterer)
 *   Summary — live head-counts and dietary totals
 */

// Optional: get an email each time an RSVP arrives. Leave "" to disable.
const NOTIFY_EMAIL = "";

const RSVP_HEADERS = [
  "Submitted", "Party name", "Email", "Phone", "Attending", "Events",
  "Total guests", "Adults", "Teens", "Children", "Hotel", "Song request",
  "Guest names", "Dietary needs", "Allergies", "Message",
];
const GUEST_HEADERS = ["Submitted", "Party email", "Party name", "Guest name", "Age group", "Dietary needs", "Allergies", "Events"];
const DIETARY = ["Vegetarian", "Vegan", "Gluten-free", "Dairy-free", "Kosher meal", "Nut allergy", "Shellfish allergy"];

function setup() {
  const ss = SpreadsheetApp.getActive();
  const rsvps = sheet_(ss, "RSVPs", RSVP_HEADERS);
  const guests = sheet_(ss, "Guests", GUEST_HEADERS);
  const sum = ss.getSheetByName("Summary") || ss.insertSheet("Summary", 0);
  sum.clear();
  const rows = [
    ["Head-count", ""],
    ["Households responded", "=COUNTA(RSVPs!C2:C)"],
    ["Households attending", '=COUNTIF(RSVPs!E2:E,"Yes")'],
    ["Households declined", '=COUNTIF(RSVPs!E2:E,"No")'],
    ["Total guests attending", "=SUM(RSVPs!G2:G)"],
    ["  Adults", "=SUM(RSVPs!H2:H)"],
    ["  Teens", "=SUM(RSVPs!I2:I)"],
    ["  Children", "=SUM(RSVPs!J2:J)"],
    ["Staying at group hotel", '=COUNTIF(RSVPs!K2:K,"Yes, at the group hotel")'],
    ["", ""],
    ["Dietary needs (guests)", ""],
  ];
  DIETARY.forEach(d => rows.push(["  " + d, `=COUNTIF(Guests!F2:F,"*${d}*")`]));
  rows.push(["  Guests with allergy notes", '=COUNTIF(Guests!G2:G,"?*")']);
  sum.getRange(1, 1, rows.length, 2).setValues(rows);
  sum.getRange("A1").setFontWeight("bold");
  sum.getRange("A11").setFontWeight("bold");
  sum.setColumnWidth(1, 240);
  [rsvps, guests].forEach(s => s.autoResizeColumns(1, s.getLastColumn()));
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.website) return ok_(); // honeypot tripped — ignore bots
    const ss = SpreadsheetApp.getActive();
    const rsvps = sheet_(ss, "RSVPs", RSVP_HEADERS);
    const guests = sheet_(ss, "Guests", GUEST_HEADERS);
    const email = String(d.email || "").toLowerCase();
    const when = new Date();
    const list = d.guests || [];

    // Replace any earlier response from the same email.
    deleteWhere_(rsvps, 3, email);
    deleteWhere_(guests, 2, email);

    rsvps.appendRow([
      when, d.partyName, email, d.phone, d.attending, d.events,
      d.totalGuests || 0, d.adults || 0, d.teens || 0, d.children || 0,
      d.hotel, d.song,
      list.map(g => g.name).join(", "),
      list.filter(g => g.dietary && g.dietary.length).map(g => `${g.name}: ${g.dietary.join(", ")}`).join("; "),
      list.filter(g => g.allergies).map(g => `${g.name}: ${g.allergies}`).join("; "),
      d.message,
    ]);
    list.forEach(g => guests.appendRow([
      when, email, d.partyName, g.name, g.age, (g.dietary || []).join(", "), g.allergies, d.events,
    ]));

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(NOTIFY_EMAIL,
        `RSVP: ${d.partyName} — ${d.attending === "Yes" ? d.totalGuests + " attending" : "declined"}`,
        JSON.stringify(d, null, 2));
    }
    return ok_();
  } finally {
    lock.releaseLock();
  }
}

// Visiting the web-app URL in a browser just confirms it's live.
function doGet() {
  return ContentService.createTextOutput("RSVP endpoint is running.");
}

function sheet_(ss, name, headers) {
  let s = ss.getSheetByName(name);
  if (!s) s = ss.insertSheet(name);
  if (s.getLastRow() === 0) {
    s.appendRow(headers);
    s.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    s.setFrozenRows(1);
  }
  return s;
}

function deleteWhere_(s, col, value) {
  if (!value || s.getLastRow() < 2) return;
  const vals = s.getRange(2, col, s.getLastRow() - 1, 1).getValues();
  for (let i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i][0]).toLowerCase() === value) s.deleteRow(i + 2);
  }
}

function ok_() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
}
