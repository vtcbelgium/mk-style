# MK Style — Groei, lokale SEO, Google Business en Social Studio

**Operationeel plan · 19 november 2026 · OTHRYS / MK Style**

Dit plan is gebaseerd op de huidige MK Style-ontwikkelbranch, de door de zaak bevestigde prijzen en openingstijden, de aangetroffen openbare Google Maps-vermelding en recente officiële Google/Meta-documentatie. Het is **geen belofte dat koppelingen al actief zijn**. De domeinzone `mkstyle.be` is nog Pending; geen productiepublicatie zonder de releasevoorwaarden.

## Ontwerpprincipe: klein salon, weinig administratie

**Eén winkel, één overzicht.** Murat moet niet voortdurend een marketingdashboard openen. De kern is:
1. De correcte openingsuren, uitzonderlijke sluitingen, prijzen, adres, route en telefoon zijn onmiddellijk beschikbaar.
2. OTHRYS controleert de technische gezondheid en meldt echte afwijkingen.
3. Murat krijgt voorstellen in plaats van ingewikkelde taken. Gevoelige aanpassingen en sociale publicaties vereisen zijn goedkeuring.
4. De salonsite is géén afspraakplatform: het bevestigde onderscheid is **zonder afspraak**. Geen wachtrij, boekingsmotor, webwinkel of chatbot bouwen zonder concrete vraag.

## P0 — absolute basisbehoeften vóór lancering

| Basis | Huidige stand / noodzakelijke controle |
|---|---|
| Snelle mobiele startpagina | Bestaand; echte Core Web Vitals en mobiele bediening nog meten |
| Diensten & prijzen | Zes door eigenaar bevestigde diensten via D1; de beheerder kan prijzen wijzigen |
| Openingsuren en vakanties | D1, speciale sluitingsdagen en 31-daagse verlofperiodes; Google synchronisatie nog niet actief |
| Telefoneren en navigeren | Call-to-action aanwezig; nieuwe knop verwijst naar de specifieke openbare Google Maps-vermelding |
| Vertrouwen en contact | Zakelijke naam, telefoon, e-mail, ondernemingsnummer, btw zichtbaar; officiële KBO-check blijft releasevoorwaarde |
| Foto's en branding | Beschikbare salonfoto's; eigendoms-/publicatierechten en herkenbare klanten nog te bevestigen |
| Betrouwbare hosting | Cloudflare Pages-preview en EU-D1 operationeel; productiedomein nog niet gekoppeld |
| Beheerlogin | Alle API's server-side beschermd; Cloudflare Access eigenaar-login nog niet actief |
| Herstelbaarheid | Versiegeschiedenis en één-stap undo getest; echte afzonderlijke D1-backup+restoretest nog open |
| Privacy | OpenStreetMap pas na klik; Google Fonts nog extern; definitieve privacyverklaring en bewaartermijnen open |
| Basis-toegankelijkheid | Goede tekstelementen/buttons; echte mobiele toetsenbord-/contrast-/screenreadertest voor publicatie |

**Uitgangspunt:** liever een eenvoudig maar volledig werkend salon dan tientallen halfgekoppelde dashboards.

## P1 — uitzonderlijk goede *lokale* SEO

### A. Google Business Profile is waarschijnlijk belangrijker dan extra SEO-pagina's

Er bestaat een openbare **MK Style**-vermelding voor **Sint-Gertrudisplein 24, 3740 Bilzen-Hoeselt**. De locatie is vindbaar via Google Maps, publieke bedrijvengidsen en reviewvermeldingen. OTHRYS heeft **niet vastgesteld of Murat eigenaar-/beheertoegang heeft**. Geen tweede vermelding creëren. De gevonden Google Maps Place ID is `ChIJu8aXT6XgwEcRyp23QzZ2j2A`.

Zodra Murat toegang autoriseert: controleer één voor één naam, juiste primaire categorie (**feitelijk kapsalon/barbier, niet zomaar kiezen**), adres, telefoon, website, normale en speciale uren, zes diensten/prijzen, foto's, eventuele services en actuele status. Vergelijk verschillen vooraf en vraag goedkeuring voor correcties. Sommige bedrijvengidsen suggereren aanvullende diensten, zoals damesknippen; **niet op onze site overnemen zonder bevestiging**.

