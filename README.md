# Restaurant Order Management System

A QR-based restaurant ordering system: Customer → Waiter → Kitchen → Cashier, all in real time
using Firestore, hosted free on **GitHub Pages**. Everything — customer ordering, waiter, kitchen,
cashier, and admin — lives in a **single `index.html` file**, same single-file pattern as your
Budget/Vault apps. Staff log in with their **mobile number** instead of a PIN.

## Files
| File | Purpose |
|---|---|
| `index.html` | Everything: customer menu (via `?table=T01`), staff login, and all 4 dashboards |
| `firebase-config.js` | Shared Firebase config — **edit this first** |
| `styles.css` | Shared dark-navy/gold theme |
| `firestore.rules` | Security rules to paste into Firebase Console |
| `manifest.json`, `sw.js` | PWA install + offline menu caching |

## 1. Create the Firebase project
1. Go to https://console.firebase.google.com → **Add project**.
2. Once created, click the **`</>` (web) icon** to register a web app.
3. Copy the `firebaseConfig` object it gives you.
4. Paste those exact values into `firebase-config.js` (replace the `YOUR_...` placeholders).
5. In the Firebase Console, enable **Cloud Firestore** (Build → Firestore Database → Create database, start in production mode).
6. (Optional, for food images) Enable **Storage**.

## 2. Apply security rules
In Firestore → **Rules**, paste the contents of `firestore.rules` and click Publish.
> These rules are deliberately open since this project checks identity in-app (by mobile number)
> instead of using Firebase Authentication. Keep the GitHub repo **private** if the menu/pricing
> data shouldn't be publicly editable by anyone with the URL.

## 3. Seed your first admin login
Firestore has no data yet, so login will always show "Register" until an admin account exists.
In Firestore Console, manually add **one** document to get started:

```
Collection: users
Document ID: (auto-id)
Fields:
  name: "Gavi"
  mobile: "9902022509"
  role: "admin"
  active: true
```

Open the site (no `?table=` in the URL) → enter mobile `9902022509` → you're in as admin.
From the **Users** tab you can approve/assign roles for everyone else going forward — no more
manual Firestore edits needed.

## 4. How staff login & registration works now
- Anyone opens the site link (no `table` param) → enters their **mobile number**.
- **Already registered & approved** → goes straight to their dashboard (waiter/kitchen/cashier/admin).
- **Not registered yet** → asked for their name → creates a `pending` account → shown a
  "Waiting for Approval" screen.
- **Registered but still pending** → shown the same "Waiting for Approval" screen until admin acts.
- **Admin → Users tab** → sees every account (pending or active), picks a role from the dropdown,
  taps **Save Role & Approve** → that person can now log in with just their mobile number.
- Admin can also **Add Staff Directly** (skip the request step) from the Users tab, and can
  **Disable** or **Delete** any account.

Roles: `waiter`, `kitchen`, `cashier`, `admin`. A `pending` role means "awaiting approval" and
cannot access any dashboard.

## 5. Set up your menu
In the **admin** dashboard:
1. **Menu tab → Manage Categories** — add categories (Starters, Main Course, Beverages, etc).
2. **Menu tab → +** — add items with name, category, price, optional image URL, description.
3. **QR tab** — enter your GitHub Pages URL, set table count, tap **Generate**. This creates
   a `tables/T01`, `tables/T02`... document for each table and shows a printable QR code for each.
   Print these and place one per table.

## 6. Deploy to GitHub Pages
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

## What changed from the PIN-based version
- Login is now by **mobile number**, not a 4-digit PIN — same number works across devices.
- Staff can **self-register** (mobile + name) instead of admin creating every account up front.
- New accounts start as **pending** and are invisible to every dashboard until admin assigns
  a role and approves them from the Users tab.
- All 5 experiences (customer, waiter, kitchen, cashier, admin) now live in **one `index.html`**
  file — no more separate `waiter.html` / `kitchen.html` / `cashier.html` / `admin.html` / `auth.js`.

## Not built yet (good next additions)
GST-formatted invoice PDF, UPI deep-link QR for payment, WhatsApp order confirmation, kitchen
printer integration, multi-branch/multi-kitchen support, inventory management. Ask any time and
we can add these one at a time.

## Troubleshooting infinite loading (your recurring issue)
Since the page loads Firebase from CDN `<script>` tags before your own code runs, an infinite
loading screen almost always means one of:
1. `firebase-config.js` still has placeholder values — check the browser console for an
   `auth/invalid-api-key` or similar error.
2. A JS syntax error in the page — copy the `<script>` block out of `index.html` into a `.js`
   file and run `node --check that.js` to validate it, your usual workflow.
3. Firestore rules not published yet — reads/writes will silently hang or reject.
4. No admin account seeded yet (step 3 above) — you'll be stuck on "Register" with nothing to
   approve you.
