# MK Style — minimale OVHcloud-toestemming voor domeinkoppeling

**Status:** voorbereid; **nog niet naar Murat sturen** totdat Cloudflare is ingesteld en de exacte toegewezen nameservers bekend zijn.

## Doel en eigenaarschap
- `mk38style.be` blijft geregistreerd en betaald door **MK Style / Murat** bij OVHcloud.
- **OTHRYS** beheert de website, Cloudflare Pages/Functions, D1, beveiliging, deployment en dagelijkse monitoring.
- Het zakelijke Gmail-adres `38mkstyle@gmail.com` werkt onafhankelijk van `mk38style.be`; er is geen mailhosting of MX-record op het domein nodig zolang Murat geen `@mk38style.be`-mailbox wil.
- **Nooit** Murats Gmail- of OVHcloud-wachtwoord, OTP/2FA-code, herstelcodes of betaalgegevens vragen. Geen hoofdaccount gedeeld.

## Eerst door OTHRYS uit te voeren
1. Cloudflare toegang bevestigen namens de ontwikkelaar (geen bestaande secrets weergeven).
2. Cloudflare Pages-project voor MK Style op eigen OTHRYS-account aanmaken en previewdeploy activeren.
3. D1 staging en productiedatabase scheiden; API/login/auth en security op previewdomein testen.
4. `mk38style.be` als **Cloudflare-zone** toevoegen, toegewezen NS1/NS2 vastleggen. **Geen namen raden of generieke Cloudflare-nameservers gebruiken.**
5. Bestaande OVHcloud-records inventariseren (A/AAAA/CNAME/TXT/MX/CAA, DNSSEC) en benodigde records in Cloudflare voorbereiden **voordat** een nameserverwijziging wordt uitgevoerd.
6. Pas na groene tests en staging-acceptatie de domeinkoppeling aanvragen. Geen live-omschakeling op basis van alleen CI.

## Route A — Murat krijgt één concrete OVHcloud-handeling (fallback)
1. Murat opent de officiële [OVHcloud Control Panel](https://www.ovh.com/manager/) en meldt zichzelf aan.
2. `Web Cloud` → `Domain names / Domains & DNS` → `mk38style.be`.
3. Open `DNS servers` en kies `Modify DNS servers` / `Edit DNS servers`.
4. Stel de exacte twee door Cloudflare toegewezen nameservers in. **OTHRYS levert pas later de echte waarden:**
   - NS1: `<WORDT_DOOR_CLOUDFLARE_TOEGEWEZEN>`
   - NS2: `<WORDT_DOOR_CLOUDFLARE_TOEGEWEZEN>`
5. Sla op. OTHRYS controleert daarna DNS-propagatie (mogelijk tot 48 uur) en HTTPS/website. Murat hoeft de website niet zelf in te stellen.

**Belangrijk:** alleen de **autoritatieve nameservers** aanpassen; dit is iets anders dan NS-regels toevoegen in de oude OVHcloud-DNS-zone. DNSSEC/DS-records en eventuele huidige diensten eerst controleren.

## Route B — OTHRYS krijgt beperkte domeinrechten (indien ingeregeld)
- Een eigen OVHcloud NIC-handle/account onder OTHRYS gebruiken; niet als Murat inloggen.
- Murat kan via contactbeheer of IAM alleen de vereiste technische rechten op domein en DNS toekennen (controleer of die rechten **nameserverwijzigingen** toestaan, niet alleen DNS-zonebewerkingen).
- De exacte stappen zijn afhankelijk van OVHcloud-account, service en rechten; het is **nog geen vooraf ingevulde één-klik-link**.
- Behoud administratie, domeinhouderschap, facturen en billing bij Murat. Toegang moet herroepbaar en traceerbaar zijn.
- Alleen bij een expliciete scope/overeenkomst eventueel een eigen beperkte API-autorisatieflow opzetten; geen langdurige allesomvattende API-sleutels.

## Klaarzetten voor het ene bericht
Zodra de Cloudflare-zone + staging bestaan en de exacte NS1/NS2 bekend zijn:
- Geef Murat **één** link naar OVHcloud, de twee echte nameservers, een screenshot en één korte opdracht.
- Optioneel: als beperkte delegatie operationeel is, vervang de nameserver-instructie door een gerichte uitnodiging om ons te machtigen.
- Geen vragen herhalen over bedrijfsnaam, btw, openingsuren, prijzen of Gmail. Alleen expliciete finale toestemming voor fotorechten en livegang blijft nodig.

## Verificatie door OTHRYS na zijn actie
- [ ] Registrar-domein blijft onder Murats account
- [ ] Cloudflare-zone is Active met de toegewezen nameservers
- [ ] SSL geldig voor `mk38style.be` en `www.mk38style.be`
- [ ] Beide hosts werken met de afgesproken canonical redirect
- [ ] Sitebezoeker op ander toestel ziet de juiste prijzen/uren
- [ ] Admin en API enkel toegankelijk na server-side autorisatie
- [ ] Verkeerde/mislukte mutatie niet live; rollback en back-up getest
- [ ] Search Console en sitemap hercontrole na livegang

## Officiële referenties
- Cloudflare Pages apex: https://developers.cloudflare.com/pages/configuration/custom-domains/
- Cloudflare nameservers: https://developers.cloudflare.com/dns/nameservers/update-nameservers/
- OVHcloud nameservers: https://docs.ovhcloud.com/en/guides/web-cloud/domains/dns-server-edit
- OVHcloud contacten/delegatie: https://docs.ovhcloud.com/en/guides/account-and-service-management/account-information/managing-contacts
- OVHcloud IAM: https://docs.ovhcloud.com/en/guides/account-and-service-management/account-information/iam-policy-ui