Google Local-ranking leunt op **relevantie, afstand en bekendheid/prominentie**. We kunnen afstand niet manipuleren. Wat we wél kunnen: complete gegevens, echte diensten, sterke beelden, tevreden klanten, correcte reviews en lokale vermeldingen zonder spam.

### B. Website en Google moeten dezelfde identiteit tonen

Consistent op homepage, footer, LocalBusiness JSON-LD, Google Business, social links en zakelijke directories:
- **MK Style**, MK Style CommV.
- Sint-Gertrudisplein 24, 3740 Beverst (Bilzen-Hoeselt), België
- Telefoon **0484 07 39 08**, e-mail **38mkstyle@gmail.com**
- Dienstentabel en prijzen vanuit D1 (bron van waarheid)
- Maandag/zondag gesloten; dinsdag-vrijdag 09:30–13:00 en 13:30–18:30; zaterdag 09:00–17:00
- **Zonder afspraak** als eerste unieke klantvoordeel

Nooit fictieve ratings of `aggregateRating` aan het eigen LocalBusiness-schema toevoegen. Google toont geen zelf-beheerde LocalBusiness-reviewsterren als organic rich snippet. FAQ-vragen blijven nuttige bezoekersinhoud, maar de verouderde `FAQPage` structured-data-claim heeft in 2026 geen Google-rich-resultwaarde meer.

### C. Zoekintentie en content — zonder doorway pages

| Intentie | Aanbevolen zichtbare content | Pagina |
|---|---|---|
| 'MK Style Beverst' / 'MK Style Bilzen' | Bedrijfsnaam, contact, route en exacte adresgegevens | Homepage |
| 'herenkapper Beverst zonder afspraak' | Directe walk-in uitleg, dagen en uren | Homepage hero |
| 'barbier Bilzen-Hoeselt' | Echte baard- en knipdiensten met foto's | Dienstenblok |
| 'heren knippen Bilzen prijs' | Real-time prijslijst en wat inbegrepen is | Dienstenblok |
| 'kapper Beverst openingsuren' | Nauwkeurige gewone en uitzonderlijke uren | Openingstijdenblok |

Maak later pas eigen dienstpagina's als er **unieke echte informatie en beelden** zijn. Geen 20 gekopieerde 'kapper in [gemeente]'-pagina's, AI-vulling of gekochte backlinks. Maak een natuurlijke bedrijfsbeschrijving, echte klantvragen en originele salonbeelden.

### D. Technisch SEO-go/no-go

- `mkstyle.be` als canonical, `www` met permanente redirect naar apex.
- `robots.txt` en sitemap enkel echte publieke pagina's; preview blijft `noindex`.
- `HairSalon`/`LocalBusiness` en `WebSite` JSON-LD valideren; geen zelf-promotionele rating markup.
- Open Graph previews voor delen op Facebook/WhatsApp; foto's met bruikbare `alt` tekst en duidelijke afmetingen.
- Controle Google Search Console **domain property** na DNS-delegatie (op toestemming/bewijs), sitemap indienen, URL-indexering en foutmeldingen bewaken.
- Meet Lighthouse en Core Web Vitals op mobiel: streef naar LCP ≤ 2,5 s, INP ≤ 200 ms, CLS ≤ 0,1. Dit zijn **streefwaarden**, nog geen gemeten resultaten.
- Relevante links verdienen via echte lokale verbanden en kwaliteitsvolle lokale directories. Vermijd duplicaten/onjuiste diensten.
- Zet lokale bedrijfsnaam, telefoon en adres ook expliciet in normale HTML, niet uitsluitend JavaScript of schema.

## P1 — Google Business-integratie (voorbereiden, niet autonoom activeren)

**Bestaande route voor OTHRYS:** Windsor.ai is al geïnstalleerd en ondersteunt Google Business Profile-gegevens en bevestigde mutaties. In de huidige Windsor-verbinding zijn MK Style Google Business, Instagram en Facebook **nog niet gekoppeld**. Niet doen alsof een API reeds werkt.

Mogelijke *leesfuncties* na correcte accountkoppeling:
- Maps en Search-vertoningen, zoekopdrachten, websiteklikken, routeaanvragen, belklikken.
- Recente reviews, reacties en trends; markeer onbeantwoorde reviews.
- Openingsuren, locatiegegevens, diensten, foto's en lokale berichten vergelijken met D1.

