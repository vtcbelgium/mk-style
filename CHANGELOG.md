# Changelog

All notable changes to MK Style (`mkstyle.be`) are documented in this file.

## [0.1.0] - 2026-11-19 — Official Launch (`mkstyle.be`)

### Productielancering (`https://mkstyle.be/`)
- **Hosting & database:** Live gedeployed op **Cloudflare Pages + Pages Functions** met Europese **Cloudflare D1** database (`mk-style-production`, initiële live versie `version: 1`, `site_revisions` actief voor audit- en undo-historie) en afzonderlijke staging-omgeving (`mk-style-staging`).
- **Publieke website & lokale SEO:** Eénpagina-site op maat voor herenkapper & barbier **MK Style CommV.** (Sint-Gertrudisplein 24, 3740 Beverst, Bilzen-Hoeselt — 100% zonder afspraak), met live openingsstatus (`Europe/Brussels`), diensten en prijzen uit D1, klik-om-te-laden OpenStreetMap-kaart (nul externe requests voor bezoekers zonder interactie), volledige `HairSalon` JSON-LD (`hasOfferCatalog`, `amenityFeature`, `publishingPrinciples`), `privacy` pagina, `robots.txt` en `sitemap.xml`.

### Edge-, domein- & mailbeveiliging
- **DNS & redirects:** OVHcloud nameservers gedelegeerd naar Cloudflare (`maya.ns.cloudflare.com`, `peter.ns.cloudflare.com`). Automatische `301`-redirects van `http://mkstyle.be/`, `http://www.mkstyle.be/` en `https://www.mkstyle.be/` naar canonieke apex `https://mkstyle.be/`.
- **TLS & security headers:** TLS via Google Trust Services (`WE1`), **HSTS** (`max-age=31536000; includeSubDomains`), strikte **CSP** (`script-src 'self'`, `font-src 'self'`), zelfgehoste fonts (`immutable`), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), geolocation=()`, `Cross-Origin-Resource-Policy: same-origin` en e-mail anti-spoofing null-sender records (`v=spf1 -all`, `_dmarc` `p=reject`, `default._domainkey` `v=DKIM1; p=`).

### Beheerportaal & beveiliging (`/admin`)
- **Cloudflare Zero Trust Access:** OTP-toegang (`1 month` sessieduur) gekoppeld aan de toegestane beheerders (`ADMIN_EMAILS`, `POLICY_AUD`, `TEAM_DOMAIN` als encrypted Cloudflare secrets). Alle 9 beheerroutes (`/admin`, `/admin/`, `/admin.html`, `/api/admin/*`) zijn fail-closed en geven ongeauthenticeerd een Access-login redirect (`302`).
- **Cache-bescherming:** `Cache-Control: no-store` en `X-Robots-Tag: noindex, nofollow` op beheerpagina's en `Cache-Control: no-store` plus `?v=20261119-ai` cache-busting op `/assets/js/admin-v2.js` zodat beheerders altijd dezelfde HTML en JS-versie ontvangen.

### 3-laags Admin AI-assistent & Social Studio
- **Laag 1 — Lokale Nederlandse parser (`functions/_lib/nl-parser.js`, `0 ms`, `0` AI-quotum):** Deterministische parser voor snelle opdrachten zoals sluitingsdagen (`morgen gesloten`, specifieke datums), verlofperiodes, aangepaste uren, verwijderen van uitzonderingen (`remove_exception`), meldingen en prijswijzigingen.
- **Laag 2 — Cloudflare Workers AI (`env.AI` binding):** Primair via `@cf/mistralai/mistral-small-3.1-24b-instruct` met `@cf/meta/llama-3.1-8b-instruct-fp8` als fallback voor vrije voorstellen (`/api/admin/propose`) en Social Studio (**✨ Verfijn met AI** op `/api/admin/social-draft`), begrensd op max. `25` AI-aanvragen per dag in D1 (`ai_daily_usage`) en gecontroleerd door `validateAiCaption`.
- **Laag 3 — Optionele externe fallback (`functions/_lib/ai-provider.js`):** Uitbreidbare providerlaag met ondersteuning voor Pollinations (via `POLLINATIONS_API_KEY` / `POLLINATIONS_ENABLED=true`) en Gemini fallback indien later geconfigureerd.
- **Mens-in-de-lus UX:** Elke AI-actie maakt eerst een controleerbaar voorstel met leesbare voorstel-diff, engine-badge en inklapbare technische JSON; niets wordt op de live website of sociale media geplaatst zonder expliciete goedkeuring.

### Verificatie voor `v0.1.0`
- **Geautomatiseerde tests & kwaliteitsgates:** `66/66` `node --test` suites geslaagd (`0` fouten), `npm run build` OK, `verify-support-manifest` OK, Lighthouse Mobile & Desktop `100 / 100 / 100 / 100`, en beide SEO People-First Barriers op `dist/` (`PASS`, `0` bevindingen).
- **Live productieverificatie (`https://mkstyle.be/`):** `npm run smoke:production` PASS (read-only), `18/18` publieke assets/interne links `HTTP 200`, alle JSON-LD URLs en `og:image` `HTTP 200`, `9/9` niet-ingelogde adminroutes vergrendeld, en non-destructieve live AI-tests (snelle parser, Workers AI voorstel + Social Studio) geslaagd met `0` consolefouten en live D1 onveranderd op `version: 1`.
- **Monitoring & noodherstel:** OTHRYS T590 5-minuten uptime/health/TLS/admin-lock monitoring actief (`100.0%` uptime) en koude offline backups gearchiveerd (D1 SQL, handleiding-PDF en geverifieerde git-bundles).

### Openstaande post-launch opvolging
- Fysieke smartphone-check (iPhone/Safari 375px & Android/Chrome 360px) en gecontroleerde 4G-test.
- Eerste live beheermutatie + één-klik undo-test uitvoeren samen met Murat en OVHcloud-verlengdatum documenteren zonder inloggegevens te delen.
- Eigenaarsverificatie van Google Bedrijfsprofiel (`ChIJu8aXT6XgwEcRyp23QzZ2j2A`) en Google Search Console voltooien.
- Geplande nazorg op **+48 uur**, **+7 dagen** (klantfeedback) en **+30 dagen** (lokale SEO & resultaten).
