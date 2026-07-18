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

## Session persistence (latest update)

**Sessions no longer expire from inactivity.** The old 20-minute idle timeout is gone — staff
stay logged in until they explicitly tap Logout. In its place, a lightweight check runs every
5 minutes confirming the account is still active; if an admin disables or deletes someone's
account, they'll be signed out within a few minutes instead of being stuck logged in forever —
but sitting idle, or refreshing the page, never logs anyone out on its own.

**Refreshing the page now returns you to where you were**, not the home tab. This applies to:
- Admin/Cashier: whichever main tab (Overview/Orders/Menu/Staff/Billing/More) you were on, including
  which Billing sub-view (Pending/Today/Receipts) and which More sub-view (Tables/QR/Feedback/Logs/
  Performance/Broadcast/Settings) you had open, and your Orders status filter.
- Waiter: whichever tab (Orders/Tables/Calls/QR) you were on.

This is remembered per browser tab via sessionStorage, so it survives a refresh but clears if you
close the tab — reopening the site fresh still starts at the login screen as expected.

## Mandatory mobile number + auto order numbers (latest update)

### Admin-controlled mobile number requirement
**More → Settings → "Require customer mobile number before ordering"** (admin-only, same place
as the other policy settings). Two behaviors depending on this toggle:

- **Off (default)** — unchanged from before: mobile number field appears in the cart at checkout,
  entirely optional.
- **On** — the moment a customer scans a table's QR code, before they see the menu at all, they're
  asked for a 10-digit mobile number. They can't proceed to browse or order without it. Once
  entered, it's remembered on their device (so they won't be asked again next visit), and it's
  also double-checked again at the actual "Place Order" step in case it's somehow missing.

### Auto-generated order number for tracking
Every order now gets a human-readable order number the moment it's placed, in the exact format
you asked for: `DDMM-HHmm` — day and month, a dash, then the 24-hour time. An order placed on
6 July at 1:22 PM becomes **`0607-1322`**. This is shown to everyone who needs to track or
reference an order:
- Customer's "My Orders" screen
- Waiter's Orders tab
- Kitchen Display
- Admin's Orders tab
- Cashier's Pending Bills (shows every order number being combined into a bill)
- The printed/shared receipt (all order numbers that went into that bill)

Note: this is a readable tracking code based on the clock at the moment of ordering, not a strict
incrementing counter — two orders placed in the exact same minute would share a number. Given a
single restaurant's order volume this is very unlikely to matter in practice; if you'd rather have
a guaranteed-unique sequential counter instead (e.g. #00001, #00002...), that's a small follow-up
using a Firestore counter document — let me know if you'd prefer that instead.

## Table occupancy protection + organization

### Blocking orders on reserved/cleaning tables
- **Reserved or Cleaning tables** show the customer a clear message ("This table is currently
  reserved/being cleaned — please check with our staff") instead of the menu. No ordering possible
  until staff changes the table's status.
- Occupied tables do **not** block ordering — see "Group dining + session cleanup" above for why
  and how that's handled instead.

### Reserved tables hidden from the waiter's QR tab
Waiters generating a single table's QR code (Waiter → QR tab) no longer see reserved tables in the
list — only tables that are actually available for a customer to sit at and scan.

### Table organization improvements
- **Waiters can now change a table's status directly** from their Tables tab (previously this was
  admin/cashier-only) — mark a table Available, Occupied, Reserved, or Cleaning on the spot, e.g.
  right after clearing a table.
- Both the waiter's Tables tab and Admin/Cashier's More → Tables now **group tables by status**
  (Occupied, Available, Reserved, Cleaning) instead of one long flat list, so it's easy to see at a
  glance what needs attention.
- Admin/Cashier's Tables view also shows a **quick count summary** at the top (how many tables are
  in each state) for a fast floor overview.

## Group dining + session cleanup (latest update)

Per your feedback, both trade-offs from the last update are now resolved:

