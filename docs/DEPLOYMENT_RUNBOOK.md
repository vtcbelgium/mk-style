## Cloudflare staging gerealiseerd — 18 november 2026
- Cloudflare Pages-project: `mk-style` op OTHRYS-account; productiebranch `main`, **geen productie-deployment**.
- Preview: `https://feat-production-readiness-20.mk-style.pages.dev` — met tijdelijke Basic Auth beschermd via `functions/_middleware.js` en uitsluitend Cloudflare previewsecret `STAGING_ACCESS_PASSWORD` (niet in git).
- D1: afzonderlijke EU-databases `mk-style-staging` (schema+seed geactiveerd) en `mk-style-production` (nog leeg en niet verbonden aan openbare website). `wrangler.jsonc` bevat uitsluitend resource-ID's, geen secrets.
- Read-only API `/api/config` is online in de preview en leest versie 1 uit D1; alle pagina's/scripts/admin/API blokken zonder previewlogin met 401.
- Gebruikerslogin voor Murat (Cloudflare Access), eventuele AI-providersecret en de echte DNS-koppeling zijn **NIET** geconfigureerd. Admin API blijft server-side fail-closed.
- Lokale regressietests: 12/12; preview smoke-tests voor homepage, admin, JS en API: ongeautoriseerd 401, geautoriseerd 200; noindex.
- Het domein `mk38style.be` is nog niet verbonden. Murat hoeft nog geen NS aan te passen; Cloudflare-zone moet eerst toegevoegd en gecontroleerd worden. Eigenaar houdt OVHcloud-account.
- Geen deploy/merge naar `main` of livegang voordat foto-/inhoudsrechten, Access-beveiliging, rollback, privacy, end-to-end testen en Murat's eindakkoord aanwezig zijn.

# MK Style — Cloudflare Pages + D1 + Access (staging-first)

**Status: voorbereiding, NIET live.** Branch `feat/production-readiness-2026-11` is een staging-kandidaat. Geen automatische productie-deploy, geen externe wijzigingen zonder eigenaarsgoedkeuring. De oude GitHub Pages demo is niet de productiehosting voor de commerciële zaak.

## Infrastructuur (na akkoord #4, #5, #31)
1. Bevestig domeinregistratie bij Murat, en dat hij eigenaar blijft van registrar en facturatie.
2. Kies beheermodel voor Cloudflare met Murat als eigenaar/appropriate access en ontwikkelaar met beperkt recht.
3. Maak een Cloudflare Pages project met **GitHub integration** vanuit `vtcbelgium/mk-style`, productietak pas na review `main`.
4. **Build command:** `npm run build`. **Build output:** `dist`. **Root:** repository root. Pages Functions in `functions/` worden apart gebundeld.
5. Maak een **staging en productie** D1-database met logische namen. Bind elke Pages environment apart onder exact de naam **`DB`**. Noteer DB IDs buiten publieke issues.
6. Maak lokaal `migrations/0002_seed.sql` met `npm run seed:sql` nadat Murat `data/site-config.json` heeft goedgekeurd. Bekijk de gegenereerde SQL voordat je ze toepast. Geen seed blind in productie.
7. Voer `migrations/0001_schema.sql` en daarna `migrations/0002_seed.sql` uit op STAGING. Voorbeeld: `npx wrangler d1 execute <STAGING_DB_NAME> --remote --file=migrations/0001_schema.sql`; idem voor seed.
8. Maak Cloudflare Zero Trust Access-app(s) op **/admin.html** en **/api/admin/**, voor preview- én productiedomeinen. Restrict email identities; stel team Domain, AUD en admin e-mailadressen in. Configureer het **API** Access-application AUD in `POLICY_AUD`. Als de UI een afzonderlijke Access-app gebruikt, kan die een ander AUD hebben: de server valideert expliciet het AUD van de API-app. Controleer dat de API ook op previewdomeinen beschermd is.
9. Pages variabelen/secrets in Cloudflare environment (nooit in Git): `TEAM_DOMAIN=https://<team>.cloudflareaccess.com`, `POLICY_AUD=<application-aud>`, `ADMIN_EMAILS=<murat-email>[,<developer-email>]`, `GEMINI_API_KEY=<secret>` (optioneel), `GEMINI_MODEL=gemini-2.5-flash` (optioneel). **Geen secrets in client of screenshot.**
10. Test op staging: zonder token 401, niet-toegelaten gebruiker 403, verkeerde Origin 403, configuratie lezen, gewijzigde versie 409, geldige PATCH + database-audit, AI-preview zonder write, handmatig beheer bij AI-uitval, cross-device actualisering, terugrol/back-up.
11. Configureer domain + SSL via OVHcloud DNS en Cloudflare volgens huidige Cloudflare Pages instructies. Een gevalideerd root en `www` adres, redirect naar gekozen canonical, en hercontrole van OG URL, sitemap, JSON-LD.
12. Activeer productie pas na formeel akkoord, tests en herstelprocedure. Behoud de GitHub Pages demo niet als commerciële productiehost.

## Belangrijke beperkingen / release blockers
- `data/site-config.json` is de **oude mockupconfiguratie**; prijzen/uren/claims moeten door Murat worden nagekeken.
- `/api/admin/*` accepteert uitsluitend geldig ondertekend Cloudflare Access JWT met correcte aud/issuer EN e-mailallowlist.
- De OpenAI/Google API-sleutels horen niet in browsercode, GitHub of WhatsApp.
- Server biedt AI **voorstellen**; alle writes gebeuren via aparte bevestigde PATCH.
- Huidige code bewaart alleen auditgeschiedenis; een gebruiksvriendelijke server-side rollbackfunctie en hersteltest zijn nog niet afgerond (#21, #38).
- Rate limit AI: maximaal 10 voorstellen per toegelaten e-mailadres per Belgische dag; providerbudget en Cloudflare quota apart bewaken.
- Cloudflare D1 **gratis limieten kunnen writes blokkeren**; monitoring en fouten afhandelen. Niet als onbeperkte opslag beschouwen.
- Een lange periode verlof vraagt handmatig meerdere uitzonderingsdagen tot de AI-periodefunctie volledig getest is.
- **Niet als gereed markeren:** geen echte Cloudflare deployment / integratietest uitgevoerd bij deze voorbereidings-PR.

## Acceptatietests
- [ ] `npm test` en CI groen
- [ ] Validatie op D1 staging en productieplan
- [ ] Alleen juiste accounts kunnen admin/API bereiken
- [ ] Niet-geautoriseerde requests werken ook niet direct op het API-endpoint
- [ ] Test vandaag/morgen/dst en éénmalige woensdagwijziging
- [ ] Cross-browser en cross-device zien dezelfde status
- [ ] Staging performance, SEO, accessibility en GDPR/ondernemingsinfo
- [ ] Privacy/AI provider data-afspraken en supportafspraken
- [ ] Backup/restore en rollback aantoonbaar uitgevoerd
- [ ] Aftekenen door Murat / ontwikkelaar, daarna pas DNS/launch

## Referenties
- https://developers.cloudflare.com/pages/configuration/git-integration/
- https://developers.cloudflare.com/pages/functions/bindings/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- https://developers.cloudflare.com/d1/reference/faq/
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits
- https://economie.fgov.be/nl/e-commerce/opzet-van-je/verplicht-te-vermelden
