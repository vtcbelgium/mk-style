# MK Style — Herenkapper & Barbier (Bilzen-Hoeselt / Beverst)

Moderne, supersnelle en lokaal SEO-geoptimaliseerde one-pager + interactief **AI Beheerpaneel** voor **MK Style (Murat)** op Sint-Gertrudisplein 24, 3740 Beverst (Bilzen-Hoeselt).

## Wat zit erin?
- **`index.html`** — Volledige one-pager met:
  - Live openingsstatus (`NU OPEN` / `MIDDAGPAUZE` / `GESLOTEN`) op basis van Belgische tijd (`Europe/Brussels`).
  - Bovenaan een dynamische **Verlof / Feestdag / Actie** meldingsbalk.
  - Volledige **Local SEO** opbouw (`HairSalon` + `FAQPage` JSON-LD Schema.org, Open Graph tags, semantische koppen voor *Bilzen, Beverst, Hoeselt, Bilzen-Hoeselt*).
  - Echte foto's en logo van Murat zijn vernieuwde zaak.
  - Mobiele *1-tap* knoppenbalk onderaan (`Bel Murat` + `Route Plannen`).
- **`admin.html`** — **MK Style AI Studio** (Demo-pincode: `3824`):
  - Spreek in (via microfoon `nl-BE`) of typ in gewoon Nederlands wat er wijzigt (bv. *"Donderdag gesloten wegens feestdag"* of *"Jaarlijks verlof van 10 t/m 20 augustus"*).
  - Past **live** de website aan én schrijft automatisch een klaarstaande **Facebook + Instagram post** (`@mkstyle.38`) met lokale hashtags.
  - Optionele koppeling met gratis **Google Gemini API** (`gemini-2.5-flash`) en **Make.com / n8n Webhook** voor 1-klik publicatie naar Meta Business Suite.
- **`data/site-config.json`** — Centrale configuratie van uren, prijzen en meldingen.

## Snel lokaal bekijken
```powershell
cd C:\Users\pauwe\.gemini\antigravity\scratch\mk-style
python -m http.server 4321
```
Open daarna `http://localhost:4321` (en `http://localhost:4321/admin.html`).

## Gratis tijdelijke link (Mockup) & Productie Handoff
1. Push deze map naar een nieuwe GitHub-repository (bv. `mk-style-website`).
2. Koppel de repo gratis aan **Cloudflare Pages** (of **Vercel** / **Netlify**):
   - Je krijgt meteen een gratis deelbare mockup-link zoals `https://mk-style.pages.dev` die je via WhatsApp naar Murat kan sturen!
3. Wanneer Murat tevreden is: registreer **`mk38style.be`** (~€8–€12/jaar) en koppel het domein in 2 klikken aan Cloudflare Pages (gratis SSL-certificaat + wereldwijde CDN + €0/maand hostingkosten).