### Multiple phones at the same table — fully allowed
The "occupied blocks new customers" check has been **removed entirely**. Any number of phones can
scan the same table's QR and order independently — the normal case for group dining. Reserved and
Cleaning tables still correctly block ordering (that part is unchanged), only the occupied-table
restriction was lifted.

### Customer session now clears itself — after the bill, or after 2 hours
Since blocking by device is gone, the earlier "stale history" concern is handled differently now:
each customer's local order history for a table (what powers "My Orders") is automatically cleared
the next time they open the menu, under either condition:
- **Every order in their history for that table is already billed or cancelled** — meaning their
  visit is over, so the next scan starts fresh instead of showing yesterday's meal.
- **More than 2 hours have passed** since their first order at that table — a safety net in case a
  bill never gets explicitly reconciled against their local history for some reason.

This clears their table-specific order history and cart, so a new visit to the same table (even on
the same phone) always starts clean.

## General improvements (latest update)

A batch of smaller improvements that make daily use smoother, without any major behavior changes:

- **Kitchen now gets an audible alert for genuinely new orders** — previously only waiters had
  sound notifications (call/ready banners); kitchen staff had to keep glancing at the screen.
  Now a beep plays the moment a new kitchen order arrives (not on page load, and not for
  ready-to-serve items that skip the kitchen entirely). Same one-tap-to-enable-audio behavior as
  the existing waiter alerts.
- **Overdue order highlighting on the Kitchen Display** — any order still waiting past your
  configured "Estimated Preparation Time" (More → Settings) now gets a red, gently pulsing border,
  so it's obvious at a glance which tickets need attention first.
- **Menu search for customers** — a search box above the category tabs filters by item name and
  description as they type, helpful once a menu has more than a handful of items.
- **Print All QR Codes** (Admin/Cashier → More → QR) and **Print This QR** (Waiter → QR tab) —
  previously the only way to get a physical QR code was a screenshot or the browser's whole-page
  print. These buttons open a clean, QR-only print view in a new tab.
- **Call Waiter cooldown** — after tapping it, the button shows "✓ Waiter Notified" and disables
  itself for 60 seconds, preventing accidental repeated taps from flooding the waiter's call banner.

## ⚠️ Action required: republish Firestore rules (bug fix)

**Root cause found for Feedback/Activity Log/Broadcast not working:** it wasn't a bug in the app
code at all — `firestore.rules` only ever listed permissions for `menu`, `categories`, `settings`,
`tables`, `orders`, `bills`, and `users`. The `feedback`, `activityLogs`, and `broadcast`
collections were added to the app in later updates but were **never added to the rules file**.
Firestore denies any collection that isn't explicitly matched, so every read/write to those three
collections was silently failing — and since those specific functions had no error handling, it
just looked like an endless spinner instead of a clear error.

**Fixed in two ways:**
1. `firestore.rules` now includes `feedback`, `activityLogs`, and `broadcast`.
2. Every function that reads from them now shows a real error message if something does go wrong,
   instead of hanging silently — so this class of problem is much easier to spot next time.

**You need to do one manual step:** open Firebase Console → Firestore Database → Rules, paste in
the updated `firestore.rules` from this update, and click Publish. Just replacing `index.html` in
your repo is not enough this time — the rules live in Firebase's console, not in your GitHub repo.

## CSV menu import

Admin/Cashier → Menu tab now has an **Import from CSV** file picker at the top, plus a
**Download CSV Template** button so you know the exact format expected:

```
name,category,price,image,description,available,readyToServe,scheduleStart,scheduleEnd
Masala Dosa,Breakfast,80,,Crispy rice crepe with spiced potato filling,TRUE,FALSE,,
Filter Coffee,Beverages,30,,Traditional South Indian filter coffee,TRUE,TRUE,,
```

- `name` is the only required field.
- `category` is matched by **name**, not ID — if a category doesn't exist yet, it's created
  automatically.
- `available` and `readyToServe` accept `TRUE`/`FALSE`, `1`/`0`, or `yes`/`no` — left blank,
  `available` defaults to true and `readyToServe` defaults to false.
