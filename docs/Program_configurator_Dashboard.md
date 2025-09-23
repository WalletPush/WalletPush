One ledger primitive (keep this universal)

POST /api/ledger/append

{
  "customer_id": "<uuid>",
  "program_id": "<uuid>",
  "type": "earn | redeem | check_in | adjust | auto_reward",
  "amounts_json": { /* points_delta | credit_delta | stored_value_delta | allowance_id */ },
  "source": "member_scanner | staff_scanner | api | admin",
  "idempotency_key": "<scan_session_id>:<action>",
  "observed_at": "2025-09-23T15:20:00Z",
  "meta_json": { /* free-form details per component */ }
}


That’s the whole game. Every component below just posts one of these.

Universal (any program)
1) QR Check-In Button (member)

Where: Member dashboard section qrCheckInButton

Scan → member scans business QR; backend appends visit

Ledger: check_in

{ "amounts_json": {}, "meta_json": { "location_id":"...", "device":"ios" } }


Optional auto reward on check-in:

{ "type":"auto_reward", "amounts_json": { "points_delta": 10 }, "meta_json": { "reason":"check_in_bonus" } }

2) Offers Strip (claim/redeem)

Where: offersStrip (member) + staff scanner

Scan → staff scans member QR, selects an offer → redeem

Ledger: redeem

{ "amounts_json": { "points_delta": -100 }, "meta_json": { "offer_id":"...", "title":"Free Coffee" } }


(Use credit_delta or free in meta when cost_type ≠ points.)

3) Activity Feed (view-only)

Where: activityFeed

Ledger: no write; reads last N customer_events.

4) Guide Steps (onboarding / how-it-works)

Where: guideSteps

Ledger: optional auto_reward when step completed

{ "amounts_json": { "points_delta": 25 }, "meta_json": { "step":"complete_profile" } }

5) Birthday Reward (auto claim window)

Where: offersStrip shows “Birthday Treat”

Ledger: auto_reward (claim)

{ "amounts_json": { "points_delta": 0 }, "meta_json": { "birthday_reward_id":"...", "granted":"free_item" } }

6) Streaks / Visit Milestone

Where: activityFeed badge or small streakCard

Scan → triggered by check-in rule

Ledger: auto_reward

{ "amounts_json": { "points_delta": 50 }, "meta_json": { "streak_days": 7 } }

Loyalty (points)
7) Points Balance Header

Where: balanceHeader

Ledger: read-only

8) How To Earn (plain explainer)

Where: howToEarn

Ledger: none

9) Progress to Next Tier

Where: progressNextTier

Ledger: none

10) Reward Redemption Grid

Where: rewardsGrid

Scan → staff selects item, confirms

Ledger: redeem

{ "amounts_json": { "points_delta": -250 }, "meta_json": { "reward_id":"mug", "title":"Member Mug" } }

11) Quick Earn (staff)

Where: staff scanner action “Earn points”

Scan → enter spend or fixed points

Ledger: earn

{ "amounts_json": { "points_delta": 125 }, "meta_json": { "basis":"spend", "subtotal": 25.00 } }

12) Multiplier Banner (membership cross-boost)

Where: read-only banner; logic runs on earn

Ledger: still just one earn, but include:

{ "amounts_json": { "points_delta": 200 }, "meta_json": { "multiplier": 1.25, "reason":"member_boost" } }

Membership (allowances / credit)
13) Renewal Card 

Where: renewalCard

Ledger: billing webhook writes:

{ "type":"earn", "amounts_json": { "credit_delta": 20 }, "meta_json": { "reason":"monthly_credit", "invoice_id":"..." } }

14) Allowances List (consume)

Where: allowancesList

Scan → staff taps “Use 1 tasting flight”

Ledger: redeem

{ "amounts_json": { "allowance_id":"tasting_flights" }, "meta_json": { "qty": 1 } }

15) Credit Wallet (apply credit to bill)

Where: creditWallet

Scan → staff applies $X credit to purchase

Ledger: redeem

{ "amounts_json": { "credit_delta": -12.00 }, "meta_json": { "ticket":"bar_tab", "note":"apply member credit" } }

16) Guest Pass (1/mo)

Where: rewardsGrid or allowancesList

Ledger: redeem

{ "amounts_json": { "allowance_id":"guest_pass" }, "meta_json": { "guest_name":"..." } }

Store Card (stored value)
17) Balance Card

Where: balanceCard (view-only)

