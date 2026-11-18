## Cloudflare staging gerealiseerd — 18 november 2026
- Cloudflare Pages-project: `mk-style` op OTHRYS-account; productiebranch `main`, **geen productie-deployment**.
- Preview: `https://feat-production-readiness-20.mk-style.pages.dev` — met tijdelijke Basic Auth beschermd via `functions/_middleware.js` en uitsluitend Cloudflare previewsecret `STAGING_ACCESS_PASSWORD` (niet in git).
- D1: afzonderlijke EU-databases `mk-style-staging` (schema+seed geactiveerd) en `mk-style-production` (nog leeg en niet verbonden aan openbare website). `wrangler.jsonc` bevat uitsluitend resource-ID's, geen secrets.
- Read-only API `/api/config` is online in de preview en leest versie 1 uit D1; alle pagina's/scripts/admin/API blokken zonder previewlogin met 401.
- Gebruikerslogin voor Murat (Cloudflare Access), eventuele AI-providersecret en de echte DNS-koppeling zijn **NIET** geconfigureerd. Admin API blijft server-side fail-closed.
- Lokale regressietests: 12/12; preview smoke-tests voor homepage, admin, JS en API: ongeautoriseerd 401, geautoriseerd 200; noindex.
- Het domein `mk38style.be` is nog niet verbonden. Murat hoeft nog geen NS aan te passen; Cloudflare-zone moet eerst toegevoegd en gecontroleerd worden. Eigenaar houdt OVHcloud-account.
- Geen deploy/merge naar `main` of livegang voordat foto-/inhoudsrechten, Access-beveiliging, rollback, privacy, end-to-end testen en Murat's eindakkoord aanwezig zijn.

# MK Style — Herenkapper en barbier Beverst

## Centrale klantgegevens
**[config/client-profile.json](config/client-profile.json)** is de centrale projectfiche voor MK Style: bedrijfsidentiteit, btw-nummer, zakelijke contactgegevens, bevestigde openingsuren en prijzen, domeinstatus, website-links en nog te bevestigen zaken. Het is een **publiek leesbaar bestand**, want deze repository is Public. De productie-websitebuild neemt dit bestand niet mee. Deel nooit wachtwoorden, sleutels, privégesprekken of persoonlijke gegevens in Git.

## Status
De publieke website op `main` is **een demo**, géén productieklaar beheersysteem. Het bestaande `admin.html` gebruikt een **publieke demo-PIN** en `localStorage`; wijzigingen zijn niet gedeeld met bezoekers op andere toestellen. Gebruik demo-PIN of browser-Gemini-sleutels nooit in productie.

De voorbereidingen voor productie staan in de branch `feat/production-readiness-2026-11`. **Deze branch is niet geïmplementeerd op Cloudflare en niet volledig getest.** Zie [installatie- en verificatiehandleiding](docs/DEPLOYMENT_RUNBOOK.md) en [klantgegevens die eerst geverifieerd moeten worden](docs/MURAT_INTAKE.md).

## Website
- Bestaande one-pager met contact, foto’s, diensten, tarieven, live-openingsstatus en lokale SEO.
- Tijdelijke GitHub Pages preview: https://vtcbelgium.github.io/mk-style/
- Beoogd klantdomein: `mk38style.be`; domeinregistratie moet Murat bevestigen.
- Bedrijfsgegevens, tarieven en foto-/merkrechten zijn **voorlopig** totdat de eigenaar ze heeft geverifieerd.

## Productieontwerp (branch)
- Cloudflare Pages voor commerciële hosting (GitHub-integratie).
- Cloudflare Workers/Pages Functions als beveiligde API.
- Cloudflare D1 voor centrale, versiegestuurde configuratie en auditgeschiedenis.
- Cloudflare Access JWT + server-side emailallowlist voor alle beheer-API's; geen publiek client-side PIN.
- Gemini AI optioneel **server-side**, voor een gestructureerd voorstel. Murat moet zelf op **Bevestigen** klikken, waarna de server valideert en schrijft.
- In de beheerinterface zijn ook handmatige instellingen en undo van de vorige wijziging aanwezig.
- Social-media teksten worden enkel als **concept** gemaakt; automatisch posten is niet geactiveerd.

## Lokaal voorbereiden (geen productie)
```bash
npm install
npm test
npm run build
npm run seed:sql # pas NA goedkeuring van de business data; SQL review voor D1 apply
```

`npm run build` maakt een `dist/` voor statische Cloudflare Pages assets; API-functions blijven in de bronmap `functions/`. Een D1 binding `DB`, Access env, en eventueel AI-secret zijn vereist voor de backend. De stagingtests worden uitgevoerd alvorens productie in te schakelen.

## Opvolging
Centrale werkplanning en het overzicht van 42 issues: [MK Style master issue #43](https://github.com/vtcbelgium/mk-style/issues/43).

## Belangrijk voor overdracht
Domein, bedrijfsaccounts, facturatie en toestemming blijven bij Murat; geen wachtwoorden of API-sleutels delen via WhatsApp of issues. Security, wettelijke teksten, echte toesteltesten, staging en acceptatie blokkeren livegang.
