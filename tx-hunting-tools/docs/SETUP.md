# TX Hunting Tools — Deployment & Configuration Runbook

Everything code-shaped lives in this repo (`wp-theme/tx-hunting-tools/`).
Everything below is the manual work in HostGator, WordPress admin, and Ecwid
admin that cannot be done from code. Work top to bottom.

> **Compliance ground rules (do not deviate):**
> - Self-hosted WordPress on HostGator. **No Shopify. No WooCommerce.**
> - Cart/checkout = the client's **existing Ecwid account**, embedded via the
>   Ecwid Ecommerce Shopping Cart plugin.
> - Payments = **Authorize.Net only**, backed by an FFL-friendly high-risk
>   merchant account. Never enable Stripe / PayPal / Square.
> - Regulated items (suppressors, custom firearms) **never ship
>   direct-to-customer** — in-store pickup or FFL transfer only, enforced in
>   Ecwid product/shipping settings.

## Phase 1 — Environment (HostGator)

1. **Decide install target** (open question #1): new HostGator instance vs.
   the existing Team Backed hosting account. Confirm with the client first.
2. Install WordPress via HostGator's installer (Softaculous / QuickInstall).
3. Do **not** install WooCommerce, including via "recommended plugins" upsells
   during setup.
4. Upload the theme: zip `wp-theme/tx-hunting-tools/` and install via
   Appearance → Themes → Add New → Upload, then activate.

## Phase 2 — WordPress configuration

1. Settings → Reading → homepage displays a **static page**; create an empty
   page "Home" and assign it (the theme's `front-page.php` renders the layout).
2. Create pages:
   - **Shop** (slug `shop`) — the theme auto-applies the "Shop — Full Store"
     template: a dark-themed page that embeds the full Ecwid store. Leave the
     body empty (or add intro copy above the store). This is the separate
     page the nav "Shop" link and the homepage "Browse the Full Store" button
     point to.
   - **About** (slug `about`) — auto-applies the "About" template; write the
     About copy in the normal editor.
   - **Terms**, **Privacy**, **FFL Info** (slug must be `ffl-info` — the theme
     ships a dedicated template keyed to that slug with the license plate and
     transfer-process copy built in).
   *(For any page, the template also shows under Page Attributes → Template if
   you ever need to assign it manually.)*
3. Menus: build a "Primary" menu (Shop / Capabilities / Custom Work / Contact
   as custom links to `/#shop` etc.) and a "Footer" menu (Terms / Privacy /
   FFL Info). The theme falls back to hard-coded links if no menu is assigned.
4. Appearance → Customize → **Shop Details**: FFL number, address, email,
   season line, and phone (phone is blank and hidden until the client
   provides one — open question #5).
5. Permalinks → Post name.

## Phase 3 — Ecwid integration

1. Plugins → Add New → search "**Ecwid Ecommerce Shopping Cart**" → install,
   activate.
2. Connect to the client's **existing** Ecwid account (log in during plugin
   setup — do NOT create a new store).
3. **Check the plan tier first** (open question #2): Authorize.Net is only
   available on **Venture, Business, or Unlimited**. If the client is on
   Starter, they must upgrade before Phase 4 — flag it immediately.
4. The homepage Shop section renders the storefront automatically once the
   plugin is active (the theme calls the `[ecwid widgets="productbrowser"]`
   shortcode; until then it shows a "storefront pending" placeholder).
5. Ecwid admin → **Design**: dark color scheme, primary color `#C9A876`,
   font Inter. Then paste `assets/css/ecwid-skin.css` into Ecwid's custom-CSS
   box (Design → Custom CSS) so the cart/checkout screens that render outside
   the page DOM pick up the overrides too.
   **This is what fixes the bright-green category grid** — that color is
   Ecwid's default storefront theme, set here, not in the WordPress theme.
   The Shop page wraps the store in the dark site frame, but the store's own
   background/tile colors must be changed in these Ecwid Design settings.
   *Set expectations with the client: the store section will be close to, but
   not pixel-identical with, the rest of the site — Ecwid limits styling
   control vs. a native build, especially at checkout.*
6. Ecwid admin → Catalog → Categories — create these, in order:
   1. `Suppressors`  ⚠️ regulated — transfer only
   2. `Optic & Slide Cuts`  (service)
   3. `Gunsmith Work`  (service)
   4. `Muzzle & Suppressor Accessories`
   5. `Laser Engraved`
   6. `Dealer Application`  (see note below — really a form, not a shippable
      product)
   7. `Guns & Receivers`  ⚠️ regulated — transfer only
   8. `Custom Cut Foam for Gun Case`
   9. `Merchandise`

   **Service categories** (Optic & Slide Cuts, Gunsmith Work) are sold as
   Ecwid products: create the service as a product, disable shipping on it,
   and state in the description how the customer gets the work done (mail in
   a slide, drop off in-shop, etc.). Ecwid checkout takes the payment;
   fulfillment is described per product.

   **Dealer Application** isn't a physical product. Cleanest is to make it a
   single $0 product whose description links to (or embeds) an application —
   e.g. a form built with a free plugin like Fluent Forms or WPForms on a
   dedicated WP page, then point the Ecwid product there. Alternatively skip
   Ecwid for it entirely and just add a "Dealer Application" WP page with the
   form; tell me which and I'll wire it up.
7. **Regulated products** (everything in Suppressors / Guns & Receivers):
   - Product → Shipping & Pickup → **disable all shipping methods**.
   - Enable **in-store pickup** (166 Loch Lomond Dr, League City, TX 77573).
   - In the product description, add the standing line: *"Transfer only — this
     item does not ship. Pick up in-shop or contact us to arrange a transfer
     to your local FFL."* (Fulfillment UX beyond this — form vs. booking
     calendar vs. phone CTA — is open question #6.)
8. **Non-regulated products** (Optics / Apparel / Field Tools): normal Ecwid
   shipping + checkout, no restrictions.

## Phase 4 — Payments (manual, client-side prerequisite)

1. **Prerequisite the client must do themselves** (open question #3): obtain
   an **Authorize.Net gateway account paired with an FFL-friendly merchant
   account** from a specialized high-risk processor. Standard processors
   will not board firearm/suppressor transactions.
2. Once they have credentials: Ecwid admin → Payment → Credit or debit cards
   → **Authorize.Net** → enter the **API Login ID** and **Transaction Key**.
3. Leave every other card processor disabled. If Stripe/Square/PayPal tiles
   appear pre-enabled from the account's history, turn them off.

## Phase 5 — Content

- [ ] Migrate About/hero copy from the old tx-hunting-tools.com site,
      rewritten to the new structure. *(Note: the build environment's network
      policy blocked fetching the live site, so the theme currently carries
      drafted copy based on the project brief — review against the old site
      and swap in anything the client wants kept verbatim.)*
- [ ] Replace placeholder product photography as real images arrive
      (open question #4).
- [ ] The contact section has a built-in appointment-request form (name,
      phone, service needed, details). Submissions email the address set in
      Customizer → Shop Details. **Test it once after launch**; if the email
      doesn't arrive (shared-host PHP mail often lands in spam), install the
      "WP Mail SMTP" plugin and route through a real mailbox.
- [ ] Add the phone number via Customizer once provided.

## Phase 6 — Compliance & legal

- [ ] Confirm the old Terms of Service carries over / gets updated on the
      new Terms page.
- [ ] FFL Info page (template ships with license number + transfer process).
- [ ] Sweep all copy: nothing may state or imply that suppressors/firearms
      ship direct to a customer. (Theme copy already says "transfer only" in
      the hero, shop note, and FFL page — keep it that way when editing.)

## Phase 7 — Launch

1. Point the domain at the new install (client DNS or HostGator, per access).
2. SSL: issue via HostGator AutoSSL / Let's Encrypt; force HTTPS in WP
   (Settings → General URLs + redirect).
3. Redirect map from old URLs if the structure changed (e.g. in `.htaccess`).
4. **End-to-end checkout test, twice:**
   - a regulated test product → must offer *only* pickup/transfer, no
     shipping options, and charge through Authorize.Net;
   - a non-regulated test product → normal shipping + Authorize.Net charge.
   Refund/void both test orders afterwards.

## Open questions for the client (unresolved)

1. New HostGator install, or reuse the existing Team Backed hosting account?
2. Current Ecwid plan tier (Authorize.Net needs Venture+)?
3. Is the Authorize.Net + FFL-friendly merchant account already set up?
4. Timeline for real product photography?
5. Phone number for the contact section?
6. Regulated-item fulfillment UX: contact form, booking calendar, or
   phone-only CTA on the Ecwid product page?

## Out of scope (this phase)

FFL transfer/distributor inventory integrations (FastBound, FFL Cockpit),
multi-location/POS, email marketing/CRM, and any migration off Ecwid.