18) Top-Up (staff)

Where: scanner action “Top up”

Ledger: earn

{ "amounts_json": { "stored_value_delta": 30.00 },
  "meta_json": { "payment_method":"card", "pos_txn_id":"..." } }

19) Pay with Store Card

Where: scanner action “Charge from card”

Ledger: redeem

{ "amounts_json": { "stored_value_delta": -12.50 },
  "meta_json": { "order_id":"...", "tip": 0 } }

20) Refund to Store Card

Where: staff scanner action “Refund”

Ledger: adjust

{ "amounts_json": { "stored_value_delta": 12.50 },
  "meta_json": { "refund_of":"order_123" } }

Event Tickets
21) Ticket Wallet (list + QR)

Where: eventsStrip

Ledger: none (view)

22) Admission Scan

Where: staff scanner “Admit”

Ledger: redeem

{ "amounts_json": {}, "meta_json": { "event_id":"...", "ticket_id":"...", "gate":"A" } }

23) Event Perk Coupon (drink token)

Where: rewardsGrid scoped to event

Ledger: redeem

{ "amounts_json": {}, "meta_json": { "event_perk_id":"drink_token" } }

Scanner → ledger quick-actions (put these in your staff UI)

Earn Points (enter subtotal) → type: earn, points_delta

Redeem Reward (pick from grid) → type: redeem, points_delta:-X

Check-In → type: check_in

Use Allowance → type: redeem, allowance_id

Apply Member Credit → type: redeem, credit_delta:-X

Top-Up Card → type: earn, stored_value_delta:+X

Charge Card → type: redeem, stored_value_delta:-X

Admit Ticket → type: redeem, meta.event_id/ticket_id

Each post includes:

source = staff_scanner (or member_scanner for user check-in)

idempotency_key = scan_session_id:action_id (so double scans don’t double-charge)

observed_at from the device clock

minimal amounts_json per the examples

Minimal validation (server-side)

One amount key per event (keep it atomic).

Ensure negatives only on redeem/adjust.

Enforce program type: no points_delta for store-card-only programs, etc.

If tier/multiplier rules apply, compute them server-side and write the final delta (include details in meta_json).

Where these show up on the dashboard

Loyalty: balanceHeader, progressNextTier, howToEarn, rewardsGrid, activityFeed, offersStrip, qrCheckInButton.

Membership: membershipHeader, renewalCard, allowancesList, creditWallet, perksGrid, eventsStrip, activityFeed.

Store Card: storeCardHeader, balanceCard, redeemGrid, activityFeed.

Events: eventsStrip, activityFeed.

If you want, I can turn this into a component registry checklist (keys + required props) and a ledger test matrix so Claude can scaffold the sections fast without touching the rule engine.

Universal (works for any program)

1) qrCheckInButton

What: Big “Check in” button → opens scanner to hit the business QR.

Ledger: check_in
{"type":"check_in","source":"member_scanner","amounts_json":{},"meta_json":{"location_id":"…"}}

2) offersStrip

What: Carousel of claimable offers (birthday, monthly, inactivity, tier-only).

Ledger: redeem (or auto_reward for free grants)
{"type":"redeem","source":"member_scanner","amounts_json":{"points_delta":-100},"meta_json":{"offer_id":"…"}}

3) activityFeed

What: Recent events with badges (earned, redeemed, check-ins, top-ups).

Ledger: none (read-only).

4) guideSteps

What: Onboarding steps (“Complete profile”, “Install pass”, “First check-in”). Optional “finish step → bonus”.

Ledger (optional): auto_reward
{"type":"auto_reward","source":"api","amounts_json":{"points_delta":25},"meta_json":{"step":"install_pass"}}

5) leaderBoardMonthly

What: Top members this month (first-name + initial). Drives friendly competition.

Ledger: none (derived from earn).

Loyalty (points & tiers)

6) balanceSpeedo (your “speedo” gauge)

What: Circular gauge of current points + inline “to next reward”.

Ledger: none (reads points_balance + points_to_next_reward).

7) progressNextTier

What: Horizontal milestone bar with tier badges (Silver → Gold → Platinum).

Ledger: none.

8) howToEarn

What: Tiles for earn rules & multipliers (e.g., “$1 = 1pt”, “Mondays 2×”).

Ledger: none; multipliers applied server-side on earn.

9) rewardsGrid

What: Redeemable rewards with eligibility flags (“Ready”, “50 pts short”).

