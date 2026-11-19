# MK Style — concept wettelijke vermeldingen en privacy (NIET PUBLIEK)

**Status:** werkdocument. Dit is geen juridisch advies of kant-en-klare verklaring. Verifieer toepasselijk Belgisch/EU recht en concrete diensten vóór publicatie. Laat Murat de gegevens en verwerkingen bevestigen, en laat bij twijfel nakijken door jurist/privacyadviseur.

## Wettelijke bedrijfsinformatie — te verzamelen
- Handelsnaam: **MK Style** (door Murat bevestigd op 17/11/2026)
- Juridische vorm/naam zoals door Murat opgegeven: **MK Style CommV.** (definitieve weergave controleren aan officiële KBO-registratie)
- Ondernemingsnummer: **1004.134.102**; btw-nummer: **BE1004.134.102** (door Murat op 17/11/2026 bevestigd; nog officieel te controleren)
- Vestigingsadres: Sint-Gertrudisplein 24, 3740 Beverst (Bilzen-Hoeselt) **[TE BEVESTIGEN]**
- Zakelijk e-mailadres: **38mkstyle@gmail.com** (door Murat bevestigd op 18/11/2026)
- Telefoonnummer: 0484 07 39 08 **[TE BEVESTIGEN]**
- Toezicht-/beroepsvermeldingen: **[enkel indien van toepassing]**
- Verantwoordelijke voor inhoud en contact voor aanpassingen: **[TE BEVESTIGEN]**

Ondernemingsnummer en juridische naam zijn door Murat gedeeld en komen overeen met een publieke KBO-afgeleide vermelding. Controleer officiële KBO/BCE-gegevens en controleer de zakelijke contactgegevens vóór definitieve publicatie. Geen persoonsgegevens of aanvullende gegevens verzinnen.

## Privacyverklaring — basisstructuur (aanpassen aan feitelijke gegevensverwerking)
1. **Verwerkingsverantwoordelijke:** naam/gegevens Murat/onderneming.
2. **Welke gegevens?** Openbare website zonder formulier: bijvoorbeeld serverlogs zoals IP, user agent, tijdstip en foutstatus; bij AI-admin: toegelaten e-mailadres, logins, wijzigingen, beperkte audit-/quotagegevens; bij telefoon/WhatsApp klik wordt de gebruiker naar externe dienst geleid. Verifieer werkelijke Cloudflare logs.
3. **Doelen, rechtsgronden en bewaartermijnen:** beveiliging/levering website, beheerlogin, audit, AI-verwerking; per categorie en grondslag specificeren (geen willekeurige bewaartermijn kiezen).
4. **Ontvangers/verwerkers:** Cloudflare, domeinregistrar OVHcloud, eventuele Google Gemini API/AI-provider, externe socialmedia-diensten; check verwerkingsovereenkomsten, locatie, subverwerkers en internationale transfers.
5. **Cookies/localStorage:** in productie mag geen oude browser-PIN/localStorage-wijzigingstoepassing meer draaien. Controleer daadwerkelijk cookie-/analyticsgebruik en relevante opt-in vereisten.
6. **Rechten bezoekers:** inzage, rectificatie, wissen, bezwaar, beperking en klachtmogelijkheden bij Belgische Gegevensbeschermingsautoriteit, voor zover van toepassing.
7. **Beveiliging en contact:** authentificatie, strikt beperkte toegang, incidentcontact en privacycontact.
8. **Foto's:** vastleggen gebruiksrechten en eventuele toestemming/publicatiegrond bij herkenbare klanten.
9. **Beheer en AI:** beknopte verklaring dat beheerinstructies door AI worden verwerkt; geen klantgegevens of gevoelige inhoud delen met model; menselijke goedkeuring vereist voor publiceren.
10. **Laatste actualisatiedatum:** invullen bij formele publicatie.

## Vastgestelde externe bronnen (technische audit 19/11/2026)
Bij het openen van de publieke voorbeeldwebsite worden rechtstreeks van andere partijen geladen:
- **Google Fonts**: CSS op `fonts.googleapis.com` en lettertypebestanden op `fonts.gstatic.com`. Beoordeel of zelf hosten of een alternatief font nodig is om externe verzoeken te verminderen. Leg in de definitieve privacyverklaring de werkelijk gebruikte dienstverlening vast.
- **OpenStreetMap**: de externe kaart wordt sinds 19/11 **pas geladen na een expliciete klik op ‘Toon kaart’**. Daarvoor maakt de pagina geen kaart-iframe aan. De kaart deelt bij openen mogelijk netwerkgegevens met OpenStreetMap; dit moet nog worden vermeld in de definitieve privacyverklaring. De aparte Google Maps/Waze-links blijven bruikbaar zonder de kaart te laden.
- **Facebook, Instagram, WhatsApp, Waze en Google Maps** worden als links gebruikt: daadwerkelijke gegevensuitwisseling door die verwijzingen start normaal pas bij aanklikken, behalve wanneer later extra widgets/scripts toegevoegd worden.
- Nieuwe statische **Content-Security-Policy** beperkt uitvoering van scripts tot eigen bestanden en staat enkel de nodige font- en kaartbronnen toe. Dit is een beveiligingsmaatregel, **geen vervanging van privacy-informatie of toestemming**.
- Geen Analytics- of advertentiepixel is in de door ons gecontroleerde `index.html` en `admin.html` opgenomen. Verifieer vóór livegang nog de werkelijk gedeployde scripts, Cloudflare-loginstellingen, eventuele cookies en derde partijen.

- **Beheerwijzigingen/audit:** in de beveiligde beheerpagina worden de tien recentste wijzigingsrecords (versie, actor-e-mailadres, tijdstip, bron) getoond; deze worden gelezen via een met Cloudflare Access beveiligde API. Bepaal vóór lancering de bewaartermijn en het privacycontact voor deze auditgegevens.

## Technische controles
- [ ] Check feitelijke cookies, scripts, fonts, embeds, tracking, headers en serverlogs.
- [ ] Bezoeker kan contact en wettelijke informatie vinden zonder login.
- [ ] Privacytekst alleen publiceren als verantwoordelijke en contactpunten correct zijn.
- [ ] D1-bewaartermijnen voor audit/AI-quota vastgelegd, geen onbeperkte opslag zonder noodzaak.
- [ ] Admin nooit laten vragen om klantnamen, foto's of gevoelige persoonsgegevens via AI.
- [ ] Datadeling aan AI-provider pas na akkoord over provider en gegevensverwerking.
- [ ] Beveiliging/backup/herstel vastgelegd.

## Open vragen voor Murat
- Wil hij überhaupt analytics/tracking? Zo nee: begin privacyvriendelijk zonder marketingcookies.
- Welk bedrijf is juridische verantwoordelijke?
- Wie krijgt adminrechten en wie mag van rechtswege zakelijke wijzigingen goedkeuren?
- Wil hij teksten op social media alleen kopiëren, of op termijn via Meta publiceren?

## Relevante openbare bronnen om te raadplegen bij afronding
- Belgische FOD Economie: https://economie.fgov.be/nl
- Gegevensbeschermingsautoriteit: https://www.gegevensbeschermingsautoriteit.be/
- GDPR (EU-verordening 2016/679): https://eur-lex.europa.eu/eli/reg/2016/679/oj
- Europese Commissie GDPR: https://commission.europa.eu/law/law-topic/data-protection_en

**Niet als juridisch goedgekeurd markeren totdat feitelijke implementatie, verwerking en bedrijfsgegevens gecontroleerd zijn.**