- `scheduleStart`/`scheduleEnd` are optional 24-hour times (`07:00`, `11:00`) for time-windowed
  items — leave both blank for "available all day."
- **Re-importing is safe**: rows are matched to existing items **by name**. If a name already
  exists in your menu, that item is updated in place; if not, it's added as new. So you can export,
  tweak prices in a spreadsheet, and re-upload without creating duplicates.
- Import runs entirely in the browser (via the PapaParse library, loaded the same way as the QR
  code library) — no server involved, and it's safe for menus of any size (writes are automatically
  chunked to stay under Firestore's per-batch limits).

## Self-directed improvements (latest update)

Since you gave me free rein, I focused on two things: hardening the app against the exact bug
class we just found (silent failures), and adding the two most-requested "deferred" features that
actually fit this architecture well.

### Error handling audit
After finding that Feedback/Logs/Broadcast were silently failing due to missing Firestore rules,
I audited every database call in the app for the same pattern — a `.then()` with no `.catch()`,
which means any future problem (rules, network, quota) shows up as a stuck spinner instead of a
clear message. Fixed **around 35 functions** across customer ordering, waiter actions, kitchen,
billing, and every admin/cashier screen — covering the ordering flow, item cancellation, table
transfer, staff management, menu editing, and settings. Every action that can fail now tells you
so, instead of just... not doing anything.

