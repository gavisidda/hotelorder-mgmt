# Restaurant Order Management System

A QR-based restaurant ordering system: Customer → Waiter → Kitchen → Cashier, all in real time
using Firestore, hosted free on **GitHub Pages**. Same single-repo, hardcoded-Firebase-config
pattern as your PowerZone / TechLink / Hatti apps.

## Files
| File | Role |
|---|---|
| `index.html` | Customer menu + ordering (opened via QR, `?table=T01`) |
| `waiter.html` | Waiter dashboard — accept orders, mark served, table status, calls |
| `kitchen.html` | Kitchen display (large-screen friendly) — new/preparing/ready |
| `cashier.html` | Cashier — pending bills, payment, today's sales |
| `admin.html` | Menu, categories, staff (PIN) management, QR generator, settings |
| `firebase-config.js` | Shared Firebase config — **edit this first** |
| `auth.js` | Shared PIN-login logic used by all 4 staff pages |
| `styles.css` | Shared dark-navy/gold theme |
| `firestore.rules` | Security rules to paste into Firebase Console |
| `manifest.json`, `sw.js` | PWA install + offline menu caching |

## 1. Create the Firebase project
1. Go to https://console.firebase.google.com → **Add project**.
2. Once created, click the **`</>` (web) icon** to register a web app.
3. Copy the `firebaseConfig` object it gives you.
4. Paste those exact values into `firebase-config.js` in this repo (replace the `YOUR_...` placeholders).
5. In the Firebase Console, enable **Cloud Firestore** (Build → Firestore Database → Create database, start in production mode).
6. (Optional, for food images) Enable **Storage**.

## 2. Apply security rules
In Firestore → **Rules**, paste the contents of `firestore.rules` and click Publish.
> These rules are deliberately open since this project uses in-app PIN checks instead of
> Firebase Authentication — same approach as your Budget/Vault apps. Keep the GitHub repo
> **private** if the menu/pricing data shouldn't be publicly editable by anyone with the URL.

## 3. Seed your first admin login
Firestore has no data yet, so `admin.html` will reject every PIN until a user document exists.
In Firestore Console, manually add one document to get started:

```
Collection: users
Document ID: (auto-id)
Fields:
  name: "Your Name"
  role: "admin"
  pin: "1234"
  active: true
```

Log into `admin.html` with PIN `1234`, then use the **Users** tab to add waiter/cook/cashier
accounts (and disable/change this one) going forward — no more manual Firestore edits needed.

## 4. Set up your menu
In `admin.html`:
1. **Menu tab → Manage Categories** — add categories (Starters, Main Course, Beverages, etc).
2. **Menu tab → +** — add items with name, category, price, optional image URL, description.
3. **QR tab** — enter your GitHub Pages URL, set table count, tap **Generate**. This creates
   a `tables/T01`, `tables/T02`... document for each table and shows a printable QR code for each.
   Print these and place one per table.

## 5. Deploy to GitHub Pages
```bash
git init
git add .
git commit -m "Restaurant order management system"
git branch -M main
git remote add origin https://github.com/gavisidda/YOUR_REPO_NAME.git
git push -u origin main
```
Then in the GitHub repo: **Settings → Pages → Source: main branch, root** → Save.
Your app will be live at `https://gavisidda.github.io/YOUR_REPO_NAME/`.

Use that exact URL (with trailing slash) as the "Site URL" in the admin QR generator tab.

## Order flow (how it works)
1. Customer scans table QR → `index.html?table=T05` → browses menu → places order.
   Order is written to Firestore with `status: "new"`; table becomes `occupied`.
2. **Waiter** sees it appear instantly (Firestore real-time listener) → taps **Accept** →
   status becomes `preparing`.
3. **Kitchen** display shows it under Preparing → taps **Ready to Serve** → status `ready`.
4. **Waiter** sees it under Ready → serves the food → taps **Mark Served** → status `served`.
5. Customer taps **Request Bill** (or cashier notices) → **Cashier** opens the table,
   sees all served-but-unpaid orders combined, selects Cash/UPI/Card → **Confirm Payment**.
   This marks the orders `billed`, creates a `bills` record, and frees the table.

Customers can also tap **🔔 Call Waiter** any time, which shows up on the waiter's **Calls** tab.

## What's included vs. "nice to have" from your original list
**Included:** live real-time updates, dark theme, QR generator, PIN role login, table status,
waiter call button, bill requests, cashier payment methods, daily sales report, offline menu
browsing (PWA), single shared codebase.

**Not built yet (good next additions):** multi-branch/multi-kitchen support, inventory
management, GST-formatted invoice PDF, UPI deep-link QR for payment, WhatsApp order
confirmation, kitchen printer integration. Ask any time and we can add these one at a time —
same as how PowerZone's ordering system grew feature by feature.

## Troubleshooting infinite loading (your recurring issue)
Since every page loads Firebase from a CDN `<script>` tag before your own code runs, an
infinite loading screen almost always means one of:
1. `firebase-config.js` still has placeholder values — check the browser console for an
   `auth/invalid-api-key` or similar error.
2. A JS syntax error in the page — run `node --check filename.html` won't work directly on
   HTML, so copy the `<script>` block into a `.js` file and run `node --check that.js` to
   validate it, your usual workflow.
3. Firestore rules not published yet — reads/writes will silently hang or reject.
