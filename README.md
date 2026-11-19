# MK Style — Herenkapper en barbier Beverst

## Centrale klantgegevens
**[config/client-profile.json](config/client-profile.json)** is de centrale projectfiche voor MK Style: bedrijfsidentiteit, btw-nummer, zakelijke contactgegevens, bevestigde openingsuren en prijzen, domeinstatus, website-links en nog te bevestigen zaken. Het is een **publiek leesbaar bestand**, want deze repository is Public. De productie-websitebuild neemt dit bestand niet mee. Deel nooit wachtwoorden, sleutels, privégesprekken of persoonlijke gegevens in Git.

## Status — v0.1.0 Live (`https://mkstyle.be/`)
De productiewebsite voor **MK Style** staat sinds **19 november 2026 (`v0.1.0`)** officieel live op **https://mkstyle.be/** via **Cloudflare Pages + Pages Functions + Europese Cloudflare D1**.  
Lees het volledige release-overzicht in [CHANGELOG.md](CHANGELOG.md) en het testprotocol in [docs/RELEASE_TEST_MATRIX.md](docs/RELEASE_TEST_MATRIX.md).

- **Domein & Edge:** `mkstyle.be` draait achter Cloudflare DNS (`maya.ns.cloudflare.com`, `peter.ns.cloudflare.com`) met `301`-redirects vanaf `www.mkstyle.be` en `http://`, TLS (Google Trust Services), HSTS (`max-age=31536000; includeSubDomains`), strikte CSP, zelfgehoste fonts en null-sender `SPF`/`DMARC`/`DKIM` anti-spoofing records.
- **Beheer & Beveiliging:** `https://mkstyle.be/admin` en alle `/api/admin/*` routes zijn server-side en via **Cloudflare Zero Trust Access** fail-closed vergrendeld; publieke routes hebben `0` third-party tracking of externe Google Fonts.
- **Monitoring & Backups:** 5-minuten read-only uptime-, health-, redirect-, HSTS-, admin-lock- en TLS-controle actief via OTHRYS (`vtcbelgium/OTHRYS`), zonder synthetische vervuiling en met koude D1/Git-backups.

## Website
- One-pager voor herenkapper & barbier **MK Style CommV.** op Sint-Gertrudisplein 24, 3740 Beverst (Bilzen-Hoeselt) — 100% zonder afspraak.
- Live openingsstatus (`Europe/Brussels`), diensten en prijzen uit **Cloudflare D1** (`mk-style-production`), klik-om-te-laden OpenStreetMap-kaart, volledige `HairSalon` JSON-LD en privacyverklaring op [`/privacy`](https://mkstyle.be/privacy).
- De inhoud, tarieven, bedrijfsgegevens en fotorechten zijn door eigenaar Murat bevestigd (`config/client-profile.json`); Google Bedrijfsprofiel- en Search Console-eigenaarsverificatie lopen als post-launch opvolging.

## Productiearchitectuur (`v0.1.0`)
- **Cloudflare Pages** (buildoutput `dist/` zonder docs, secrets of migrations) met Pages Functions in `functions/`.
- **Cloudflare D1 (EU):** gescheiden databases `mk-style-staging` en `mk-style-production` voor versiegestuurde configuratie (`version`), revisiehistorie (`site_revisions`) en dagelijks AI-quotum (`ai_daily_usage`).
- **Cloudflare Access JWT + server-side allowlist:** (`TEAM_DOMAIN`, `POLICY_AUD`, `ADMIN_EMAILS` uitsluitend als encrypted Cloudflare secrets).
- **3-laags Admin AI-assistent:**
  1. Lokale deterministische Nederlandse parser (`functions/_lib/nl-parser.js`, `0 ms`, `0` AI-quotum) voor duidelijke sluitingsdagen, verlofperiodes, uren, meldingen en prijzen.
  2. Native **Cloudflare Workers AI** (`env.AI`: `@cf/mistralai/mistral-small-3.1-24b-instruct` met `@cf/meta/llama-3.1-8b-instruct-fp8` fallback) met server-side validatie, daglimiet (`25/dag`) en verplichte eigenaarsgoedkeuring vóór publicatie.
  3. Optionele externe providerondersteuning (`functions/_lib/ai-provider.js` voor Pollinations/Gemini indien geconfigureerd) en Social Studio conceptgenerator (**✨ Verfijn met AI**, altijd alleen concept — nooit automatische publicatie).
- Manuele uren, uitzonderingen, verlofperiodes, prijzen en één-klik **undo** blijven altijd zonder AI beschikbaar.

## Lokaal ontwikkelen & testen
```bash
npm install
npm test
npm run build
node scripts/verify-support-manifest.mjs
npm run smoke:production   # read-only productiecheck op https://mkstyle.be/
```

`npm run build` bouwt de statische bestanden naar `dist/` zonder documentatie of secrets. Productie-deploy gebeurt met `wrangler pages deploy dist --project-name mk-style --branch main`.

## Opvolging
Centrale werkplanning en het overzicht van 42 issues: [MK Style master issue #43](https://github.com/vtcbelgium/mk-style/issues/43).

## Belangrijk voor overdracht
Domein, bedrijfsaccounts, facturatie en toestemming blijven bij Murat; geen wachtwoorden of API-sleutels delen via WhatsApp of issues. Security, wettelijke teksten, echte toesteltesten, staging en acceptatie blokkeren livegang.