Ledger: redeem
{"type":"redeem","source":"staff_scanner","amounts_json":{"points_delta":-250},"meta_json":{"reward_id":"mug"}}

10) streakCard

What: “Visit streak” tracker with a flaming ring when hot 🔥; auto bonus at thresholds.

Ledger (when thresholds hit): auto_reward
{"type":"auto_reward","source":"api","amounts_json":{"points_delta":50},"meta_json":{"streak_days":7}}

11) boosterCountdown

What: After a check-in, show “2× points for 60 minutes” chip with timer.

Ledger: still a single earn; include multiplier in meta_json
{"type":"earn","source":"staff_scanner","amounts_json":{"points_delta":200},"meta_json":{"multiplier":2,"boost_window_id":"…"}}

Membership (allowances & credit)

12) renewalCard

What: “Renews on 15th — next charge $47”, status pills (Active / Paused).

Ledger (via billing webhook): earn credit grant
{"type":"earn","source":"api","amounts_json":{"credit_delta":20},"meta_json":{"reason":"monthly_credit","invoice_id":"…"}}

13) allowancesList

What: Chips for member allowances (e.g., “Tasting flights 2/2”), plus “Use 1” action.

Ledger: redeem with allowance id
{"type":"redeem","source":"staff_scanner","amounts_json":{"allowance_id":"tasting_flights"},"meta_json":{"qty":1}}

14) creditWallet

What: Balance, expiry, and “Apply $X credit” quick action.

Ledger: redeem
{"type":"redeem","source":"staff_scanner","amounts_json":{"credit_delta":-12},"meta_json":{"ticket":"bar_tab"}}

15) contentLibrary

What: Member-only videos, PDFs, recipes, workouts — gated by membership.

Ledger: none (keep it simple). Optional lightweight view counter in a separate table if you want analytics later.

16) perkPicker

What: “Choose your monthly perk” (e.g., 1 of 3). Locks choice for cycle.

Ledger: redeem with allowance id perk_choice
{"type":"redeem","source":"member_scanner","amounts_json":{"allowance_id":"perk_choice"},"meta_json":{"choice":"free_flight"}}

Store Card (stored value)

17) balanceCard

What: Big stored-value balance + mini statement.

Ledger: none.

18) topUpQuick

What: $20 / $50 / $100 fast top-up buttons (staff).

Ledger: earn
{"type":"earn","source":"staff_scanner","amounts_json":{"stored_value_delta":50},"meta_json":{"payment_method":"card"}}

19) topUpLadderBanner

What: “Top up $50 → +$5 bonus”. Auto bonus on threshold.

Ledger (bonus): auto_reward
{"type":"auto_reward","source":"api","amounts_json":{"stored_value_delta":5},"meta_json":{"reason":"ladder_bonus"}}

20) chargeFromCard

What: “Pay $X from card” button in staff flow.

Ledger: redeem
{"type":"redeem","source":"staff_scanner","amounts_json":{"stored_value_delta":-12.5},"meta_json":{"order_id":"…"}}

Events

21) eventsStrip

What: Upcoming tickets + “Add to Apple Wallet”.

Ledger: none.

22) admitScan

What: Staff scans member pass → admit ticket; optional perks post-admission.

Ledger: redeem
{"type":"redeem","source":"staff_scanner","amounts_json":{},"meta_json":{"event_id":"…","ticket_id":"…"}}

23) eventPerkCoupon

What: “1 free drink” visible after admission; one-tap claim.

Ledger: redeem
{"type":"redeem","source":"member_scanner","amounts_json":{},"meta_json":{"event_perk_id":"drink_token"}}

Viral / Growth

24) referAFriend

What: Personal invite link + QR; show progress (“2/3 referrals to unlock…”).

Ledger: when referee completes first check-in or spend → auto_reward for referrer
{"type":"auto_reward","source":"api","amounts_json":{"points_delta":200},"meta_json":{"ref_code":"XYZ123","reason":"referral_first_action"}}

Minimal infra: a referrals table with {ref_code, referrer_customer_id, referee_customer_id, status} (status: issued|clicked|converted). You already award via the normal ledger.

25) socialFollowBoost

What: One-tap “Follow on IG” → verify with a claim code at counter (simple MVP), small bonus.

Ledger: auto_reward once per member
{"type":"auto_reward","source":"admin","amounts_json":{"points_delta":25},"meta_json":{"action":"follow_ig"}}

