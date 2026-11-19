# MK Style — minimale acties voor de OTHRYS-eigenaar
**Status:** 19 november 2026 (bijgewerkt na pre-launch-voorbereiding). E-mail met checklijst en OVHcloud-stappen is naar Murat (`38mkstyle@gmail.com`) verstuurd; we wachten op zijn antwoord en DNS-delegatie.

## Reeds afgerond en geverifieerd (19 november 2026)
- ✅ **Staging-preview gesynchroniseerd met PR #44:** `https://feat-production-readiness-20.mk-style.pages.dev/` draait de nieuwste build (self-hosted fonts, `/privacy.html`, `width/height` CLS-fix, XSS-hardening) en slaagt op alle 15 read-only checks van `npm run smoke:staging` (incl. fail-closed 503 op alle 5 `/api/admin/*`-endpoints).
- ✅ **Oud previewsecret opgeruimd:** `STAGING_ACCESS_PASSWORD` is verwijderd uit Cloudflare Pages `preview` (`wrangler pages secret list --env preview` is leeg).
- ✅ **EU D1-databases identiek & restore-drill geslaagd:** zowel `mk-style-staging` als `mk-style-production` staan in regio `eu` met identieke `config_json` SHA-256 (`7f5df086...`); export (`wrangler d1 export`) → schone lokale restore (`wrangler d1 execute --local`) → lokale rollback `v1 -> v2 -> v3` is bewezen (`SHA256 v3 == v1`, tijdelijke dumps gewist).
- ✅ **Lighthouse-audits & SEO-barrier groen op staging:** Mobiel **99 / 94 / 100** (Perf / A11y / Best Practices, CLS `0`, LCP `0.9s`), Desktop **100 / 94 / 100** (CLS `0.018`), **`0` third-party requests** bij laden, **`0` console errors**, en `seo_authorship_barrier` `PASS` (`0` findings op `4` gebouwde pagina's). SEO-score op staging is `69` enkel door het opzettelijke `X-Robots-Tag: noindex`.
- ✅ **Mail naar Murat verstuurd:** eenmalige goedkeuring voor inhoud/foto's/betaalopties + 5 OVHcloud-klikken (`maya.ns.cloudflare.com`, `peter.ns.cloudflare.com`) verstuurd; `npm run domain:check` bevestigt nu nog `NXDOMAIN`.

## Cloudflare-zone en overgebleven Dashboard-actie (3 minuten voor Jeroen)
- **Zone:** `mkstyle.be`, status **pending** (`maya.ns.cloudflare.com` en `peter.ns.cloudflare.com`).
- **Niet klikken op ‘I updated my nameservers’** vóórdat Murat ze bij OVHcloud effectief heeft ingesteld; Custom Domains op Pages pas toevoegen zodra de zone **Active** wordt.
- **Wat jij (Jeroen) nu of direct bij activatie in Cloudflare Dashboard moet doen** *(Wrangler OAuth heeft geen Zero Trust Access-schrijfrechten)*:
  1. Open **Cloudflare Dashboard → Zero Trust → Access controls → Applications → Create application → Self-hosted** (`MK Style Owner Admin`).
  2. Voeg in die **éne** app alle paden toe onder `mkstyle.be`: `/admin.html`, `/admin`, `/admin/`, en `/api/admin/*`.
  3. Zet als loginmethode **One-time PIN** aan (e-mailcode), policy **Allow → Emails → `38mkstyle@gmail.com`** (+ jouw eigen OTHRYS-beheeradres), default deny aan.
  4. Kopieer **Application Audience (AUD)** + **Team domain** (`https://<team>.cloudflareaccess.com`) naar **Workers & Pages → mk-style → Settings → Variables and Secrets → Production**:
     - `TEAM_DOMAIN`
     - `POLICY_AUD`
     - `ADMIN_EMAILS` (`38mkstyle@gmail.com,<jouw-beheermail>`)
     - *(Optioneel na akkoord)* `GEMINI_API_KEY` + `GEMINI_MODEL=gemini-2.5-flash`
     - Controleer dat de **`DB`** D1-binding in Production wijst naar **`mk-style-production`**.

## Later: CI/CD zonder toegang tot jouw hoofdaccount
- In [GitHub repo-instellingen](https://github.com/vtcbelgium/mk-style/settings/environments) een Environment `mk-style-staging` maken en bij voorkeur een approval/reviewer instellen.
- Cloudflare API Token aanmaken met minimaal Account → **Cloudflare Pages: Edit** voor uitsluitend het noodzakelijke account (geen Global API key).
- In die GitHub Environment de secrets `MK_STYLE_CLOUDFLARE_API_TOKEN` en `MK_STYLE_CLOUDFLARE_ACCOUNT_ID` instellen; waarden niet in broncode of issues noteren.
- Daarna `.github/workflows/staging-deploy.yml` handmatig activeren op branch `feat/production-readiness-2026-11` en resultaten controleren. Deze workflow deployt **nooit** naar `main`/productie. Pas na security en klantacceptatie een aparte productieprocedure definiëren.
- Volgens de [Cloudflare-handleiding](https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/) kan het huidige Direct Upload-project niet omgezet worden naar ingebouwde Git-integratie; de GitHub Action is hiervoor de bedoelde oplossing.

## Na antwoord Murat & DNS-activatie (livegang)
- Verwerk eventuele tekst-, foto- of betaalmethode-opmerkingen van Murat (en herhaal `seed` alleen als `site-config.json` verandert).
- Koppel `mkstyle.be` en `www.mkstyle.be` aan Pages Custom Domains (en stel `www -> mkstyle.be` redirect in).
- Merge Draft PR #44 naar `main`, deploy naar productie, draai `npm run smoke:production`, test 1 live `/admin` login + wijziging + undo, schakel de oude GitHub Pages-demo uit, en zet `mk-style` in OTHRYS op `live`.
- **Google Business & Search Console (na livegang):** link op Place ID `ChIJu8aXT6XgwEcRyp23QzZ2j2A` koppelen zodra Murat toegang bevestigt (geen dubbele vermelding aanmaken) en `sc-domain:mkstyle.be` in Search Console verifiëren.
- **Socials (optioneel, na livegang):** alleen na duidelijke toestemming voor Facebook en Instagram; eerste conceptpost samen controleren, niets automatisch publiceren.
