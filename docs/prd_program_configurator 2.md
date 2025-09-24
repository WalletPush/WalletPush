WalletPush Membership and Store card functionality:WalletPush — Product Requirements Document (PRD)
0) Overview & Vision
WalletPush is a multi-tenant web app that lets SMBs launch and operate Membership, Loyalty, and Store Card programs that live in Apple Wallet and Google Wallet. Businesses design their pass, onboard customers, award/redeem points, sell/fulfil offers, and (for Store Cards) manage stored-value balances usable online and in-store.
Stack: Next.js (Vercel) + Supabase (Postgres/Auth/Storage/Realtime) + Stripe (payments) + Resend (email) + Apple PassKit (APNs + Update Web Service) + Google Wallet Objects.

1) Goals
* One dashboard to create and manage Membership, Loyalty, and Store Card programs.
* A WYSIWYG pass designer (Apple & Google preview) with validation and versioning.
* Real-time points and stored-value ledgers; issue/refresh passes instantly.
* Offers: create, claim, and redeem with either points or cash.
* CRM for contacts/members with activity timelines.
* Stripe for membership subscriptions, top-ups, and paid offers.
* Notifications via Resend (email) and APNs/Google updates to Wallet passes.
* Secure, scalable, multi-tenant architecture deployable on Vercel.

2) Personas & Roles
* Business Owner / Admin (tenant owner): configures programs, certs, pricing, offers; views analytics.
* Staff: manages members, awards/redeems points, scans/fulfils offers.
* Customer / Member: signs up, installs pass, sees balance/rewards, tops up store card, claims/redeems offers.
Role model
* owner, admin, staff, customer scoped by tenant_id.

3) Scope of Programs
* Membership: recurring Stripe subscription required; member receives perks (offers, discounts, bonus points).
* Loyalty: free to join; earn points on purchases/events; redeem for offers.
* Store Card: customer tops up stored value (Stripe); balance used to pay online or at POS by scanning pass barcode/QR.
A tenant can enable one or multiple modes per Program.

4) Success Metrics (MVP)
* TTFP (time to first pass): admin can go from new account to issued pass in one session.
* ≥95% successful pass updates on points/redemptions within 5 seconds of event.
* <1% image/validation errors at publish time (designer guardrails).
* Membership conversion per program; top-up conversion for store cards; offer claim→redeem rate.

5) Navigation & Pages
Admin (HighLevel-style layout)
* Dashboard (KPIs & charts)
* Contacts (CRM)
* Programs
    * Pass Designer (per program)
    * Members (per program)
    * Offers
    * Points & Transactions (ledgers)
    * Distribution (install links, QR landing page)
* Pass Type IDs (Apple/Google keys & certs)
* Settings (branding, domains, billing)
Customer
* Dashboard (balances, active membership state, last activity)
* My Offers (available/claimed/redeemed)
* Top Up (store card) & Payment QR/Code (for in-store)
* Install/Manage Pass (Add to Apple Wallet / Save to Google Wallet)

6) Feature Requirements (Admin)
6.1 Dashboard
* KPIs: passes created, points awarded, offers claimed, offers redeemed, store value top-ups, store value spend.
* Time-series charts; filter by program and date range.
* Realtime event feed (pass.created, pass.installed, points.earn, offer.redeemed, store.tx).
Acceptance: Counts and charts reconcile with underlying ledgers; filtering by program updates all widgets.

6.2 Contacts (CRM)
* Table: name, email, phone, created date, programs joined, last activity, lifetime value.
* Import CSV; de-dup by email/phone.
* Contact drawer: timeline (events), offers history, points per program, store card balance per program.
Acceptance: Creating a member from a contact attaches to a chosen program and issues a pass on request.

6.3 Programs
* Create/edit: name, modes (Membership/Loyalty/Store Card toggles), default currency, default points rules, assign Pass Type IDs set.
* Distribution: program landing URL (install page), branded QR, deep links.
Acceptance: Enabling Membership requires linking a Stripe product/price; enabling Store Card requires stored-value ledger to be active.