### Simple stock tracking + low-stock alerts
Any menu item can now have **"Track stock for this item"** turned on (in the Add/Edit Menu Item
form), with a starting quantity and a low-stock threshold. From there:
- Stock **automatically decreases** as orders come in (using a Firestore transaction, so
  concurrent orders from multiple phones don't cause incorrect counts).
- An item that hits **0 stock is automatically hidden** from the customer menu — no manual "Hide"
  needed.
- The Menu tab shows each tracked item's current stock, with a **⚠️ Low** warning once it drops to
  the threshold.
- Overview now shows a **Low Stock summary card** whenever any tracked item needs restocking.

This is entirely optional per item — items without stock tracking behave exactly as before.

### CSV export for reports
- **More → Activity Log → Export to CSV** — the last 500 actions with timestamp, actor, role,
  action, and detail.
- **More → Performance → Export Today's Sales to CSV** — every bill from today with time, table,
  order numbers, itemized contents, subtotal, discount, total, payment method, and cashier.
Both download directly from the browser — no server involved, opens cleanly in Excel/Sheets.

## ⚠️ Action required: publish Storage rules (new file, new feature)

**New feature — direct photo upload for menu items.** Previously you could only add a photo by
pasting an image URL. Now the Add/Edit Menu Item form has an **"Or upload a photo directly"**
file picker — pick an image from your phone/computer and it uploads to Firebase Storage
automatically, filling in the image field for you.

This uses **Firebase Storage**, which has its own separate security rules from Firestore — the
exact same situation as the Feedback/Logs/Broadcast bug from before, so this time a rules file is
included from the start: **`storage.rules`** (new file in this update).

**You need to do one manual step:** open Firebase Console → **Storage** (not Firestore) →
**Rules**, paste in `storage.rules`, and click Publish. If you haven't used Storage in this
Firebase project before, you may also need to click "Get Started" on the Storage page first to
initialize it. Skipping this step means uploads will fail with a permission error — but you can
always paste an image URL directly instead if you'd rather not set this up.

## Menu export + weekly/monthly sales reports

- **Menu tab → Export Current Menu to CSV** — the mirror of the import feature from before. Pulls
  every menu item (with its category name, not the internal ID) into a CSV you can back up, edit
  in a spreadsheet, and re-import.
- **More → Performance** now has a period switcher: **Today / This Week / This Month**. Each shows
  total sales, bill count, average bill value, sales by cashier, and top-selling items for that
  period — previously this was locked to "today" only. The CSV export button follows whichever
  period is selected.

## Feedback bug fix + order closing (latest update)

### Fixed: feedback option disappearing
**Root cause:** the "clear session after bill" logic added a couple of updates ago ran on *every*
page load and wiped a customer's local order history the instant all their orders were billed —
which is exactly the moment they'd want to open "My Orders" and rate their visit. If a customer
reopened or refreshed the page shortly after paying (very plausible — reopening the link, a tab
refresh, anything), their history vanished before they got a chance to rate. The star-rating option
simply had nothing to show.

**Fixed** by removing that immediate clear-on-billed trigger. Local order history now only clears
automatically after **2 hours** (still matches what you asked for originally), never right when a
bill is paid — so the feedback/rating option stays available for as long as a customer might
reasonably still be at the table.

### Customers can now close their own order (with confirmation)
The old "Request Bill" button is now **"🔒 Close Order & Get Bill"**. Tapping it asks for
confirmation ("You won't be able to add more items after this"), and once confirmed:
- The table **locks** — no more items can be added by any device at that table.
- The customer sees a dedicated "Order Closed" screen confirming their bill has been requested,
  with the menu no longer accessible — but they can still tap **"View My Orders"** to check status
  and leave a rating once it's billed, and **"Call Waiter"** if they need anything while waiting.
- Waiters and Admin/Cashier see a **"🔒 Closed — awaiting bill"** note on that table in their
  Tables views, so it's clear at a glance which tables are done ordering and just need billing.
- The lock **releases automatically** the moment the cashier confirms payment — the table goes
  back to fully available for the next customer, exactly as before.

This replaces the old behavior where "Request Bill" was just a notification with no actual effect
on ordering — now it's a real, deliberate close-out step.

## Close Order corrections (latest update)

Three fixes to the "Close Order & Get Bill" flow from the last update, based on real usage:

### 1. Button stays disabled until the customer has actually ordered
Previously "Close Order & Get Bill" was clickable the moment a customer opened "My Orders," even
with zero orders placed. It's now **disabled by default** and only enables once there's at least
one order from this device at this table that isn't already billed or cancelled — checked both
right when "My Orders" opens and live again the instant the button is tapped.

### 2. Feedback is now collected *before* closing, not after
Tapping the (now-enabled) button no longer immediately locks the table. It opens a short step
first — **"Before we close your order, how was your experience?"** with an optional 1–5 star
rating — followed by **Cancel** or **Confirm & Close**. If a rating was given, it's saved the
moment they confirm, before the table locks. This catches feedback from customers who close out
and leave immediately after — previously the only chance to rate was reopening the app *after*
staff had processed payment, which many people never did.

### 3. Fixed: closing with nothing to bill
The reported bug — a customer viewing the menu after their table had already been billed and
reset, then tapping Close again with nothing actually pending, locking a fresh table for no
reason — is fixed by the same "has an active order" check from #1, verified **live against
Firestore twice**: once when the confirm step opens, and again right before the table actually
locks. If either check finds nothing active (e.g., staff already billed it directly without the
customer using this button), the customer sees "There's nothing active to close right now" instead
of locking an empty table.

## Waiter-taken orders + billing gate (latest update)

### 1. Waiters can now take orders on behalf of a customer
New **"Take Order"** tab in the waiter dashboard — for restaurants where the waiter takes verbal
orders instead of (or alongside) customers self-ordering by QR:
- Pick a table, browse the menu by category, add items just like the customer view.
- Optionally note the customer's mobile number and any special instructions.
- Placing the order works exactly like a customer order (goes to kitchen, shows in Orders, etc.)
  but is tagged **"👤 Waiter order"** — visible on the Waiter Orders tab, Kitchen Display, and
  Admin's Orders tab, so staff can always tell which orders came from a customer's phone versus a
  waiter taking it down directly.
- Customers can still order on their own for the same table at the same time — both kinds of
  orders coexist normally and get billed together.

### 2. Waiters can close an order and request the bill directly
Previously only the customer could trigger "Close Order & Get Bill" from their phone. Now the
waiter's **Tables tab** has a **"🔒 Close & Request Bill"** button on any occupied table — useful
when the customer asks verbally rather than using the app, or when the whole visit was waiter-taken
to begin with. It checks there's actually something active to close first, same safety check as
the customer-side version.

### 3. Cashier can only bill tables that have been closed
This was the missing piece tying it together: **Pending Bills now only shows tables where an order
has actually been closed** — via the customer's button or the waiter's new one. A table full of
served-but-not-yet-closed orders no longer shows up for the cashier to bill early; the empty state
now explains why ("waiting for an order to be closed"). This makes the closing step meaningful
end-to-end instead of just a customer-side convenience.

## Fixed: waiter orders not showing in customer's order status

**Root cause:** "My Orders" only ever looked up orders by ID from a list saved in the *customer's
own device's* local storage. Since a waiter places an order from a completely different device,
its ID never made it into the customer's local list — so it silently never appeared, no matter how
correctly everything else worked.

**Real fix, not a patch:** orders are now tracked by a shared **visit ID** per table instead of
per-device local storage. The moment a table goes from empty to occupied (whether the *first*
order comes from the customer's phone or a waiter taking it down), a visit ID is generated and
attached to every order placed during that sitting — regardless of who places it. "My Orders" and
the "Close Order & Get Bill" button's active-order check both now query **by table + visit ID**
directly from Firestore, so:

- Customer and waiter orders show up together in "My Orders," in the order they were placed,
  each waiter-placed one labeled **"👤 Placed by waiter"** (with their name) for transparency.
- The Close Order button correctly enables/disables based on the table's *real* current state —
  including orders the customer never personally placed.
- The visit ID resets the moment the cashier bills the table, so a new customer sitting down later
  never sees a previous party's orders, even on a table that was very recently occupied.
- Table transfers carry the visit ID over, so a mid-meal table move doesn't split the order history.

This is a more solid foundation than the old per-device tracking, and fixes the root cause rather
than special-casing waiter orders on top of it.

## PWA install for staff, branded "Hotel" (latest update)

The app can now be installed as a home-screen app — by staff **and** customers, on Android,
iOS, and desktop Chrome — showing up as **"Hotel"** with a custom hotel-bed icon.

### What was actually broken before this
Two real gaps, not just missing polish:
- `manifest.json` already referenced icon files (`assets/icon-192.png`, `assets/icon-512.png`),
  but those files never existed — the `assets/` folder was empty. Install would have shown a
  blank/broken icon, or some browsers may have refused the install prompt entirely.
- The service worker (needed for a page to be "installable" at all) was only ever registered
  inside the **customer** ordering flow — staff dashboards never registered it, so **staff could
  never install the app**, regardless of the icon issue.

### What's fixed now
- Real icon files generated and added: `assets/icon-192.png`, `assets/icon-512.png`,
  `assets/icon-maskable-512.png` (safe-zone padded for Android's adaptive-icon masking),
  `assets/apple-touch-icon.png` (iOS home screen), and `assets/favicon-32.png` (browser tab).
  All a simple gold hotel-bed mark on the app's dark navy, matching the existing theme —
  a real 🏨 emoji glyph doesn't render reliably as a standalone image file across platforms, so
  this is a clean vector equivalent instead.
- `manifest.json` renamed to **"Hotel"** (both `name` and `short_name`, so it's short enough to
  fit under the icon on a home screen), includes the maskable icon, and sets portrait orientation.
- Service worker registration **moved to run on every page load**, regardless of role — so
  waiter, kitchen, admin, and cashier can all install it now, not just customers.
- Added `apple-touch-icon` and `apple-mobile-web-app-*` meta tags, since iOS Safari doesn't fully
  support the web manifest for "Add to Home Screen" and needs these explicitly.
- Bumped the service worker's cache version so anyone who already had the app installed picks up
  these fixes automatically next time they open it.

### How staff install it
Open the site in Chrome (Android) or Safari (iOS) → browser menu → **"Add to Home Screen"** /
**"Install App"**. It'll appear as "Hotel" with the bed icon, launching full-screen without browser
chrome, same as any native app icon.

## Menu tab and Staff card layout fixes (latest update)

### Menu tab reordered
"Download CSV Template" and "Export Current Menu to CSV" now sit at the **end** of the Menu tab,
after the full list of menu items, instead of at the top above them.

### Fixed: Hide/Edit/Delete and staff action buttons stacking vertically
Both the menu item card (Hide/Edit/Delete) and the staff card (Save Role & Approve/Disable/Reset
PIN/Delete) were using the same `.row` layout style meant for a simple two-item line (label on the
left, value on the right). With three or four buttons squeezed into that same layout, they ended
up wrapping onto their own separate lines instead of sitting in one neat row — the same underlying
issue as the kitchen button crowding from the last update. Both now use the same horizontal
button-row treatment as everything else (order items, item actions) — Hide/Edit/Delete sit in one
row below each menu item, and Save Role & Approve/Disable/Reset PIN/Delete sit in one row below
each staff member's details.

## Item list layout fixes (latest update)

Three related corrections to how items display within an order card:

### Customer's "My Orders" now has line separators and prices
Previously the line-separator styling was applied to waiter/kitchen/admin item lists but was
missed on the customer's own "My Orders" view. Fixed — the same thin divider between items now
shows there too. Also added the **line price on the right side of each item** (qty × item price)
in both the customer's My Orders and Admin's Orders tab — everything else about those lists is
unchanged, just the line and the price.

### Fixed: Kitchen's Start/Cancel buttons were crowding together
The kitchen board gives each item **two** possible buttons (Start/Ready *and* Cancel, since
kitchen can cancel an unavailable item), and the old layout tried to fit both into a single row
squeezed against the item text — which is what was causing the cramped "top and down" look.
Action buttons for every item (kitchen, waiter, anywhere they appear) now sit on their **own row
directly below the item's name**, consistently, so they never fight for space with the text or
with each other.

### Buttons resized to match the item text better
Per-item action buttons (Cancel, Serve, Start, Ready) were visually louder than the item text next
to them, due to the default button's bold weight and generous padding. They're now noticeably more
compact (smaller padding and font size), while the item text itself got a touch larger — aiming
for the two to read at a similar visual weight instead of the button dominating the line. Worth a
look once deployed — happy to nudge the sizes further either direction if it's not quite right.

## Button cleanup + today's completed orders for waiter/kitchen (latest update)

### Cancel Whole Order moved to Admin/Cashier only
Waiters can still cancel **individual items** (with a reason), but cancelling an **entire order**
is now Admin/Cashier-only — removed from the waiter's order cards, added to the admin Orders tab
(shown on any order that isn't already billed or cancelled).

### Consistent button styling
- The per-item **Cancel** button now says "Cancel" (not "✕") and matches the same red, full-label
  style as "Cancel Whole Order," instead of a tiny compact button.
- The per-item **Serve** button is now **green**, sized and styled the same way — easier to spot
  at a glance among the other item actions.
- Kitchen's per-item Start/Ready buttons got the same sizing treatment for visual consistency.

### Waiter and Kitchen can now see today's completed orders
- **Waiter**: new "✅ Completed" tab in the bottom nav — lists every order served or billed today,
  read-only, most recent first.
- **Kitchen**: new "✅ Completed" button in the top bar opens the same list in an overlay, so
  kitchen staff can check back on earlier orders without leaving the live board running
  underneath.

Neither of these expose any new actions — they're purely for looking back at what's already gone
out during the shift.

## Follow-up: single card per order, not horizontal columns (latest update)

Feedback on the previous update: the swipeable horizontal columns weren't a good fit in practice.
Reverted to **one card per order**, same as before columns were introduced — status just updates
in place on that card (the badge changes color/text as it moves from New → Preparing → Ready →
Served) instead of the card jumping between columns. Applies consistently across the Waiter Orders
tab, Kitchen Display, and Admin's Orders tab. Orders are sorted so the most urgent (New, then
Preparing, then Ready) naturally float to the top, without needing separate columns to see that
at a glance.

Two smaller improvements alongside this:
- **Items within a card now have a clear line between each one** (a thin divider), so a multi-item
  order is easier to scan than items just stacked with no separation.
- **The "ready to serve" alert can now be acknowledged without marking it served.** Previously the
  only way to stop the repeating beep was to serve the item. Now there's an **Acknowledge** button
  — tap it to silence the beep for that specific alert (marked "(acknowledged)" in the banner)
  while still leaving it visible as a reminder to actually go serve it. The beep keeps going for
  anything still unacknowledged, and "Mark Served" is still right there whenever it's actually
  delivered.

## Customer dashboard + column boards for tracking orders

### Customer dashboard restructure
- The top bar (restaurant name + table number) was already sticky/fixed while scrolling the menu
  — confirmed and left as-is.
- **My Orders, Call Waiter, and Close Order & Get Bill are now a persistent bottom tab bar**,
  matching the same pattern staff dashboards already use, instead of being buried inside the "My
  Orders" sheet. All three are reachable in one tap from anywhere in the menu.
- The rating step for closing an order now opens in its own small sheet instead of nested inside
  "My Orders," so it doesn't feel like it's part of order history.
- Call Waiter still shows "Notified ✓" and disables itself for 60 seconds after tapping; Close
  Order still only enables once everything ordered has actually been served — none of the
  underlying logic changed, just where these actions live on screen.

### Orders shown as tracking boards, not flat lists
Waiter's Orders tab, Kitchen Display, and Admin's Orders tab (when viewing "Active") now display
as **columns by status** — New, Preparing, Ready, and (for admin) Served — instead of one long
scrolling list. On a phone, columns swipe horizontally one at a time; on a tablet or larger
screen, all columns show side by side. This makes it much faster to see at a glance how many
orders are at each stage across the whole floor, which is what "easy to read and track" was
asking for. All the existing per-item actions (Start Preparing, Ready, Serve, Cancel) work exactly
as before — this only changed how orders are grouped and laid out, not the underlying Firestore
queries or any of the status logic itself.

## Single order per table + close only when fully served (latest update)

This was a real architecture change, not a small tweak — worth explaining clearly.

### 1. One order per table visit, not one per "Place Order" tap
Previously, every time anyone tapped "Place Order" — the customer adding a second round, or a
waiter adding something — it created a **brand new order** with its own order number. A table
could end up with three or four separate order numbers for what was really one sitting.

Now there's **one order per table per visit**. The first item placed creates the order; everything
added after that (by the customer or a waiter) gets appended to that *same* order, same order
number, updated total. This required a real change under the hood: since items can now be added
after earlier ones are already cooking or served, **each item tracks its own kitchen progress**
(new → preparing → ready → served) instead of the whole order moving through those stages
together. The order's overall status is derived from its items — it's "new" if anything on it
still needs to start, "preparing" if something's cooking, "ready" once nothing's left to cook, and
"served" only once every item has actually gone out.

**What changed in each screen:**
- **Kitchen Display**: each item now has its own Start/Ready button, instead of one button for
  the whole ticket — so kitchen can work on a freshly-added item without re-touching items they
  already marked ready.
- **Waiter Orders tab**: each item shows its own status (waiting for kitchen / being prepared /
  ready to serve / served) with a per-item Serve button once it's ready. The "whole order" Accept/
  Serve Now/Mark Served buttons are gone — replaced by per-item action, which is more accurate now
  that one order can span multiple rounds at different stages. A **"Mark Served" shortcut still
  exists** on the ready-order notification banner, since by definition everything on that specific
  alert is ready at once.
- Item-level cancellation (with a reason) still works exactly as before, per item.
- Additions from a waiter and the customer both land on the same order and both count toward the
  same running total and order number, addressing the original ask directly.

### 2. Can't close the order until everything's actually been served
"Close Order & Get Bill" (customer) and "Close & Request Bill" (waiter) now both require **every
item on the order to be marked served** — not just "an order exists." If anything is still new,
preparing, or sitting ready-but-not-yet-delivered, closing is blocked with a clear message asking
to wait. This is checked live, right when the confirm step opens and again right before the table
actually locks, so a last-second addition can't slip through.

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
