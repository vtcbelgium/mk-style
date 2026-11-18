# MK Style — minimale acties voor de OTHRYS-eigenaar
**Status:** 18 november 2026. Voorbereiding; niets van deze checklist naar Murat doorsturen zolang er placeholders zijn.

## NU: veiligheid en beheer
1. **Roteer het gelekte previewwachtwoord:** meld aan op [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → `mk-style` → Settings → Variables and Secrets → **Preview** → `STAGING_ACCESS_PASSWORD` → Edit/Replace. Gebruik een nieuw willekeurig lang geheim. Noteer het in een eigen wachtwoordbeheerder, **nooit** in WhatsApp, chat of GitHub. Controleer daarna dat het oude wachtwoord niet meer werkt. Eerdere automatische rotatiepogingen zijn door veiligheidscontroles tegengehouden; de rotatie is **niet voltooid**.
2. **Voeg de domeinzone toe via jouw Cloudflare-dashboard:** Add a domain / Connect a domain → `mk38style.be` → Free-plan (indien passend). Cloudflare Wrangler OAuth mist het zone-create recht (API 403). De domeinregistratie bij OVHcloud blijft op naam van Murat; alleen de DNS-zone wordt op OTHRYS beheerd. **Wijzig nog niets bij OVHcloud.**
3. Noteer de **twee exacte** Cloudflare-nameservers wanneer Cloudflare ze toewijst. Niet gokken; nog geen instructie naar Murat.
4. **Cloudflare Access** voor `/admin.html` en `/api/admin/*` veilig instellen met alleen `38mkstyle@gmail.com` en de afgesproken OTHRYS beheerder. Beide paden/policy-AUD controleren, en de JWT-validatie op de server laten falen wanneer het ontbreekt. Dit moet ook op previewdomeinen kloppen.

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

## Slechts één actie van Murat — later
- Zodra de Cloudflare-zone en website klaar zijn: één korte instructie of uitnodiging om OTHRYS DNS/nameserver-beheer op `mk38style.be` toe te staan, **zonder OVHcloud-inloggegevens te delen**.
- We leveren de exact toegewezen nameservers of een veilige delegatie-uitnodiging met screenshot. Zijn Gmail `38mkstyle@gmail.com` vereist geen mailboxinstellingen op het domein.
- Bij de oplevering eenmalige bevestiging van fotorechten/inhoud en test van eigen adminlogin; geen onnodige tussentijdse berichten.
