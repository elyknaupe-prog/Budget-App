# Texas Hunting Tools — WordPress + Ecwid Rebuild

Site rebuild for Texas Hunting Tools LLC (07/02 FFL manufacturer, League
City, TX): self-hosted WordPress on HostGator wrapping an embedded Ecwid
storefront with a firearms-compliant checkout flow (Authorize.Net +
FFL-friendly merchant account; regulated items are transfer-only, never
shipped direct).

## Layout

| Path | What it is |
| --- | --- |
| `wp-theme/tx-hunting-tools/` | The custom WordPress theme — upload/activate this on the HostGator install |
| `preview/index.html` | Static preview of the homepage design (open in a browser; no WordPress needed) |
| `docs/SETUP.md` | Full deployment runbook: HostGator, WordPress, Ecwid, Authorize.Net, compliance, launch |

## Theme at a glance

- 7-section one-page layout: sticky nav / hero with etched info plate /
  capabilities nameplate grid / shop (Ecwid embed) / custom-work process
  strip / contact + map / footer.
- Design tokens: gunmetal `#15171A`, panel `#1F2225`, brass `#C9A876`,
  rust `#B54A2C`; Oswald / Inter / JetBrains Mono via Google Fonts.
- Responsive at 860px / 760px; honors `prefers-reduced-motion`.
- Ecwid renders through the official plugin's shortcode with a graceful
  placeholder until the plugin is connected; `assets/css/ecwid-skin.css`
  re-skins the storefront best-effort.
- Shop facts (FFL #, address, email, phone, season line) are Customizer
  settings — no code edits for copy changes.
- Dedicated `page-ffl-info.php` template (slug `ffl-info`) with the license
  plate and transfer-process explanation.
- **No WooCommerce, no Shopify, no Stripe/PayPal/Square** — see
  `docs/SETUP.md` for the compliance rationale and manual steps.