6.4 Pass Designer (per program)
* Dual preview (Apple & Google) via SVG canvas.
* Panels:
    * Appearance: colors (background/foreground/label), assets (icon/logo/strip), fonts scale.
    * Fields: drag/drop into sections (header/primary/secondary/aux/back) with label/value and ${tokens}.
    * Barcode: type (QR/PDF417/Aztec/Code128), value template.
    * Relevance: locations, beacons, relevant date.
    * Placeholders: manage token definitions and defaults.
    * Actions: links, app association, support URL.
    * Validation: image sizes (@2x/@3x), color space, contrast, field limits.
* Versioning: draft → publish creates immutable template.version, preview PNGs, and compiles platform configs.
* Publish triggers:
    * Apple: template → pass.json defaults; assets renditions ready; update service endpoints configured.
    * Google: ensure LoyaltyClass exists/updated.
Acceptance: Cannot publish with validation errors; device preview .pkpass and Google Save link work for test member.

6.5 Members (per program)
* Table: member, tier, points, store balance, pass installed?, last update.
* Actions: Issue/Refresh Pass, Award Points, Redeem Points, Adjust Balance, Top-up (staff), Disable Member.
* Member drawer: ledgers (points & store value), offers, devices/serials, authentication token for Apple update service.
Acceptance: Any change (points/balance/tier) pushes to pass within seconds.

6.6 Offers
* Create/edit: title, description, image, cost type (points or cash), cost value, validity window, members-only toggle.
* List: status (active/paused/expired), claims/redemptions counts.
* Claim flows:
    * Points: deduct points atomically; create offer_claim.
    * Cash: create Stripe Checkout session; upon webhook success → mark claimed/redeemed per configuration.
* Redemption:
    * Staff portal scan (or code entry) marks redeemed, logs event; optionally credit bonus points.
Acceptance: Claims cannot exceed balance; cash claims reconcile via Stripe webhook.

6.7 Points & Transactions
* Points Ledger: earn/redeem/adjust with actor (staff/system), reference (order/offer), notes.
* Store Value Ledger: top-ups (Stripe), spends (POS/app), refunds, adjustments; running balance.
Acceptance: Ledgers are immutable append-only with computed balances; transactions are idempotent by request key.

6.8 Pass Type IDs (Certificates & Keys)
* Upload/manage:
    * Apple: Pass Type ID (pass.com.*) .p12 + password; APNs token .p8 + Key ID + Team ID; Team ID and Pass Type Identifier.
    * Google: Issuer ID; Service Account JSON.
* Validate:
    * Apple: send test APNs to a sandbox pass; compile a sample pass.
    * Google: upsert a sample Class in sandbox.
Acceptance: A program can only select validated credential sets.

7) Feature Requirements (Customer)
7.1 Dashboard
* Show Membership status (active, trial, canceled), points balance, store balance, recent activity.
* Buttons: Add to Apple Wallet / Save to Google Wallet / Top Up.
7.2 My Offers
* List available (filters: all, points-only, members-only), claimed, redeemed.
* Claim button (points or cash). For in-store redemption, show one-time QR/code.
7.3 Top-Ups (Store Card)
* Presets & custom amount; pay via Stripe; on success append top-up ledger entry and update pass.
Acceptance: Post-purchase, balance reflects immediately; pass updates.

8) Wallet & Platform Behaviours
Apple PassKit
* Pass type: storeCard for all three modes (fields drive semantics).
* Bundle: pass.json, images (icon/logo/strip + retina variants), manifest, signature.
* Update Web Service (required): device registration, serial lookup, auth token per pass; on ledger change → APNs push so Wallet fetches updates.
* Barcode types supported: QR, Aztec, PDF417, Code128.
* Colors must be rgb(r,g,b) strings; images PNG sRGB only.
Google Wallet
* LoyaltyClass/Object (program level vs. per-member).
* Save to Google Wallet link (JWT) and Object PATCH on updates.

