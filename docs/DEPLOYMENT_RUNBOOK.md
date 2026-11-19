## SEO, Google Business en Social Studio — 19 november 2026
- ✅ Openbare bestaande MK Style Google Maps-vermelding op **Sint-Gertrudisplein 24, Beverst**, Place ID `ChIJu8aXT6XgwEcRyp23QzZ2j2A`, in publieke bronnen gevonden. Google Maps-links op de website verwijzen nu specifiek naar die bestaande vermelding en de beoordelingen. **Beheer-/eigenaarschap nog niet geverifieerd**; geen tweede listing aanmaken.
- ✅ LocalBusiness JSON-LD bevat nu geverifieerde juridische bedrijfsidentiteit uit de eigenaardata, `hasMap` en gekoppelde `WebSite` node. Overbodige `meta keywords` en niet meer als Google-rich-result ondersteunde FAQPage markup verwijderd (zichtbare FAQ blijft). Geen fictieve review-/ratingdata toegevoegd.
- ✅ Robots blokkeert `/admin`, `/admin.html` en `/api/admin/`; sitemap bijgewerkt bij echte contentwijziging op 19/11. Canonical target `https://mk38style.be/` blijft bedoeld voor productie. Preview blijft `noindex`.
- ✅ **MK Style Social Studio** opgebouwd: in `admin.html` Instagram-, Facebook- en Google Bedrijfsprofiel-concepten voor walk-in, diensten met actuele D1-prijs, adres, echte uitzonderlijke uren. Serverendpoint `POST /api/admin/social-draft` is Access/JWT- en Origin-beveiligd, retourneert alleen concepttekst; **geen enkele externe publicatieactie**.
- ✅ Optionele Gemini-herformulering voorbereid: zonder `GEMINI_API_KEY` weigert die correct, gratis feitelijk sjabloon blijft beschikbaar na werkende Access-login. AI gebruikt gedeeld budget van max. tien voorstellen per beheerder per Belgische dag en verwerpt duidelijke onbevestigde kortingen, prijzen en externe links. **Echte providerverbinding is nog niet getest/geactiveerd.**
- ✅ **59/59 lokale tests** succesvol en read-only staging smoke succesvol na Cloudflare deployment `ef4abb33.mk-style.pages.dev`, inclusief publiek/SEO 200, health 200, onbekende 404 en onbevoegde Social Studio 503.
- ✅ Centrale `config/client-profile.json` bevat eerlijke status van Google Business, Windsor.ai en Meta: **niet gekoppeld**. Reeds geïnstalleerde Windsor.ai heeft in dit account op dit moment alleen OTHRYS-eigen Search Console/GA4-bronnen; MK Style GBP, Instagram en Facebook nog niet.
- 📖 Volledig prioriteitenplan: `docs/MK_STYLE_GROWTH_PLAYBOOK.md`. Streef naar sterke lokale SEO met profielkwaliteit, echte foto's/reviews, eigen diensten en bewijs, niet met doorway-pagina's of reviewspamming.
- ⛔ Productie vrijgave blijft geblokkeerd door pending nameservers `mk38style.be`, Access, AI-providerkeuze, echte D1 hersteltest, toestemming voor foto's, juridische check en expliciete eigenaar-goedkeuring voor externe accountkoppelingen/mutaties.

