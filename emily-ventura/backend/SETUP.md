# Analytics backend setup (about 10 minutes, free)

Visit and click data is stored in a **Google Sheet that Emily owns**. You can open it any time to see the raw rows, and `dashboard.html` shows the summary.

## 1. Create the sheet and script
1. Signed in to Emily's Google account, create a new Google Sheet named **Emily Ventura – Website Analytics**.
2. Open **Extensions → Apps Script**.
3. Delete the starter code, paste in everything from `backend/Code.gs`, and save.
4. Change `DASHBOARD_KEY` at the top to a long private phrase. This is the dashboard password.

## 2. Deploy it
1. Click **Deploy → New deployment**, and choose the type **Web app**.
2. Set **Execute as** to *Me* and **Who has access** to *Anyone*. This only lets the site send events. Reading the stats still requires the key.
3. Click **Deploy**, approve the permissions, and copy the **Web app URL** (it ends in `/exec`).

## 3. Connect the website
1. Open `js/config.js` and paste the URL into `analyticsEndpoint`.
2. Publish the site, visit it, and click around. Rows appear in the **Events** tab within seconds.

## 4. View the dashboard
Open `dashboard.html` on the live site and enter the Web app URL and your key. They are saved in that browser only.

## What gets recorded
| Event | Meaning |
|---|---|
| `pageview` | A page was opened (includes referrer, device, screen, UTM campaign) |
| `click` / `outbound` | A link or button was clicked (label = which one) |
| `contact_email` / `contact_phone` / `contact_instagram` | Someone tapped a contact method. These are your real leads. |
| `photo_view` | A portfolio photo was opened in the lightbox |
| `scroll` | The visitor reached 25 / 50 / 75 / 100% of a page |
| `page_exit` | Time on page in seconds, plus how far they scrolled |

No cookies, names or IP addresses are stored. Each browser gets a random ID so unique visitors can be counted.
To stop counting your own visits, open the site once with `?notrack=1` on the URL (for example `…/index.html?notrack=1`) in each browser you use. Use `?notrack=0` to undo it.

**Updating the script later:** after editing, go to **Deploy → Manage deployments → Edit → Version: New version** so the URL stays the same.
