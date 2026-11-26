# Bar Mitzvah website + RSVP

A private event site for invited guests only: event details, a hotel room-block link, an FAQ, and an RSVP form
that collects head-counts (adults / teens / children), which events each guest is attending, and **dietary needs and
allergies for each guest**.

**Live URL (once GitHub Pages is on):** `https://kwill93.github.io/Kwill94.github.io/bar-mitzvah/`

## Files

| File | What it is |
|---|---|
| `config.js` | **The only file you normally edit.** Names, dates, venues, hotel link, contact, passcode, RSVP destination. |
| `index.html`, `styles.css`, `app.js` | The site itself. |
| `backend/rsvp-google-apps-script.js` | Saves RSVPs to a Google Sheet (free, no server needed). |
| `tools/make_qr.py` | Makes the invitation QR code. |
| `qr-rsvp.png` / `qr-rsvp.svg` | QR for the default passcode `MAZELTOV`. Make a new one once the URL or passcode is final. |

## Setup checklist

### 1. Fill in the details
Edit `config.js`: names, dates, venues, addresses, attire, contact info. The values in it now are **placeholders**.

### 2. Add the hotel link
Paste the group-rate booking URL into `hotel.bookingUrl`, and fill in `groupCode`, `rate` and `cutoff`. Until a URL is
there, the site shows "Booking link coming soon".

### 3. Connect RSVPs to a Google Sheet (about 5 minutes)
1. Create a new Google Sheet (for example "Bar Mitzvah RSVPs").
2. **Extensions → Apps Script.** Delete the sample code and paste in all of `backend/rsvp-google-apps-script.js`.
   Optionally, set `NOTIFY_EMAIL` to get an email for every RSVP.
3. Pick `setup` in the function dropdown, then click **Run**. Approve the permissions prompt. This creates the
   **RSVPs**, **Guests** and **Summary** tabs.
4. **Deploy → New deployment → ⚙ → Web app.** Execute as: **Me**. Who has access: **Anyone**. Click Deploy and copy
   the **Web app URL**.
5. Paste that URL into `rsvpEndpoint` in `config.js`.

What you get:
- **Summary**: total attending, split into adults, teens and children, plus declines, hotel count, and a count for
  each dietary need.
- **Guests**: one row per person, with their dietary needs and allergies. Hand this tab to the caterer.
- **RSVPs**: one row per household. If a guest submits again with the same email, it **replaces** their earlier
  answer.

> If you change the script later, use **Deploy → Manage deployments → Edit → New version**. This keeps the same URL.

### 4. Set the passcode
The default passcode is `MAZELTOV`. Passcodes aren't case-sensitive. To change it, open your browser's developer
console on any page and run:
```js
crypto.subtle.digest("SHA-256", new TextEncoder().encode("YOURCODE".toUpperCase()))
  .then(b => console.log([...new Uint8Array(b)].map(x => x.toString(16).padStart(2,"0")).join("")))
```
Paste the result into `passcodeHash`. You can also print the passcode on the invitation, for guests who type the URL
by hand.

### 5. Turn on GitHub Pages
Repo **Settings → Pages → Deploy from branch → `main` / root**. Your other pages, such as the services dashboard,
aren't affected.

### 6. Make the invitation QR code
```bash
pip install "qrcode[pil]"
python3 tools/make_qr.py https://kwill93.github.io/Kwill94.github.io/bar-mitzvah/ YOURCODE
```
The QR opens the site, signs the guest in automatically, and jumps straight to the RSVP form. Send `qr-rsvp.svg` to
the printer: it stays sharp at any size. **Scan a printed proof before you print the full run.**

## About privacy
- Only people with the passcode or the QR code can see the content. The page is also marked `noindex`, so search
  engines won't list it.
- This is a **courtesy lock, not bank-grade security**. The site is static, so a technically minded person could read
  the page source. Don't put anything truly sensitive on the page, such as a home address meant for only a few people.
- RSVP answers, including allergies, go **only** to your Google Sheet. They are never stored on the website.
