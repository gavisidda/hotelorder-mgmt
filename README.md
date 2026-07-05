# Restaurant Order Management System

A QR-based restaurant ordering system: Customer → Waiter → Kitchen → Cashier, all in real time
using Firestore, hosted free on **GitHub Pages**. Everything lives in a single `index.html` file.

## Files
| File | Purpose |
|---|---|
| `index.html` | Everything: customer menu, staff login, and all dashboards |
| `firebase-config.js` | Shared Firebase config — edit this first |
| `styles.css` | Shared dark-navy/gold theme |
| `firestore.rules` | Security rules to paste into Firebase Console |
| `manifest.json`, `sw.js` | PWA install + offline menu caching |

## Setup (unchanged)
1. Create Firebase project → enable Firestore → paste config into `firebase-config.js`.
2. Publish `firestore.rules` in Firebase Console.
3. Seed your first admin account manually in Firestore (`users` collection):
   ```
   name: "Gavi"
   mobile: "9902022509"
   pin: "123456"
   role: "admin"
   active: true
   ```
4. Push to GitHub, enable Pages, done.

## What's new in this update

### 1. Ready-to-serve items skip the kitchen
Edit any menu item (Admin/Cashier → Menu → Edit) and check **"Ready to serve (no kitchen prep)"**
for things like tea, coffee, cold drinks, bottled water. When a customer's order contains
**only** ready-to-serve items, it never appears on the Kitchen Display — the waiter sees a
**"Serve Now"** button instead of "Accept Order" and can complete it directly.
> Note: this works at the whole-order level. If an order mixes a ready-to-serve item with a
> kitchen item, the whole order still goes through the normal kitchen flow (splitting a single
> order into independently-tracked items would be a bigger change — see below).

### 2. Cashier now shares the Admin dashboard
Cashier and Admin log into the **same dashboard** now, with tabs: **Overview, Orders, Menu,
Staff, Billing, More**. Cashier gets everything admin gets — menu editing, staff approval,
table management, feedback, logs, performance, broadcast — **except**:
- **More → Settings** (restaurant name/GST/branding) is hidden for cashiers.
- There's no separate "discount configuration" screen to restrict — discounts are still applied
  per-bill at checkout time (that's core cashier work), the same for both roles. If you later want
  a global discount/coupon policy manager, that would be an admin-only addition worth building
  as its own feature.

Billing itself is now a tab inside this shared dashboard (Pending / Today / Receipts — same as
before, just relocated).

### 3. Hide/show menu items instantly
Each menu item row now has a one-tap **Hide / Show** button — no need to open the edit sheet.
Hidden items disappear from the customer menu immediately (real-time) and reappear the moment
you tap Show again; nothing is deleted or needs recreating.

Bonus: you can also set an **optional time window** (e.g. 07:00–11:00 for a breakfast item) when
editing a menu item. Outside that window, the item is automatically hidden from customers even
if marked available — handy for breakfast/lunch/dinner-only items. Leave both times blank for
"always available."

### 4. Item-level cancellation with mandatory reason
Waiters and kitchen staff can now cancel a **single item** within an order (not just the whole
order) by tapping the ✕ next to it. A reason is required — the prompt won't accept an empty
answer. The order total is automatically recalculated to exclude the cancelled item, and the
customer sees it struck through with the reason in their "My Orders" screen.
(Cancelling the *entire* order, from the waiter's Orders tab, still works as before too.)

### 5. Other additions
- **Kitchen-ready notification for waiters** — a second banner (amber, with its own beep) appears
  the instant kitchen marks an order "Ready to Serve," listing the table with a one-tap "Mark
  Served" button, so waiters don't have to keep refreshing the Orders tab.
- **Estimated prep time shown to customers** — configurable in More → Settings ("Estimated
  Preparation Time"), shown under their order in "My Orders" while it's new/preparing.
- **Simple daily dashboard** — Overview now shows Pending / Completed / Cancelled order counts
  for today, alongside sales, occupied tables, and average prep time.
- **Audit log** — already existed; now also logs item cancellations, menu availability toggles,
  and "serve now" (no-kitchen) actions.

## Deliberately not built (and why) — this round
- **Low-stock / inventory alerts** — needs a stock-tracking data model (consumption per item,
  reorder thresholds) that doesn't exist yet; a real feature worth its own pass.
- **Day-of-week menu scheduling** (e.g. "weekends only") — the time-of-day window is built; adding
  day-of-week on top is a small extension if you want it next.
- **Per-item kitchen routing for mixed orders** — right now "no kitchen" is decided for the whole
  order. Splitting a single order so kitchen only sees the items that need it, while the waiter
  independently serves the ready-to-serve ones, is a meaningfully bigger change to the order model
  (items would need their own individual status, not just the order as a whole) — happy to take
  that on as a focused next step if it matters for your flow.
- Everything listed as skipped in the previous update (push notifications, split bills, table
  merging, PDF/Excel export, backup/restore, multi-branch, multi-language, fine-grained RBAC
  beyond the current role/cashier model, auto waiter-assignment, full offline-first architecture)
  is still out of scope for the same reasons as before.

## Troubleshooting
Same as always: check `firebase-config.js` has real values, run `node --check` on any script
block you edit, confirm Firestore rules are published, and make sure an admin account exists
before expecting to log in.