UI candy (no extra backend)

26) kpisGauge

What: Multi-ring gauge (points / credit / visits this month).

Ledger: none. Purely binds to /api/customer/summary.

27) milestoneBanner

What: “150 pts to Gold” or “$8 credit expiring in 14d”.

Ledger: none; computed.

28) badgesCase

What: Achievements (First Check-In, 5 Visits, 10 Redemptions).

Ledger: none; when a badge unlocks you may post an auto_reward if you want.

Exactly how you enable these from the configurator

In the Benefits Spec:

{
  "ui_contract": {
    "layout": "loyalty_dashboard_v1",
    "sections": [
      { "type": "balanceSpeedo", "props": ["points_balance","points_to_next_reward"] },
      { "type": "rewardsGrid", "props": ["redemption.catalog","claimables"] },
      { "type": "qrCheckInButton", "props": ["business_qr_url"] },
      { "type": "offersStrip", "props": ["offers.available"] },
      { "type": "streakCard", "props": ["streak.days","streak.best"] },
      { "type": "kpisGauge", "props": ["points_balance","visits_this_month","credit_balance"] },
      { "type": "activityFeed", "props": ["recent_activity"] }
    ]
  }
}


And your configurator “enable section” action just appends/removes these sections entries:

{ "type":"enable_section", "section":"rewardsGrid" }

Anti-abuse guardrails (tiny, server-side)

Idempotency: scan_session_id:action for all scanner posts.

One key per event: only one of points_delta | credit_delta | stored_value_delta | allowance_id.

Rate limit: member check-ins: 1 / location / X minutes.

Referral: reward referrer only after referee’s first qualifying earn/check_in. Max N per month.

Theming (dark by default, no globals touched)

Goal: widgets ship with a dark default, but businesses can pick presets or tweak brand accents—without leaking styles into the rest of the app.

How to do it

Scope everything under a single root (no global CSS):

Wrap the member dashboard in <div className="wp-root" data-wp-theme="dark">…</div>

All widget CSS lives in a single CSS Module (or vanilla-extract) with prefixed classes (.wp-card, .wp-chip) and CSS variables.

Tokens via CSS variables (set only on the root):

// WPThemeProvider.tsx
export function WPThemeProvider({ theme, children }:{
  theme: { preset: string; primary?: string; accent?: string; radius?: number; density?: 'compact'|'cozy'|'spacious'; variant?: 'solid'|'glass' }
}) {
  const t = resolveTheme(theme); // maps preset -> tokens
  return (
    <div
      className="wp-root"
      data-wp-variant={t.variant}
      style={{
        // colors
        ['--wp-bg' as any]: t.bg,
        ['--wp-surface' as any]: t.surface,
        ['--wp-elev' as any]: t.elev,
        ['--wp-text' as any]: t.text,
        ['--wp-muted' as any]: t.muted,
        ['--wp-primary' as any]: t.primary,
        ['--wp-accent' as any]: t.accent,
        // shape & density
        ['--wp-radius' as any]: `${t.radius}px`,
        ['--wp-gap' as any]: t.gap
      }}
    >
      {children}
    </div>
  );
}

