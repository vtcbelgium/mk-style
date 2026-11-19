# MK Style — minimale acties voor de OTHRYS-eigenaar
**Status:** 19 november 2026. Voorbereiding; niets van deze checklist naar Murat doorsturen zolang er placeholders zijn.

## Cloudflare-zone geactiveerd in beheer, nog niet in publieke DNS — 19 november 2026
- **Zone bestaat:** `mk38style.be`, status **pending** zolang de registrar niet naar Cloudflare delegeert.
- **Door Cloudflare toegewezen nameservers:** `maya.ns.cloudflare.com` en `peter.ns.cloudflare.com`.
- **Niet klikken op ‘I updated my nameservers’** vóór werkelijk wijzigen bij OVHcloud; dat maakt geen DNS-records.
- **Eerst:** een geteste en geaccordeerde productiebuild plus Cloudflare Access/backup/legale inhoud voorbereiden. **De Pages Custom Domain-koppeling kan door Cloudflare geblokkeerd worden zolang de DNS-zone Pending is**; deze is dus nog niet afgerond. Geen namenserverwijziging voordat de launchchecklist klaarstaat.
- **Daarna pas:** Murat eenmalig de OVHcloud-nameserverwijziging voor deze twee nameservers laten autoriseren. Zodra de zone **Active** wordt, koppelen we `mk38style.be` en `www.mk38style.be` aan Pages en controleren we SSL en redirects. Controleer vooraf DNSSEC/DS en bestaande records. Murat behoudt domeinregistratie en facturatie.
- Het oude zone-create-403 probleem is opgelost door toevoeging via de Cloudflare-dashboardworkflow; het probleem is dus niet langer actueel.

## NU: veiligheid en beheer
1. **Geen extra wachtwoord meer nodig tijdens ontwikkeling:** de preview toont voortaan de website direct, zonder Basic Auth. De server-side beheer-API blijft fail-closed tot Cloudflare Access is ingesteld. Het oude previewsecret kan later in Cloudflare worden verwijderd; het wordt door de huidige code niet meer gebruikt.
2. **Cloudflare-zone toegevoegd:** de zone staat op Pending met de twee toegewezen nameservers. Nu de afzonderlijke Pages Custom Domains voorbereiden; OVHcloud nog niet wijzigen.
3. De toegewezen nameservers zijn al bevestigd: `maya.ns.cloudflare.com` en `peter.ns.cloudflare.com`. De volgende afhankelijkheid is veilige productievoorbereiding, niet opnieuw opvragen.
4. **Cloudflare Access** voor `/admin.html`, `/admin`, `/admin/` en `/api/admin/*` veilig instellen met alleen `38mkstyle@gmail.com` en de afgesproken OTHRYS beheerder. Beide paden/policy-AUD controleren, en de JWT-validatie op de server laten falen wanneer het ontbreekt. Dit moet ook op previewdomeinen kloppen.

## Later: CI/CD zonder toegang tot jouw hoofdaccount
- In [GitHub repo-instellingen](https://github.com/vtcbelgium/mk-style/settings/environments) een Environment `mk-style-staging` maken en bij voorkeur een approval/reviewer instellen.
- Cloudflare API Token aanmaken met minimaal Account → **Cloudflare Pages: Edit** voor uitsluitend het noodzakelijke account (geen Global API key).
- In die GitHub Environment de secrets `MK_STYLE_CLOUDFLARE_API_TOKEN` en `MK_STYLE_CLOUDFLARE_ACCOUNT_ID` instellen; waarden niet in broncode of issues noteren.
- Daarna `.github/workflows/staging-deploy.yml` handmatig activeren op branch `feat/production-readiness-2026-11` en resultaten controleren. Deze workflow deployt **nooit** naar `main`/productie. Pas na security en klantacceptatie een aparte productieprocedure definiëren.
- Volgens de [Cloudflare-handleiding](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/) kan het huidige Direct Upload-project niet omgezet worden naar ingebouwde Git-integratie; de GitHub Action is hiervoor de bedoelde oplossing.

## Wat OTHRYS nog kan voorbereiden zonder Murat
- Productiepolicy, DNS-waarden, privacy/SEO-checks, scenario-/rollbacktests, server-side AI-provider/budget en monitoring.
- D1-back-up en hersteltest pas met toestemming voor een veilige backup-locatie. Geen live data zomaar naar een willekeurige map kopiëren.
- Andere bedrijfsclaims controleren (16+ jaar vakmanschap, gratis parkeren, diensten, foto's) en twijfelachtige claims niet als bevestigde feiten publiceren.

## Eén gebundeld onboardingmoment met Murat — later
- Zodra de Cloudflare-zone en website klaar zijn: één korte instructie of uitnodiging om OTHRYS DNS/nameserver-beheer op `mk38style.be` toe te staan, **zonder OVHcloud-inloggegevens te delen**.
- We leveren de exact toegewezen nameservers of een veilige delegatie-uitnodiging met screenshot. Zijn Gmail `38mkstyle@gmail.com` vereist geen mailboxinstellingen op het domein.
- Bij de oplevering eenmalige bevestiging van fotorechten/inhoud en test van eigen adminlogin; geen onnodige tussentijdse berichten.
- **Google Business:** bestaande MK Style-locatie (Place ID `ChIJu8aXT6XgwEcRyp23QzZ2j2A`) is publiek gevonden. Check of Murat er beheerder/eigenaar van is, maak geen dubbele locatie. Later eventueel via officiële Windsor.ai/Google OAuth toestemming koppelen, zonder inloggegevens te delen.
- **Socials:** alleen na duidelijke toestemming voor de Facebook-pagina en Instagram Professional-account. Windsor.ai staat klaar maar heeft voor MK Style nog geen gekoppelde accounts. Laat de eigenaar de eerste conceptpost controleren; niets automatisch publiceren.
- **Google Search Console:** na DNS-activatie de nieuwe `sc-domain:mk38style.be` property toevoegen en verifiëren; de bestaande OTHRYS-property is geen toestemming of toegang tot MK Style.
- **AI:** alleen de server-side Gemini-secret in de Cloudflare omgeving instellen nadat dataverwerking, kosten en toegang zijn besproken. De gratis Social Studio-sjablonen hebben geen AI-secret nodig.
- Vooraf: claims zoals 16+ jaar ervaring, gratis parkeren en rechten op herkenbare beelden blijven apart te controleren.