9) Payments & Money Flows
Membership
* Stripe Product/Price per program; subscribe at join.
* Webhooks: checkout.session.completed, customer.subscription.updated|deleted → update membership status; gate access to offers.
Store Card (stored value)
* Top-ups: Stripe Checkout / Payment Element; on success write top-up ledger (+optional bonus).
* Spend (in-store): staff scans pass barcode/QR → POST spend with amount; check balance; append spend ledger; update pass.
* Spend (in-app): charge from balance (no Stripe) + optional Stripe for any overage; append ledger.
* Refund: append negative spend or top-up reversal; optional Stripe refund mapping.
This is closed-loop stored value; funds live in your Stripe connected account, not Apple/Google. Add clear T&Cs and jurisdictional disclaimers.

10) Notifications
* Resend emails: welcome, membership activated/canceled, top-up receipt, low balance, expiring offer, point award/redeem.
* APNs / Google: pass refreshes on every ledger or status change.
* Optional webhook to merchant systems (POS/CRM) for custom automations.

11) Data Model (normalized)
Tenancy & Roles
* tenants: id, name, created_at
* tenant_users: tenant_id, user_id, role
Programs & Templates
* programs: id, tenant_id, name, modes (JSON {membership:boolean, loyalty:boolean, store_card:boolean}), currency, status, pass_type_ids_id, created_at
* templates: id, program_id, version, json (Template JSON), previews (JSON), published_at
Contacts & Members
* contacts: id, tenant_id, email, phone, first_name, last_name, profile_photo_url, referral_id, referred_by_contact_id, created_at
* members: id, program_id, contact_id, tier, points (cached), store_balance (cached, cents), status, external_ref, created_at
Passes
* passes: id, member_id, program_id, platform (apple|google), serial (Apple), object_id (Google), install_count, last_update, auth_token (for Apple update service)
Ledgers
* point_events: id, tenant_id, program_id, member_id, type (earn|redeem|adjust), amount, meta, created_at
* store_tx (store card transactions): id, tenant_id, program_id, member_id, type (topup|spend|refund|adjust), amount (cents, positive for topup/refund, negative for spend), currency, source (stripe|pos|app|admin), ref (stripe payment/claim id), meta, created_at
Offers & Claims (Products)
* offers: id, tenant_id, program_id, title, description, image_url, cost_type (points|cash), cost_value, members_only (bool), status (active|paused|expired), starts_at, ends_at, created_at
* offer_claims: id, offer_id, member_id, status (claimed|redeemed|cancelled), cost_paid (points or cents), meta, created_at
Membership Subscriptions (Stripe)
* subscriptions: id, member_id, stripe_customer_id, stripe_subscription_id, plan_name, status (active|trialing|past_due|canceled|incomplete), current_period_end, created_at
Pass Type IDs / Credentials
* pass_type_ids: id, tenant_id, label,Apple: pass_type_identifier, team_id, p12_path, p12_password_enc, apns_key_id, apns_team_id, apns_p8_pathGoogle: issuer_id, service_account_path,created_at
Offer Categories (optional taxonomy)
* offer_categories: id, tenant_id, name, icon_url, image_url, description
Mapping to your earlier flat fields:
* serial number, PassType Id, Pass URL, passInstalled y/n → live in passes and members.
* userCashBalance, userAddedCash y/n, userCashBonus → derived from store_tx ledger; expose on member.
* userPoints → derived from point_events; cached on members.
* userSubscription etc. → subscriptions.
* Offers Claimed/Redeemed → counts over offer_claims.
* Purchases → store_tx with type='spend' and optional product_id in meta.

12) Company Database (filled out)
* companies (optional if you’ll separate businesses from tenants): id, tenant_id, legal_name, display_name, logo_url, support_email, support_phone, website, address_json, timezone, locale, billing_stripe_customer_id, created_at
Why: supports white-label, invoices/receipts branding, and future multi-brand per tenant.

13) Store Card Transactions (completed)
store_tx (see above) + store_tx_items (optional breakdown):
* store_tx: id, tenant_id, program_id, member_id, type (topup|spend|refund|adjust), amount (cents; negative spend), currency, source (stripe|pos|app|admin), ref (stripe_payment_intent/checkout_session/pos_id), meta (JSON: {location_id, staff_id, device_id}), created_at
* store_tx_items (optional): id, tx_id, product_id (nullable), name, qty, unit_price, total_price, tax_json