## Nieuwe functies — 19 november 2026 (beheerhistoriek en privacykaart)
- ✅ OpenStreetMap wordt **pas na expliciete klik op ‘Toon kaart’** geladen; een bezoeker die de pagina alleen bekijkt, veroorzaakt geen OpenStreetMap-iframeverzoek. De routeknoppen en het adres blijven zichtbaar. Geen wijzigingen aan Google Fonts; beoordeling van die externe fontverzoeken blijft een privacycheck.
- ✅ Beveiligde owner-admin toont de **laatste tien wijzigingen** uit `GET /api/admin/history`: versienummer, bron, e-mail van uitvoerder en lokaal weergegeven tijdstip. De UI gebruikt uitsluitend DOM `textContent`; kwaadwillige actor-tekst wordt niet als HTML verwerkt.
- ✅ Geschiedenis wordt na herladen, bevestigde publicatie en herstel opnieuw opgehaald. De Access JWT op de API blijft vereist; de dev-preview toont geen privégeschiedenis zonder de correcte login.
- ✅ In-memory D1-integratietest controleert ook de geschiedenis na PATCH en undo, zonder `before_json`/`after_json` naar de browser te sturen.
- ✅ **48/48 lokale tests geslaagd**, GitHub quality gate controleert de ontwikkelbranch; nieuw Cloudflare staging-deployment `bc2e2314.mk-style.pages.dev` geslaagd.
- ✅ Live read-only staging-smoketest controleerde HTTP 200 voor pagina, dev admin, JS, D1-config en health; 404 voor onbekende URL, 503 voor onbevoegde beheerders (verwacht zolang Access ontbreekt).
- ⛔ Nog niet productie-live; `mk38style.be` blijft Pending, geen OVHcloud-omschakeling; echte Cloudflare Access-login, hersteltest en foto-/privacygoedkeuring open.

## Verdere productieversteviging — 19 november 2026
- ✅ Cloudflare Pages kan `/admin.html` als **`/admin`** serveren of ernaartoe redirecten; `functions/_middleware.js` blokkeert nu op custom domains **`/admin.html`, `/admin` en `/admin/`** zolang geldige Cloudflare Access-claims ontbreken. De `/api/admin/*` routes controleren hun JWT zelf.
- ✅ Productie-smoketest verifieert vanaf nu beide beheer-URL's, ook zonder extensie. Cloudflare Access-opzet beschreven in `docs/CLOUDFLARE_ACCESS_SETUP.md`: **één toepassing en dezelfde AUD** voor adminpagina-aliassen en API. Externe login van Murat en runtime **Fail closed** nog configureren.
- ✅ Extra `Content-Security-Policy` beperkt browserbronnen tot eigen scripts, noodzakelijke Google Fonts en OpenStreetMap-frame; de privacy-impact van externe font-/kaartverzoeken staat in `docs/LEGAL_AND_PRIVACY_DRAFT.md`. Live CSP-header is niet afzonderlijk via een toegestane headerinspectie geverifieerd.
- ✅ Gebrande `404.html` toegevoegd. Externe Cloudflare-smoketest na staging-deployment **`54e62a6d`** bevestigt HTTP 404 voor onbekende URL's, 200 voor homepage, admin preview, JS, D1-config en health, en 503 voor admin API zonder Access.
- ✅ **43/43 lokale tests groen** en GitHub kwaliteitscontrole voor de laatste codewijziging geslaagd, inclusief echte ondertekende test-JWT en onjuiste audience/e-mail.
- ⛔ Geen publieke productie-uitrol, geen verandering van OVHcloud, geen echte Access-policy/login of complete D1-restore. Cloudflare-zone `mk38style.be` blijft Pending tot DNS-delegatie.

## Monitoring en release-controles — 19 november 2026
- ✅ `/api/health` toegevoegd: **GET** doet een read-only controle op D1 `site_config`. Antwoord `200 {"status":"ok"}` of `503 {"status":"unavailable"}`, zonder bedrijfsgegevens, database-ID's of secrets terug te geven. `Cache-Control: no-store`, `X-Robots-Tag: noindex`.
- ✅ Staging-deployment `f14c1b69.mk-style.pages.dev` geslaagd. Externe read-only smoketest bevestigt homepage, `admin.html`, main.js, `/api/config`, `/api/health` HTTP 200 en onbevoegde beheer-API's HTTP 503 (verwacht zolang Access niet is ingesteld).
- ✅ 37/37 unit-/integratietests geslaagd, inclusief D1 gezondheidscontrole en fail-closed gedrag.
- ✅ `npm run smoke:staging` test site, database en gescheiden beheerrechten; onderdeel van de handmatige staging-deployworkflow.
- ✅ `npm run smoke:production` **voorbereid, nog NIET uitgevoerd**. Vereist na livegang: geldig HTTPS, de juiste bedrijfsgegevens, D1-read, health, sitemap, robots, `www`-redirect naar canonical apex en werkende admin-auth. **503 door ontbrekende Access blokkeert de go-live check**.
- ⛔ DNS-zone `mk38style.be` blijft Pending tot OVHcloud-nameservers gewijzigd worden; productie niet live, geen merge naar `main`.
- ⛔ Echte Cloudflare Access-login, AI-secret/budget en bewaartermijnen, restore-test en finale fotorechten/privacy blijven open. Aegis vroeg goedkeuring voor de lokale backupmap, maar eigenaar zag geen aanvraag; beperkingen niet omzeild.

