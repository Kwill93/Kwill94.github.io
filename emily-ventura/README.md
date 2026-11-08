# Emily Ventura: Wedding Planner + Designer

A static editorial site with three public pages and a private analytics dashboard.

| File | What it is |
|---|---|
| `index.html` | Home page: full-screen hero photo, statement, about section, services, feature photo, and portfolio/contact calls to action |
| `portfolio.html` | Masonry gallery with Weddings / Celebrations / Details filters and a full-screen lightbox |
| `contact.html` | Email, phone, Instagram and location. No contact form, per Emily's request |
| `dashboard.html` | Private analytics dashboard (not indexed by search engines, requires a key) |
| `js/analytics.js` | Visit and click tracking |
| `backend/` | Google Apps Script backend and setup guide (`backend/SETUP.md`) |

## Adding photos
Drop JPGs into `images/` using these names (any missing photo shows a neutral placeholder labelled with the file it needs):
- `images/hero.jpg`: the "one big photo" on the home page (landscape, at least 2400px wide)
- `images/about.jpg`: portrait of Emily (4:5)
- `images/feature.jpg`: second full-width photo (landscape)
- `images/contact.jpg`: contact page photo (portrait)
- `images/portfolio/01.jpg` … `24.jpg`: gallery photos (any orientation)

Export at about 2000px on the long edge and around 80% JPG quality to keep pages fast.
To change a portfolio photo's category, edit `data-cat` on its `<figure>` in `portfolio.html`.

## Before launch
- Confirm the email, phone and Instagram in `contact.html` and the footer of every page (they are currently placeholders).
- Complete `backend/SETUP.md` and paste the endpoint into `js/config.js`.