14) Core Pages & Features (from your list)
* Landing Page: hero + mode explanations (Membership, Loyalty, Store Card) + CTA.
* Auth: Supabase (email/password, optional magic link), user profile.
* Admin Dashboard: KPIs & charts described above.
* Contacts (CRM): as above.
* Pass Designer: as above (Passslot-like).
* Offers: as above (points/cash).
* Pass Type IDs: upload & validate credentials.
* Customer Dashboard: rewards/balances.
* Customer Offers: available/claimed.
* Customer Top-Ups: Stripe checkout.
* Program Distribution: public install page, QR, deep links.

15) Integrations
* Supabase: Auth (RLS with tenant_id claim), Postgres, Storage (assets & secrets), Realtime (dashboards), pg_cron (optional).
* Stripe: checkout for subscriptions/top-ups/cash offers; webhooks to update state; optional Connect for payouts later.
* Resend: emails; templates for core events.
* Apple PassKit: sign .pkpass, Update Web Service, APNs token auth.
* Google Wallet: LoyaltyClass/Object; JWT Save links; PATCH on updates.
* Vercel: hosting; encrypted env; Edge/runtime route handlers.

16) Security, Compliance & Ops
* RLS on every table by tenant_id; server-side checks on mutations.
* Secrets (.p12/.p8/SA JSON) held in Storage private bucket; encrypted at rest; accessed only from server routes.
* Idempotency keys for ledgers and redemptions; append-only; backfilled balances computed by view.
* Audit logs in events.
* Rate limits per tenant for issue/update endpoints.
* GDPR: data export/delete for contacts.
* PCI: payments handled by Stripe; WalletPush never stores card PANs.
* Terms & balance policy for stored value (jurisdictional disclaimers).

17) APIs (high-level)

POST   /api/templates/validate
POST   /api/templates/:id/publish
POST   /api/members/:id/issue             // returns pkpass (apple) or save URL (google)
POST   /api/members/:id/update            // updates points/tier; pushes refresh
POST   /api/points/earn|redeem|adjust
POST   /api/store/tx/topup|spend|refund
POST   /api/offers                        // create
PATCH  /api/offers/:id                    // update/pause
POST   /api/offers/:id/claim              // points or cash claim
POST   /api/offers/:id/redeem             // staff redemption
POST   /api/pass-type-ids                 // upload creds (signed URL dance)
POST   /api/stripe/webhook
POST   /api/apple/v1/devices/...          // PassKit update service endpoints
Acceptance: All write endpoints enforce tenant scope, idempotency, and emit events rows.

18) Non-Functional Requirements
* Performance: p95 route < 300ms (excluding third-party network); image pipeline async; streaming for .pkpass.
* Availability: stateless routes on Vercel; retries for APNs/patch; background queue for bulk.
* Scalability: append-only ledgers; proper indexes (tenant/program/member/date); pagination for tables.
* Accessibility: designer contrast checks; keyboard operable UI.
* Responsive: admin desktop-first, customer mobile-first.

19) Milestones
Phase 1 — Foundations
* Tenancy, Auth, RLS; Programs; Pass Type IDs upload & validation; basic CRM.
Phase 2 — Designer & Issuance
* Designer MVP (validate/publish), Apple .pkpass compile/sign + Update Web Service + APNs; Google Class/Object + Save link; Issue flows.
Phase 3 — Ledgers & Offers
* Points ledger + UI; Offers (points & cash) with claim/redeem; dashboards.
Phase 4 — Store Card
* Stored-value ledger; Stripe top-ups; spend/refund flows; staff redemption portal; customer Top-Up & Payment QR.
Phase 5 — Polish & Analytics
* Charts, realtime feed, email automations, template versioning UX, domains/branding.

20) Open Questions & Assumptions
* POS Integration: initial scope is scan-to-redeem via staff portal; deeper POS APIs are out of scope for MVP.
* Google Programs: loyalty only for MVP (Google “offers” may be added later).
* Refund Rules: define per program; allow admin to refund to stored value or to original Stripe payment.
* Internationalization: English first; locale/currency stored per program.
* Taxes/Receipts: for store-card spends, receipts come from the merchant POS, not WalletPush (MVP).

