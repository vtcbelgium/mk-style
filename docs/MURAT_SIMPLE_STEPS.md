# MK Style (`mkstyle.be`) — Super Makkelijke Gids voor Murat

**Doel:** Murat heeft weinig ervaring met computers. Daarom doen wij al het technische werk, en vragen we Murat maar **1 kort telefoontje/koffiemoment van 3 minuten** (of **5 simpele klikken**) + 1 kort akkoord over de tekst en foto's.
**Veiligheidsregel:** Vraag **nooit** om Murats wachtwoord van OVHcloud of Gmail.

---

## Kant-en-klaar WhatsApp-bericht om nu naar Murat te sturen

```text
Hey Murat! Je nieuwe website voor MK Style staat helemaal klaar om getest te worden.
Je hoeft zelf niets technisch te kennen — we doen alles stap voor stap en je hoeft nergens een wachtwoord voor door te geven.

Als het voor jou past, stuur even een kort duimpje 👍 of antwoord op deze 2 dingetjes:

1) Klopt alles op de website?
   - De tekst "16+ jaar ervaring in Bilzen" en "gratis parkeren voor de deur"?
   - Mogen al die foto's (ook de jeugdfoto en foto met je eerste klant) op de site blijven staan?

2) Domein mkstyle.be koppelen (maar 2 minuten werk):
   Kies wat jij het makkelijkst vindt:
   - Optie A (makkelijkst): Ik bel je of spring even binnen met mijn laptop. Jij logt zelf 1 minuutje in bij OVHcloud op jouw scherm en ik wijs aan waar je 2 keer moet klikken. Klaar!
   - Optie B (als je het zelf wil aanklikken): Volg gewoon de 5 simpele stapjes hieronder — het is echt alleen kopiëren & plakken.

Na livegang pas je straks openingsuren, verlof of prijzen gewoon vanaf je gsm aan:
je gaat naar mkstyle.be/admin, vult je e-mail in (38mkstyle@gmail.com), krijgt een 6-cijferige code in je Gmail, klaar — geen extra wachtwoord te onthouden!
```

---

## Optie A — 3-minuten koffie/telefoontje (Aanbevolen!)
De allereenvoudigste route voor iemand met weinig computerervaring:
1. Murat opent zelf `ovh.com` en logt in op zijn eigen gsm/laptop (hij typt zelf zijn eigen login, niemand vraagt zijn wachtwoord).
2. Jeroen zegt exact waar te klikken (`Web Cloud` -> `Domain names` -> `mkstyle.be` -> `DNS servers` -> `Modify`).
3. Murat kopieert de twee regels uit WhatsApp:
   - **Regel 1:** `maya.ns.cloudflare.com`
   - **Regel 2:** `peter.ns.cloudflare.com`
4. Klik **Opslaan / Bevestigen**. **Klaar voor Murat.** De rest (SSL, website live zetten, monitoring en beheer instellen) regelt OTHRYS automatisch.

---

## Optie B — 5 simpele klikken (als Murat het alleen wil doen)

Je kan dit gerust als apart WhatsApp-berichtje sturen als Murat voor Optie B kiest:

```text
Super makkelijk — dit zijn de enige 5 stapjes bij OVHcloud:

1. Ga naar https://www.ovh.com/manager/ en log in op je eigen account.
2. Klik links op "Web Cloud" -> "Domain names" -> klik op "mkstyle.be".
3. Klik bovenaan op het tabblad "DNS servers" (of "DNS-servers").
4. Klik op "Modify DNS servers" / "DNS-servers wijzigen" en vervang wat er staat door deze 2 regels:
   Regel 1: maya.ns.cloudflare.com
   Regel 2: peter.ns.cloudflare.com
5. Klik op "Bevestigen / Opslaan" en stuur mij even "Klaar!" terug.

Als het scherm er anders uitziet of je twijfelt ergens over: stuur gewoon een fotootje van je scherm naar mij, dan help ik direct mee!
```

---

## Hoe werkt zijn dagelijks beheer straks? (Super simpel uit te leggen)
- Murat hoeft **geen nieuw wachtwoord** te onthouden en er is geen ingewikkelde app.
- Hij opent op zijn gsm of tablet **`https://mkstyle.be/admin`**.
- Hij krijgt automatisch een **6-cijferige inlogcode** toegestuurd op **`38mkstyle@gmail.com`**, typt die code over, en is binnen.
- Dan typt hij in gewoon Nederlands iets zoals:
  - *"Morgen woensdag gesloten wegens familiefeest"*
  - *"Jaarlijks verlof van 10 augustus tot en met 20 augustus"*
  - *"Herenknipbeurt wordt €27"*
- Hij ziet meteen een **duidelijk voorbeeld (voor & na)** en klikt pas op **Bevestigen** als het klopt. Ging er ooit iets mis? Één druk op **"Herstel vorige versie"** zet direct alles terug.