Mogelijke *mutaties*, **nooit stilzwijgend**:
- Bij sitewijziging: verschil in openingstijden of speciale feestdagen tonen → Murat keurt de specifieke Google-wijziging goed → pas daarna naar Google.
- Conceptreviewantwoord laten maken → eigenaar leest **de echte review** → expliciete goedkeuring per antwoord. Geen verzonnen klantgetuigenissen of automatisch defensieve reacties.
- Nieuwe bedrijfsfoto of Google-post: gebruiksrecht en inhoud vooraf bevestigen; nooit eigenaren vervangen of profielclaiming zonder eigenaarstoestemming.
- Houd een lokale auditregel bij van voor/na, platformrespons en tijdstip; maak na Google-afkeuring geen automatische herhaalde wijzigingen.

Een **eigen** Google Business Profile API-app vergt afzonderlijke projectgoedkeuring, verificatievoorwaarden en houdt beperkingen in voor dienstverlening aan derden. OTHRYS mag niet als ongereguleerde GBP-proxy worden gebouwd. Gebruik eerst de bestaande officiële/verbonden route of de handmatige Google-profielinterface.

Google-reviews kunnen met de officiële **Review-link/QR-code uit Murats eigen bedrijfsprofiel** worden gevraagd. Geen verzonnen reviewlink, geen incentives, geen uitsluitend 5-sterrenklanten benaderen.

## P1/P2 — Social Studio: Instagram, Facebook én Google

**Al gebouwd in de ontwikkelbranch:**
- Kopieerbare conceptteksten per platform voor: zonder afspraak, bevestigde dienst/prijs, adres, bestaande uitzonderlijke opening.
- De server leest de actuele D1-gegevens, verifieert het onderwerp en levert **nooit een gepubliceerd bericht**.
- Optionele Gemini-AI-herformulering met bestaande beveiligde adminlogin en gedeelde daglimiet van 10 AI-voorstellen (vereist AI-secret; momenteel niet actief).
- Menselijke eindcontrole van feiten, tekst en fotorechten. Geen verzonnen korting, prijs, externe URL of testimonial; AI-resultaten kunnen alsnog onjuist zijn en moeten gelezen worden.

**Aanbevolen workflow:** Idee → feiten checken → concept → foto kiezen en rechten checken → eigenaar keurt goed → handmatig kopiëren/publiceren → na koppeling eventueel gecontroleerd via API publiceren → bereik evalueren.

**Klein, haalbaar ritme:** twee goede social posts per week, af en toe een Story, en alleen een Google Update wanneer er echte relevante informatie is. Niet elke dag dezelfde AI-tekst rondpompen.

**Vierweekse contentmix:**
1. Salonintroductie met echte interieurfoto (rechten bevestigen), plus de duidelijke zonder-afspraak-boodschap.
2. Herenknipbeurt en baardservice met werkelijke prijzen en goede detailfoto's.
3. Openingsuren, aankomst en locatie; Instagram Story met echte salonbeelden.
4. Echte werkfoto's/klantresultaten **alleen na aantoonbare toestemming**; praktische haarverzorgingstips zonder overdreven claims.

**Later, uitsluitend na Meta-koppeling:** afzonderlijke goedkeuring voor Facebook-pagina en Instagram Professional-account; platformrechten, tokenverval en feedback bewaken. Een actief Meta-account is iets anders dan toegang tot een Facebook-profiel van Murat. Posts, advertenties en reviews worden nooit publiek gemaakt vanuit preview/demo.

Voor AI/beelden: geen herkenbare klanten, gezichten van kinderen, verzonnen *before/after*-resultaten, of persoonlijke DM's als trainingsinput zonder vereiste toestemming. Laat de eigenaar foto's aanleveren, niet synthetisch zijn werk imiteren.

## P2 — OTHRYS Support en automatische werking