Appendix — Offer Categories schema (from your prompt)
* creator (tenant/program ref)
* category_icon (URL)
* category_image (URL)
* category_name (text, unique per tenant)
* category_description (text)

IMPORTANT: We will only be using APPLE for now. Google dev will come later


NEW PROGRAM CONFIGURATOR AND MEMBERS AREA PRD V1

Build a template-first, JSON-driven program configurator that lets a business owner:

Select a template (already designed),

Choose a program type via radios (options gated by template placeholders) or manually add placeholders to unlock more options,

Choose basic rewards (simple catalog / allowances / credit),

Click Generate with AI → AI outputs a valid Benefits Spec JSON (including ui_contract.sections) and writes it to the DB, and the member dashboard updates immediately.

Scope includes loyalty, membership, store card, universal offers (simple), member check-in scanner (inside the member area), staff scanner (PWA), and basic audit metrics. No RFM, no cost simulators, no heavy compliance engines.

1) Goals & Non-Goals
Goals

Ship a fast, elegant MVP where templates constrain configuration and AI fills the blanks.

One renderer for all programs; layout controlled by JSON (no page branching).

Deterministic event ledger for earn/redeem/check-in; basic business audit.

Non-Goals (explicitly out of MVP)

RFM segmentation, advanced guardrails, liability sims, A/B testing, complex scheduling rules, jurisdiction-specific compliance.

2) Personas

Business Owner/Admin: sets up template & program, creates offers, publishes.

Staff: uses scanner PWA to earn/redeem/check balance (optional).

Member: uses member dashboard + member check-in scanner.

3) End-to-End Flow (Wizard)

Template Selection

Show templates the business already created.

On selection, run Template Validation System (TVS):

Parse placeholders (e.g., ${points}, ${tier}, ${membershipStatus}, ${creditBalance}, ${storedValueBalance}, ${offers}, ${qrCheckIn}, ${checkInStamp}).

Derive capabilities and allowed program types.

Program Selection

Show radio buttons for allowed types: Loyalty, Membership, Store Card.

If an option is missing, show tip: “To enable X, add placeholder ${...}.”

Manual placeholders: owner can switch templates or add placeholders; TVS rescans → radios update.

Basic Rewards & Basics

Loyalty: set points_per_currency (default 1), optional tiers (max 3), reward_catalog (e.g., Free drink = 100 pts).

Membership: set price_monthly, add perks (text), optional allowances (e.g., 2 tastings/mo), optional credit (e.g., $20/mo).

Store Card: enable stored value, optional expiry (≥30 days).

Universal Offers (optional):

Add simple offers with availability: Everyone / Specific tier / Inactive X days / New members 30 days.

Redemption: points OR credit OR free, with simple per-member limits (e.g., 1/month).

Generate with AI (single big button)

Sends: business context, selected template capabilities, chosen program, basic rewards/offers → to AI Spec Writer.

AI returns a single JSON spec with:

program_type

program rules

offers[] (if added)

copy (headlines/labels)

ui_contract (layout + sections)

optional warnings[]

App validates (light checks), persists to program_versions (new version), and revalidates cache.

Immediately renders the member dashboard from the new spec.

4) Functional Requirements
4.1 Template Validation System (TVS)

Input: template file / metadata with placeholders.

Output: { placeholders[], capabilities[], allowed_program_types[] }

Rules:

Map placeholders → capabilities:

${points}→points, ${tier}→tiers, ${membershipStatus}→membership, ${allowance}→allowances, ${creditBalance}→credit, ${storedValueBalance}→stored_value, ${offers}→offers, ${qrCheckIn}→qr_check_in, ${checkInStamp}→check_in

Allowed program types:

Loyalty requires points (tiers optional)

Membership requires membership (allowances/credit optional)

Store Card requires stored_value

Configurator gating: show only valid radios; if user adds placeholders, TVS rescans and updates.

4.2 AI Spec Writer (single JSON)

Contract (must return only JSON):

version, program_id, program_type

template_capabilities: string[]

Loyalty: earning { basis:"spend", rate_per_currency }, optional tiers { enabled, levels[] }, redemption { catalog[] }

Membership: billing { price_monthly, currency, billing_day }, membership { perks[], allowances[]?, credit? }, optional redemption { catalog[] }

