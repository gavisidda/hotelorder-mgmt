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

## Billing fix + new payment options (latest update)

**The bug:** `cashierConfirmPayment()` was calling `closeSheet('paySheet')` *before*
`window.print()` — so the sheet holding all the item details was already hidden when the print
dialog opened, which is why receipts came out blank. Fixed by introducing a dedicated
**Receipt Sheet** that's populated and shown *after* payment, with printing as an explicit,
optional button — not automatic anymore.

- **Print Receipt** — now a button on the receipt sheet (shown after Confirm Payment, or from
  Receipts → Reprint). Only the receipt content prints (clean black-on-white), not the app UI.
- **Share via WhatsApp** — also on the receipt sheet. If the customer gave a mobile number when
  ordering, it opens WhatsApp with that number already filled in; otherwise it opens WhatsApp's
  contact picker so the cashier can choose who to send it to. Both fully optional — the cashier
  can just tap "Done" and skip both.
- **UPI QR code at billing** — a "Show UPI QR to Customer" button in the payment sheet generates
  a scannable UPI QR (works with GPay, PhonePe, Paytm, any UPI app) pre-filled with the exact
  amount due. Requires a one-time setup: Admin → More → Settings → enter your UPI ID (e.g.
  `yourname@okhdfcbank`). This is still a manual-confirm flow — there's no backend to auto-detect
  the payment, so the cashier waits for the customer to show the "payment successful" screen on
  their phone, then taps Confirm Payment as usual.

## Kitchen/order flow improvements (latest update)

### Mixed orders — ready-to-serve items no longer wait for the kitchen
Previously, "no kitchen needed" only worked if *every* item in an order was ready-to-serve
(tea, coffee, etc). Now it works at the **item level** within a single order:
- If a customer orders a coffee (ready-to-serve) and a biryani (needs kitchen) together, the
  order still goes to the kitchen for the biryani — but the waiter sees a **"Serve" button right
  next to the coffee** and can hand it over immediately, without waiting for the biryani.
- The Kitchen Display never shows ready-to-serve items at all (even in a mixed order) — kitchen
  staff only ever see what actually needs preparing.
- The waiter's Orders tab now also shows orders that are "Kitchen Preparing" *if* they still have
  an unserved ready-to-serve item waiting — pure kitchen orders with nothing to serve yet stay
  hidden from that tab until the kitchen marks them ready, same as before.
- Once the kitchen marks the rest of the order ready and the waiter taps "Mark Served," every
  remaining item (including any ready-to-serve item that wasn't individually served yet) is marked
  served automatically, so nothing is missed and the bill only becomes payable once everything has
  actually gone out.

### Table transfer
Waiters (Tables tab) and Admin/Cashier (More → Tables) can now **move an occupied table's active
orders to a different table** — for when customers physically change seats. Pick the source
(occupied) and destination (available) table and tap Transfer:
- All active orders for that table are reassigned to the new table number.
- The old table is freed up (marked available); the new one becomes occupied, keeping the same
  assigned waiter.
- Logged in the activity log for traceability.
- Note: any *new* order the customer places afterward needs them to scan the new table's QR code
  — this only moves existing orders and table state, not the customer's phone session.

## Table number consistency (latest update)

**The problem:** the app would accept whatever was in a QR link's `?table=` parameter as-is —
so "5", "t5", "T05", and "Table 5" could all end up creating *different* table documents in
Firestore for what was really the same physical table, and a mistyped or hand-edited link could
silently create a stray new "table."

**The fix:**
- Every table number is now normalized through one function to a canonical form — "5", "t5",
  "Table 5", and "T05" all resolve to the same `T05` document. This applies everywhere a table ID
  is read or written: customer QR links, bulk QR generation, single-table QR generation, table
  transfer, and manual table management.
- **Admin/Cashier can now pre-define tables** under **More → Tables** — enter a table number and
  tap Add. This is in addition to (not a replacement for) the bulk QR generator; use whichever is
  more convenient.
- **Customers can no longer create a table by visiting a link.** If a QR/link points at a table
  number that hasn't been added yet, the customer sees "This table hasn't been set up yet — please
  ask our staff for assistance" instead of silently spinning up a new, unmanaged table.
- **Waiters' QR tab** now only lists tables that admin/cashier have actually defined — no more
  fallback to a fake "T01" when nothing exists yet, which previously could generate a QR code for
  a table that didn't really exist.
- Tables now sort numerically everywhere (Table 2 before Table 10) instead of alphabetically,
  which matters once you have more than 9 tables.
- Fixed a related bug: re-running the bulk QR generator no longer resets an occupied/reserved
  table back to "available" — it only creates tables that don't exist yet.
- Admin/Cashier can also delete a table from More → Tables (this only removes the table record
  itself, it doesn't touch any existing orders).

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