| Signaal | Automatisch | Handeling bij probleem |
|---|---|---|
| Website uptime, HTTPS en `/api/health` | Ja, periodieke read-only controle | Waarschuwing bij herhaalde storing, niet elke eenmalige hapering |
| Cloudflare DNS/SSL, domeinverval | Ja, statuscontroles | Waarschuw eigenaar bij afwijking of aflopende SSL |
| API/serverfouten, deploy- en securitytests | Ja, CI en logbewaking | Blokkeer foutieve release, bewaar technische diagnose |
| Databaseconfig en revisiehistoriek | Ja, check op gezonde D1 en scheiding | Herstel alleen volgens getest en geautoriseerd runbook |
| Openingstijden website ↔ Google | Vergelijken na OAuth | Verschil melden, **niet automatisch overschrijven** |
| Google reviews en onbeantwoorde reacties | Samenvatten na OAuth | AI stelt antwoord voor, Murat keurt per review goed |
| Instagram/Facebook organische prestaties | Samenvatten na OAuth | Voorstellen voor volgende week, geen stilzwijgende posts |
| Google Search Console | Klikken/vertoningen/technische problemen na eigenaarsverificatie | Meld echte daling, indexfout of verdwenen pagina |
| Marketingkalender | Suggesties en reminders | Murat keurt inhoud en timing goed |

**Weekrapport voor Murat (één mobielvriendelijke samenvatting):** website bereikbaar? Google Maps-belklikken/routes, nieuwe reviews, beste social post, belangrijke wijzigingen/afwijkingen en één aanbevolen actie. Toon ontbrekende integraties als **niet gekoppeld**, nooit als nul prestaties.

**Rapport aan OTHRYS:** technische logs, uptime/incidenten, release- en beveiligingsstatus, niet de privégegevens van klanten. Geen ongevraagde mails of meldingen naar Murat voordat contactvoorkeur en toestemming gekend zijn.

## P2/P3 — mogelijke extra's, pas na behoefte

- Echte Google-review-QR aan de kassa, pas na eigenaarstoegang.
- Extra originele foto's en korte Reels, met aantoonbare publicatierechten.
- Seizoenssluiting automatisch als conceptvoorstel voor Google en socials, pas na Murats goedkeuring.
- Simpele 'Bel voor vertrek bij het einde van de dag'-melding indien de zaak dat zelf bevestigt.
- Eventueel lokale sponsor- of samenwerkingvermeldingen met echte partners; geen SEO-linkruil.
- Privacyvriendelijke analyse van mobiele klikacties als Murat dit wil.
- Geen reserveringssysteem, webshop, betaalmodule, CRM, DM-autoresponder of advertentieplatform voordat de behoefte duidelijk en rendabel is.

## Eenmalige klantactie wanneer alles technisch klaarstaat

Vraag Murat zo min mogelijk, maar alles in **één heldere sessie**: (1) OVHcloud-nameserverwijziging, (2) GBP eigenaar-/beheerdertoegang of Windsor-accountkoppeling, (3) Facebook-pagina/Instagram Professional-accountautorisatie via officiële toestemming, (4) één akkoord op fotorechten, bedrijfsgegevens en de eenvoudige privacytekst, (5) eindtest van zijn adminlogin op eigen telefoon. **Geen wachtwoorden, PIN-codes of API-sleutels in chat/GitHub.**

## Actuele echte status

- **Klaar in staging:** website, actuele D1-prijzen/uren, vakantie-editor, versiegeschiedenis/undo, health, beveiligde admin API, geteste Social Studio-concepten, basis technisch SEO.
- **Niet klaar / niet activeren:** Cloudflare Zone Pending, productie Pages/Access, GBP eigendom en OAuth, Meta accountconnecties, echte AI provider sleutel, onafhankelijke DB-restore, officiële bedrijfs- en fotorechtencheck.
- **Niet claimen:** gegarandeerde top-3 Google ranking, live social autopublishing, publiek reviewdashboard of datakoppeling zonder accounts.

### Officiële bronnen (controleer bij activatie opnieuw)
- Google lokale ranking: https://support.google.com/business/answer/7091
- Google Business Profile policies: https://developers.google.com/my-business/content/policies
- GBP API toegangsvoorwaarden: https://developers.google.com/my-business/content/prereqs
- GBP reviews: https://developers.google.com/my-business/content/review-data
- GBP Performance API: https://developers.google.com/my-business/reference/performance/rest
- Google LocalBusiness schema: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Google review structured-data guidelines: https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- Google lokale reviewlink: https://support.google.com/business/answer/16816815
- Facebook Page API: https://developers.facebook.com/docs/graph-api/reference/page/feed/
- Instagram API: https://developers.facebook.com/docs/instagram/platform/instagram-api/changelog/
- Belgische Gegevensbeschermingsautoriteit, recht op afbeelding: https://www.gegevensbeschermingsautoriteit.be/professioneel/thema-s/recht-op-afbeelding