Store Card: stored_value { expiry_days? }

Offers (optional): see 4.3

Member check-in: if ${qrCheckIn} or ${checkInStamp} present, include check_in: { enabled: true }

copy: program_name, tagline, how_it_works, fine_print (short)

ui_contract: { layout: "<type>_dashboard_v1", sections: [{ type, props[] }] }

Optional warnings[]

Light validation (fail hard if):

Tiers not strictly increasing

Reward cost ≤ 0

Store card expiry < 30 days (if provided)

Check-in thresholds < 1 (if stamps used)

4.3 Universal Offers (optional)

Offer object:

id, title, description, optional image_url

redemption: { type: "points"|"credit"|"free", cost? }

availability: { audience: "everyone"|"tier"|"inactive_days"|"new_members", value? }

limits: { per_member?: "1/month"|"1/year"|number, total_quantity?: number } (optional)

schedule: { start_date?, end_date? } (optional, keep simple)

Apply across all program types.

4.4 Member Dashboard (JSON-driven)

One page renders from ui_contract.sections:

Loyalty: balanceHeader, progressNextTier, rewardsGrid, offersStrip?, qrCheckInButton?, activityFeed

Membership: membershipHeader, renewalCard, allowancesList, creditWallet, offersStrip?, qrCheckInButton?, activityFeed

Store Card: storeCardHeader, balanceCard, redeemGrid, offersStrip?, qrCheckInButton?, activityFeed

Member check-in scanner:

If capability qr_check_in present, show “Check In” button.

Member taps → camera opens → scans business QR (just an API URL for that business).

Backend records check_in event for that member + business.

4.5 Staff Scanner (PWA)

QR member lookup.

Actions: Earn, Redeem, Check balance.

Online first; offline queue is post-MVP.

Each action produces an event with staff_id, location_id, timestamp.

4.6 Event Ledger

Append-only member_events:

event_id, member_id, program_id, program_version_id, idempotency_key

type: earn | redeem | check_in | adjust | auto_reward

amounts: { points_delta?, credit_delta?, stored_value_delta? }

source: member_scanner | staff_scanner | api | admin

observed_at, recorded_at, meta (sku, location, staff_id, etc.)

Snapshots optional (only if performance demands).

4.7 Audit Metrics (per business)

Total members

Total points/credits issued

Total redemptions

Outstanding liability (unredeemed points/credits/store value)

Last 30-day activity count
(Charts can be simple sums; no advanced analytics.)

5) APIs (minimum)

GET /api/program/spec → current program spec JSON (cached/ISR)

POST /api/program/generate → runs AI Spec Writer, validates, writes new program_version (returns spec)

GET /api/member/summary → normalized member state for current program (points | credit | stored_value | allowances, claimables, next_invoice, recent_activity)

Scanner

Staff: POST /api/scanner/earn, POST /api/scanner/redeem, GET /api/scanner/balance

Member check-in: POST /api/checkin/:business_id (from QR), authenticated as member session

6) Data Model (minimum viable)

programs (id, business_id, status)

program_versions (id, program_id, version, spec_json, created_at, created_by)

member_events (id, member_id, program_id, program_version_id, type, amounts_json, source, observed_at, recorded_at, meta_json, idempotency_key)

(Optional) member_snapshots (member_id, program_id, as_of, summary_json)

7) Acceptance Criteria

TVS correctly limits program radios based on placeholders; adding placeholders refreshes choices.

Generate with AI creates a valid spec with ui_contract.sections; DB writes a new version; dashboard re-renders with no code changes.

Member check-in from member UI creates a check_in event and updates summary.

Staff scanner can earn/redeem and see balance; all actions create events.

Audit metrics populate from events.

Guardrails prevent obviously broken configs (tier order, >0 costs, expiry ≥30d).

Zero branching in the dashboard page; components render purely from JSON.

8) UX Notes (just enough)

Wizard steps across the top: Template → Program → Rewards/Offers → Review → Generate.

Always show the live preview on the right (rendered from the current draft JSON).

On Generate, show a short diff (“Added: 2 perks, 1 offer; Tiers: Silver 1000, Gold 3000”).