## Staging-verificatie en back-upblokkade — 19 november 2026
- ✅ Na de bestaande preview-deployment is een externe **read-only smoke-test** uitgevoerd op `https://feat-production-readiness-20.mk-style.pages.dev/`: homepage, admin.html, main.js en `/api/config` antwoorden **HTTP 200**, terwijl `/api/admin/config` en `/api/admin/history` **HTTP 503** antwoorden wegens ontbrekende Cloudflare Access-configuratie. Dit is verwacht fail-closed gedrag; geen klantdata gewijzigd.
- ✅ `scripts/smoke-staging.mjs` toegevoegd en opgenomen als post-deploy stap in `.github/workflows/staging-deploy.yml` (zodra CI-secrets zijn ingericht).
- ✅ CI kwaliteitscontrole controleert nu ook `npm audit --omit=dev --audit-level=high`. Lokale audit toont **0 bekende advisories** voor runtime-dependencies; GitHub quality gate geslaagd.
- ⛔ Bij het aanmaken van `.wrangler/backups` op VTC-t590 vraagt Aegis aparte eigenaarstoestemming. De gebruiker ziet deze aanvraag niet in het Tekton-scherm. **Geen backup-export/restore uitgevoerd** en geen alternatieve locatie gebruikt om die beperking te omzeilen. Back-upstap blijft open; Cloudflare D1 Time Travel bookmark is wel read-only gecontroleerd.
- ⛔ Het project is **nog niet productie-live**: echte Cloudflare Access-login, hersteltest, fotorechten/privacy, DNS-overdracht en eindacceptatie blijven open.

## Huidige productievoorbereiding — 19 november 2026 (laatste verificatie)
- ✅ **Cloudflare DNS-zone** `mk38style.be` bestaat bij OTHRYS; status **Pending** totdat de autoritatieve nameservers bij OVHcloud effectief naar `maya.ns.cloudflare.com` en `peter.ns.cloudflare.com` gaan. Pages Custom Domains weigert apex-koppeling tot Cloudflare DNS actief is.
- ✅ **EU D1-productiedatabase** `mk-style-production`: migratie `0001_schema.sql` uitgevoerd en seed met Murats bevestigde basisgegevens toegepast. Read-only SQL verifieerde `site_config` versie 1, `MK Style`, e-mailadres en **6 diensten**. Staging heeft een afzonderlijke database.
- ✅ Extra in-memory D1-integratietest met werkelijk ondertekende test-JWT: beheerlogin, PATCH van een sluitingsdag, publieke read, versieconflict 409 en herstelactie succesvol. Geen wijzigingen in de echte databases tijdens deze test. Cloudflare Access op productie is nog niet geconfigureerd.
- ✅ **Time Travel** op productiedatabase geeft een actuele herstelbookmark terug (Cloudflare voorziet herstelgeschiedenis). Dit is **geen uitgevoerde back-up-/restoretest**.
- ✅ Code: zichtbaar bedrijfsvermelding in de footer, incl. MK Style CommV., ondernemingsnummer, btw en zakelijk e-mailadres. LocalBusiness JSON-LD bevat nu de zakelijke e-mail; niet-bevestigde betaalmethoden zijn uit JSON-LD gehaald.
- ✅ **35/35 lokale tests** en GitHub quality gate geslaagd; toegevoegde tests blokkeren alle vijf admin API-handlers zonder Cloudflare Access, bevestigen database-isolatie en juridische contactvermeldingen.
- ✅ Laatste succesvolle preview-deployment `7c5a7db8.mk-style.pages.dev` en branch-alias `feat-production-readiness-20.mk-style.pages.dev`. Website blijft via de preview bereikbaar, **niet op klantdomein**.
- ⛔ De **productie-website is nog niet gepubliceerd**. Productiebranch `main` heeft nog geen goedgekeurde build. Geen DNS-wijzigingen bij Murat aangevraagd. Cloudflare Access-login, end-to-end admin-wijziging+undo, hersteltest, fotorechten, privacy-eindcontrole, canonical redirect en domein-SSL blijven release-gates.
- 📚 FOD Economie vereist makkelijk toegankelijke bedrijfsidentificatie op zakelijke websites; zie https://economie.fgov.be/nl/themas/online/elektronische-handel/verkoop-internet/bedrijfswebsite-en-accounts-op.