/* widgets.module.css (scoped) */
.wp-card {
  background: var(--wp-surface);
  color: var(--wp-text);
  border-radius: var(--wp-radius);
  box-shadow: 0 1px 0 rgba(255,255,255,.04), 0 10px 30px rgba(0,0,0,.35);
}
.wp-chip { background: var(--wp-elev); color: var(--wp-muted); }
.wp-cta  { background: var(--wp-primary); color:#fff; }


Preset registry (stored in spec_json.ui_contract.theme):

{
  "ui_contract": {
    "theme": {
      "preset": "dark-midnight",  // default
      "primary": "#7C5CFF",
      "accent": "#22D3EE",
      "radius": 14,
      "density": "cozy",
      "variant": "glass"          // solid|glass
    }
  }
}


Preset ideas (just token maps):

dark-midnight (default): near-black bg, slate surfaces, neon accent

dark-plum: rich purple primary, warm surfaces

dark-emerald: green primary, cool surfaces

light-classic: white surfaces, charcoal text

brand-auto: derive primary from the uploaded logo (simple color pick heuristic)

No global styles get touched—everything sits under .wp-root with CSS variables. If you ever need hard isolation, you can wrap any single widget in a Web Component (Shadow DOM), but you won’t need that for v1.

Component configuration UX (business-friendly)

Goal: make it dead simple to tune behavior (e.g., “points for a check-in”) and appearance without exposing raw JSON.

Key idea

Each section in ui_contract.sections can have a settings object, and the program rules live in a top-level rules object. The configurator renders form controls from a small schema so you don’t hand-write forms per component.

Spec shape
{
  "rules": {
    "loyalty": {
      "earn": { "basis": "spend", "rate_per_currency": 1 },
      "check_in": { "enabled": true, "points": 10, "cooldown_minutes": 20 }
    },
    "membership": {
      "allowances": [{ "id":"tasting_flights","qty":2,"rollover":false }],
      "monthly_credit": { "amount": 20, "rollover_cap": 60 }
    },
    "store_card": { "topup_bonus": [{ "threshold":50,"bonus":5 }] }
  },
  "ui_contract": {
    "layout": "loyalty_dashboard_v1",
    "theme": { "preset": "dark-midnight" },
    "sections": [
      { "type": "balanceSpeedo", "settings": { "variant": "ring", "showTier": true } },
      { "type": "qrCheckInButton", "settings": { "style": "button", "showCooldown": true } },
      { "type": "rewardsGrid", "settings": { "columns": 2, "showPrices": true } }
    ]
  }
}

Configurator patterns

Left panel: Components list

Checkbox to enable/disable.

Drag handle to reorder.

Selecting a component opens a right-side “Settings” drawer.

Right drawer tabs for the selected component

Appearance (local to section):

Variant (e.g., ring/half/bar for Speedo)

Density (compact/cozy/spacious)

Accent override (optional)

Behavior (writes to rules when appropriate):

“Points for check-in” → rules.loyalty.check_in.points

“Check-in cooldown (min)” → rules.loyalty.check_in.cooldown_minutes

“Allow redeem from grid?” → rules.loyalty.redemption.allowed = true

Visibility

“Hide when empty” (e.g., no offers)

“Show only for tiers” (array of tiers)

Quick presets across the top**

Minimal / Standard / Full Experience → just apply predefined sections[] lists and safe settings.

Tiny schema to auto-render controls (developer joy)
// registry/config-schemas.ts
export const SECTION_SCHEMAS = {
  qrCheckInButton: {
    appearance: [
      { key: 'settings.style', type:'select', label:'Style', options:['button','card'] },
      { key: 'settings.showCooldown', type:'switch', label:'Show cooldown tag' }
    ],
    behavior: [
      { key: 'rules.loyalty.check_in.points', type:'number', label:'Points per check-in', min:0, max:1000, step:1 },
      { key: 'rules.loyalty.check_in.cooldown_minutes', type:'number', label:'Cooldown (minutes)', min:0, max:1440, step:5 }
    ]
  },
  balanceSpeedo: {
    appearance: [
      { key:'settings.variant', type:'select', label:'Gauge', options:['ring','half','bar'] },
      { key:'settings.showTier', type:'switch', label:'Show tier badge' }
    ]
  },
  rewardsGrid: {
    appearance: [
      { key:'settings.columns', type:'select', label:'Columns', options:[2,3] },
      { key:'settings.showPrices', type:'switch', label:'Show point prices' }
    ],
    behavior: [
      { key:'rules.loyalty.redemption.enabled', type:'switch', label:'Allow redemption in app' }
    ]
  }
} as const;


Your form engine:

Reads the schema for a section.

Binds inputs to the spec path (rules.* or ui_contract.sections[i].settings.*).

Saves changes to a draft spec (in state) and the live preview re-renders immediately.

On publish, write the draft to program_versions.spec_json and flip programs.current_version_id.

Where “points for a check-in” lives

In rules, not inside the widget:

The UI for qrCheckInButton surfaces that control, but it writes to rules.loyalty.check_in.points.

The ledger logic (server) reads the rule once and applies it.

Extras you’ll like

Theme picker UI in the configurator:

Presets grid (cards showing a tiny dashboard mock with that theme).

“Brand from logo” button to auto-pick a primary color.

Advanced panel: radius slider, density select, variant select, primary/accent color pickers.

Per-section accent override:

Optional settings.accent to make, say, balanceSpeedo use the brand gradient while the rest remains dark.

Safety guardrails (quiet)

Validate rules before publish (numbers within ranges, cooldown ≥ 0, etc.).

If loyalty is disabled in modes, hide loyalty controls.