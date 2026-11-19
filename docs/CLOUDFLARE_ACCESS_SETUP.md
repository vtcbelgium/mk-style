# MK Style — Cloudflare Access (eigenaar & OTHRYS)

**Status 19 november 2026:** plan klaar; **NIET ingeschakeld**. `mk38style.be` staat nog Pending bij Cloudflare. Geen login of toegang voor Murat beloven zolang het domein, de applicatie en live testen niet gereed zijn.

## Doel
Murat logt later op zijn eigen telefoon in met `38mkstyle@gmail.com` via een e-mailcode, zonder technisch Cloudflare-account of toegang tot de OTHRYS-hosting. Alleen goedgekeurde beheerders kunnen de website aanpassen. Publieke bezoekers lezen de gewone site zonder account.

## Verplicht: één Access-toepassing met drie beschermde URL-paden
Cloudflare Access geeft **per applicatie één Audience (AUD)** uit. De backend gebruikt één `POLICY_AUD` voor zowel `admin.html` als de API. **Maak daarom één self-hosted Access-app** met alle drie de publieke bestemmingen onder hetzelfde domein en dezelfde policy:

| Public hostname | Path | Waarom |
| --- | --- | --- |
| `mk38style.be` | `/admin.html` | Bescherm de oorspronkelijke beheerlink |
| `mk38style.be` | `/admin` | Bescherm de clean URL waarnaar Pages kan omleiden |
| `mk38style.be` | `/api/admin/*` | Bescherm alle beheer-API-routes en hun JWT |

**Gebruik niet twee aparte Access-apps zonder de code aan te passen:** hun verschillende AUD-tags laten `admin.html` en de API niet met dezelfde `POLICY_AUD` werken. De wildcard `/api/admin/*` dekt het parent-pad `/api/admin` niet; dat is geen bestaande Function-route. Leg geen Access-app op `mk38style.be/*` of `/` die de openbare website sluit.

Cloudflare Pages serveert HTML ook op een **extensionless URL**; bescherm beide URL's en controleer desgewenst ook \`/admin/\` als extra alias in de Access-policy. De applicatiemiddleware weigert alle drie.

Aanmaak zodra Cloudflare-zone **Active** is:
1. OTHRYS Cloudflare Dashboard → **Zero Trust** → **Access controls** → **Applications** → **Create application** → **Self-hosted and private**.
2. Applicatienaam: `MK Style Owner Admin`.
3. Voeg beide **Public hostname** / **Path**-bestemmingen hierboven toe **binnen dezelfde applicatie**. Controleer exact of elke aangevraagde route matcht; neem geen Access-bypass policy op.
4. Access policy: **Allow → Emails → `38mkstyle@gmail.com`**, en optioneel het uitdrukkelijk bevoegde OTHRYS-beheeradres voor technische ondersteuning. Geen `Everyone`, brede e-maildomeinen, of `Bypass`. Zet default deny aan (Access doet dit standaard).
5. Identiteit: zorg eerst dat **One-time PIN** als loginmethode actief is in Cloudflare Zero Trust (nieuwe accounts gebruiken mogelijk een andere standaardlogin). Selecteer die methode voor deze applicatie. Cloudflare **One-time PIN** per e-mail. Murat krijgt een code in Gmail, wij krijgen geen Gmail-toegang. Stel een beperkte sessieduur in (bv. één dag); op een eigen toestel hoeft Murat alleen periodiek opnieuw te bevestigen.
6. Na Create: kopieer de **Application Audience (AUD)** uit Additional settings, en de eigen Zero Trust team domain (`https://<team>.cloudflareaccess.com`).
7. Op **Cloudflare Pages → mk-style → Settings → Variables and Secrets → Production** (niet in Git) instellen:
   - `TEAM_DOMAIN` = exacte team-URL inclusief `https://`
   - `POLICY_AUD` = de **enige** Audience Tag van bovenstaande app
   - `ADMIN_EMAILS` = komma-gescheiden lijst van werkelijk toegelaten beheerders (minstens `38mkstyle@gmail.com`)
   - `DB` = **mk-style-production** D1-binding, niet staging
8. Bevestig met een nieuwe Pages-production deployment dat de productievariabelen effectief aanwezig zijn. Leg geen Access JWT's, PIN-codes, OAuth-gegevens of secrets vast in GitHub, een screenshot of berichten.

## Applicatiebeveiliging als tweede laag
De server valideert iedere beheer-API-call op **RS256-handtekening, issuer, Audience en e-mailadres**. Het productiedomein controleert ook `/admin.html`, `/admin` en `/admin/` op dezelfde identiteit in `functions/_middleware.js`. Zonder werkende Access-configuratie geeft de server een **503** en zonder geldige JWT een **401**. De ontwikkelpreview blijft op verzoek publiek toegankelijk, maar kan niets wijzigen zonder geldige Access-configuratie.

## Vereiste live acceptatietests (voor goedkeuring)
- [ ] `https://mk38style.be/` en `/api/config` werken voor anonieme klanten
- [ ] Anonieme `/admin.html` en `/admin` worden naar Access-login omgeleid of geweigerd; **niet 200 en niet 503**
- [ ] Anonieme `/api/admin/config`, `/api/admin/history`, `/api/admin/undo`, `/api/admin/propose` worden tegengehouden
- [ ] `38mkstyle@gmail.com` meldt aan met e-mailcode en ziet de beheerpagina; een willekeurig ander e-mailadres wordt geweigerd
- [ ] De login geeft geen Cloudflare- of GitHub-beheertoegang; de klant ziet alleen de MK Style beheerfuncties
- [ ] Datumgebonden testsluiting invoeren → andere browser ziet de wijziging → versiegeschiedenis toont actor → undo herstelt vorige versie
- [ ] Eén verkeerde Origin / oude versie wordt afgewezen; geen half uitgevoerde mutatie
- [ ] `npm run smoke:production` slaagt; nog geen echte klantgegevens testen voordat herstelprocedure operationeel is

## Domein-/release-afhankelijkheid
Cloudflare vereist voor een Apex Pages Custom Domain dat de zone via nameservers actief is. De huidige zone is **Pending**; toegewezen nameservers zijn `maya.ns.cloudflare.com` en `peter.ns.cloudflare.com`. Wij wijzigen OVHcloud niet zonder Murats gerichte toestemming. In de tussentijd kunnen alle code- en offline tests doorlopen, maar deze live Access-acceptatietests blijven open.

## Officiële bronnen
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/self-hosted-public-app/
- https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
- https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