## Huidige stand — 19 november 2026
- ✅ Op expliciet verzoek is de tijdelijke Basic Auth-vraag voor de **ontwikkelpreview verwijderd**. Geen extra wachtwoord nodig om publieke previewpagina's, assets en lees-API te bezoeken. De ontwikkelpreview is daarmee publiek toegankelijk via de link, met `noindex, nofollow, noarchive`.
- ✅ Beheeracties zijn **niet** publiek vrijgegeven: `/api/admin/*` blijft op serverniveau alleen toegankelijk na Cloudflare Access JWT en e-mailallowlist. Zonder ingestelde Access blijft het endpoint fail-closed.
- ✅ Cloudflare Pages-preview opnieuw gedeployed naar `https://feat-production-readiness-20.mk-style.pages.dev`, deployment `9a9295ee`, 20/20 lokale tests groen. Externe anonieme HTTP-controle nog niet onafhankelijk bevestigd.
- ⚠️ Het oude `STAGING_ACCESS_PASSWORD`-secret is niet meer functioneel nodig; geen rotatie vereist voor dit ontwikkelwachtwoord. Kan bij accountonderhoud verwijderd worden.
- ⛔ Cloudflare-zone `mk38style.be` opnieuw aangevraagd via de T590, maar API gaf `403 com.cloudflare.api.account.zone.create`. Wrangler OAuth mist zone-create. Eenmalig via [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Add a domain/site** → `mk38style.be` → passend plan toevoegen; hierna kunnen wij de toegewezen nameservers uitlezen en de rest voorbereiden. OVHcloud nog niet wijzigen.
- ⛔ Productie blijft geblokkeerd tot DNS, Access, tests, fotorechten, juridische goedkeuring en herstelprocedure rond zijn.

## Uitvoering na validatie — 18 november 2026
- ✅ **Nieuwste staging-deployment:** `https://feat-production-readiness-20.mk-style.pages.dev`, Cloudflare deployment `d022ede4`. De build en Pages Functions bundeling zijn gelukt.
- ✅ **22 lokale tests en GitHub quality gate geslaagd**, inclusief komende sluitingsdagen, DST, verlofperiode 1–31 dagen en preview-security.
- ✅ Handmatige verlofperiode en AI-voorstel voor expliciet gedateerd verlof toegevoegd; iedere wijziging vereist een bevestiging en servervalidatie.
- ✅ Een `package-lock.json` is vastgelegd; CI gebruikt nu `npm ci` en bundelt Pages Functions.
- ⚠️ Dit Pages-project is **Direct Upload**, geen ingebouwde Git-integratie. Cloudflare kan een bestaand Direct Upload-project niet achteraf aan Git koppelen. Hiervoor is `.github/workflows/staging-deploy.yml` voorbereid, maar nog **niet actief**: GitHub environment `mk-style-staging` moet beperkte Cloudflare Pages Edit-token en account-ID als secrets krijgen. Workflow mag uitsluitend naar stagingbranch deployen.
- ℹ️ Oude dev-Basic-Auth is verwijderd op 19 november. Het oude secret wordt niet meer gebruikt. Voor werkelijke beheertoegang blijft Cloudflare Access vereist.
- ⚠️ De nieuwste deployment is bevestigd door Wrangler; een **nieuwe anonieme HTTP-smoketest** werd door Aegis geblokkeerd en is nog niet bevestigd. Oudere preview is wel getest: 401 zonder login, 200 met login, D1-configversie 1.
- ⛔ D1-back-upmap aanmaken werd door Aegis terecht geblokkeerd in afwachting van eigenaarstoestemming; geen export of hersteltest claimen.
- ⛔ **Nog niet productieklaar:** Cloudflare Access login+AUD/e-mailallowlist, Gemini-secret/budget, D1-backup+restore, cross-device wijzigingstest, foto's/content akkoord, wettelijke eindcontrole, publieke DNS en Murats aftekening.

## Cloudflare staging gerealiseerd — 18 november 2026
- Cloudflare Pages-project: `mk-style` op OTHRYS-account; productiebranch `main`, **geen productie-deployment**.
- Preview: `https://feat-production-readiness-20.mk-style.pages.dev` — vanaf 19/11 vrij toegankelijk voor ontwikkelcontrole (noindex), zonder extra Basic Auth. Beheer-API blijft met Cloudflare Access afgeschermd.
- D1: afzonderlijke EU-databases `mk-style-staging` (schema+seed geactiveerd) en `mk-style-production` (nog leeg en niet verbonden aan openbare website). `wrangler.jsonc` bevat uitsluitend resource-ID's, geen secrets.
- Read-only API `/api/config` is online in de preview en leest versie 1 uit D1; websitepagina's/assets en publieke read-API werken nu zonder extra previewlogin; dit is een bewuste wijziging van 19/11. Admin API blijft fail-closed.
- Gebruikerslogin voor Murat (Cloudflare Access), eventuele AI-providersecret en de echte DNS-koppeling zijn **NIET** geconfigureerd. Admin API blijft server-side fail-closed.
- Lokale regressietests: 12/12; preview smoke-tests voor homepage, admin, JS en API: ongeautoriseerd 401, geautoriseerd 200; noindex.
- Het domein `mk38style.be` is nog niet verbonden. Murat hoeft nog geen NS aan te passen; Cloudflare-zone moet eerst toegevoegd en gecontroleerd worden. Eigenaar houdt OVHcloud-account.
- Geen deploy/merge naar `main` of livegang voordat foto-/inhoudsrechten, Access-beveiliging, rollback, privacy, end-to-end testen en Murat's eindakkoord aanwezig zijn.

# MK Style — Cloudflare Pages + D1 + Access (staging-first)

**Status: voorbereiding, NIET live.** Branch `feat/production-readiness-2026-11` is een staging-kandidaat. Geen automatische productie-deploy, geen externe wijzigingen zonder eigenaarsgoedkeuring. De oude GitHub Pages demo is niet de productiehosting voor de commerciële zaak.

## Infrastructuur (na akkoord #4, #5, #31)
1. Bevestig domeinregistratie bij Murat, en dat hij eigenaar blijft van registrar en facturatie.
2. **Gekozen beheermodel:** Murat bezit OVHcloud-domein en bedrijfsassets; OTHRYS host en beheert het Cloudflare Pages-project onder het eigen account, met expliciete support/overdrachtsafspraken.
3. Cloudflare Pages-project **`mk-style` bestaat al als Direct Upload**. Voor nieuwe commits gebruiken we de handmatige of later geautoriseerde GitHub Actions staging-deploy; ingebouwde Git-integratie is achteraf niet mogelijk voor dit project. Productietak `main` blijft geblokkeerd tot na review.
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
