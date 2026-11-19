# MK Style — testmatrix en acceptatieprotocol

**Status 19 november 2026 — `v0.1.0` Official Launch (`https://mkstyle.be/`):** Website, EU D1 (`mk-style-production`, `version: 1`), Cloudflare Zero Trust Access (`MK Style Owner Admin`), 3-laags Admin AI (`nl-parser.js` + Cloudflare Workers AI `env.AI` + optionele fallback), edge-beveiliging en 5-minuten T590 monitoring staan live in productie (`66/66` geautomatiseerde tests, Lighthouse `100/100/100/100` Mobile & Desktop, beide SEO-barrières `PASS`, `npm run smoke:production` `PASS`, non-destructieve live AI-tests A/B/C `PASS`). **Nog open als post-launch opvolging:** echte iPhone/Android-check ter plaatse, gecontroleerde 4G-test, eerste live publicatie + undo door Murat zelf, Google Bedrijfsprofiel / Search Console eigenaarsverificatie en +48u/+7d/+30d nazorg.

## A. Basistests voor bezoekers
| ID | Scenario | Verwacht resultaat | Resultaat |
|---|---|---|---|
| WEB-01 | iPhone/Safari 375px | Geen overlap; contact/route bruikbaar | NIET GETEST (fysieke iPhone spot-check open als post-launch) |
| WEB-02 | Android/Chrome 360px | Layout leesbaar; contact/route bruikbaar | NIET GETEST (fysieke Android spot-check open; Lighthouse mobiel 100/100/100/100 onder SEO-05) |
| WEB-03 | Windows Chrome/Edge | Desktopnavigatie, prijzen, foto's kloppen | PASS basis (19/11/2026): headless Chrome desktop + `https://mkstyle.be/` visuele inspectie zonder consolefouten; 18/18 publieke links/assets `HTTP 200` |
| WEB-04 | Trage 4G / offline | Geen misleidende 'NU OPEN' bij ontbrekende actuele data | NIET GETEST (vertraagd 4G-netwerk nog afvinken) |
| WEB-05 | Tijdzone België DST | Open-status, middagpauze en 'morgen' kloppen | PASS (geautomatiseerd, 19/11/2026): `npm test` (`66/66`, `Europe/Brussels` DST/morgen + `resolveDutchDate`) |
| WEB-06 | Eénmalige sluiting woensdag | Maakt niet alle woensdagen dicht | PASS (geautomatiseerd, 19/11/2026): `npm test` (`tests/site.test.mjs`, `tests/admin-db-flow.test.mjs`, `tests/ai-optimizer.test.mjs`) |
| WEB-07 | Domeinroot + www | HTTPS, canonical redirect en geldige SSL | PASS prod (19/11/2026): `https://mkstyle.be/` `200` TLS Google Trust Services (`WE1`, 89d) + HSTS `1y` + `http://`/`https://www.` `301 -> https://mkstyle.be/` |
| WEB-08 | Kaarten/telefoon/WhatsApp | Juiste locatie en correcte eigenaarstelefoon | PASS inhoudelijk (19/11/2026): map click-to-load & links getest in `npm test`, telefoon/adres door Murat bevestigd |
| WEB-09 | Fotos mobiel | Snel en legaal; juiste alt-teksten | PASS (19/11/2026): `width`/`height`/alt getest in `npm test`, eigenaar bevestigde rechten ("ok op alles") |

## B. Admin, autorisatie en AI
| ID | Scenario | Verwacht resultaat | Resultaat |
|---|---|---|---|
| ADM-01 | Zonder Cloudflare Access JWT direct /api/admin/config | 401 of veilige 503 vóór setup | PASS prod (19/11/2026): alle 9 routes (`/admin`, `/admin/`, `/admin.html`, `/api/admin/*`) geven `302` Access-login redirect zonder sessie |
| ADM-02 | Verkeerd account, geldig JWT | 403 voor elke beheerrroute | PASS unit (19/11/2026): `tests/preview-gate.test.mjs` (`403` wrong email, `401` wrong AUD) |
| ADM-03 | Verkeerde Origin voor PATCH/POST | 403, geen wijziging | PASS unit (19/11/2026): `tests/admin-db-flow.test.mjs` (`403`) |
| ADM-04 | Prijs/uren met ongeldige input | 4xx, gegevens ongewijzigd | PASS unit (19/11/2026): `tests/site.test.mjs` & `tests/social-draft.test.mjs` |
| ADM-05 | Stale expectedVersion | 409 zonder audit-weesrecord | PASS unit (19/11/2026): `tests/admin-db-flow.test.mjs` (`409`) |
| ADM-06 | AI opdracht 'morgen gesloten' / melding | Voorstel exact gedateerd; geen directe save | PASS prod non-destructief (19/11/2026): `Morgen gesloten wegens familiedag` -> `2026-11-20` (`Snelle parser`, `200`) & banner-opdracht -> Cloudflare Workers AI (`mistral-small-3.1-24b-instruct`, `200`) |
| ADM-07 | Beheerder annuleert voorstel | Niets op de server veranderd | PASS prod live (19/11/2026): beide AI-voorstellen geannuleerd; live D1 bleef ongewijzigd op `version: 1` en `site_revisions: 0` |
| ADM-08 | Murat bevestigt voorstel | Database geüpdatet, versie++ en auditregel | PASS unit (19/11/2026): `tests/admin-db-flow.test.mjs`; eerste live mutatie door Murat zelf gepland in post-launch check |
| ADM-09 | Andere bezoeker/telefoon na wijziging | Correcte gegevens binnen refresh-interval | OPEN voor post-launch na eerste live mutatie |
| ADM-10 | AI offline / zonder sleutel | Manueel beheer blijft werken; fallback/foutmelding klopt | PASS unit (19/11/2026): `tests/admin-db-flow.test.mjs` & `tests/ai-optimizer.test.mjs` (lokale `nl-parser.js` werkt altijd zonder AI-quotum) |
| ADM-11 | AI probeert andere velden te veranderen | JSON allowlist weigert wijziging | PASS unit (19/11/2026): `tests/site.test.mjs` (`unknown field never writable`) & `tests/ai-optimizer.test.mjs` |
| ADM-12 | Undo na gepubliceerde wijziging | Vorige inhoud hersteld en revisie gelogd | PASS unit + lokale D1 drill (19/11/2026): `tests/admin-db-flow.test.mjs` + lokale `v1->v2->v3` drill (`SHA256 v3 == v1`) |
| ADM-13 | AI daglimiet overschreden | 429 en geen extra externe AI-aanroep | PASS mechanisme in `propose.js` & `social-draft.js` (`25/day` in `ai_daily_usage`); live D1 gebruikt `4/25` tijdens admin-test |
| ADM-14 | 2 tabbladen gelijktijdig PATCH | Eén slaagt, ander 409, geen onjuiste audit | PASS unit op 409-pad (19/11/2026): `tests/admin-db-flow.test.mjs` |
| ADM-15 | Sociaal concept | Kan gekopieerd worden, niet auto-gepubliceerd | PASS prod live (19/11/2026): `✨ Verfijn met AI` (`POST /api/admin/social-draft` `200`, `cloudflare-ai`, `posted: false`, status `(cloudflare-ai). Nog niet geplaatst.`) |

## C. SEO, performance en juridische basis
| ID | Scenario | Verwacht resultaat | Resultaat |
|---|---|---|---|
| SEO-01 | Canonical en Open Graph | Exact het klantdomein, foto werkt | PASS prod (19/11/2026): `canonical=https://mkstyle.be/`, `og:url`, `og:image`, `twitter:image` allen `200 OK` |
| SEO-02 | HairSalon JSON-LD | Gevalideerd tegen bevestigde bedrijfsfeiten | PASS prod & build (19/11/2026): `tests/local-seo.test.mjs`, `smoke:production`, beide SEO People-First Barriers `PASS (0 findings)`, alle JSON-LD URLs `200` |
| SEO-03 | Sitemap / robots | Public URLs indexeerbaar, admin niet | PASS prod (19/11/2026): `/robots.txt` & `/sitemap.xml` `200`, `/admin*` geblokkeerd in robots + `X-Robots-Tag: noindex, nofollow` |
| SEO-04 | Google Bedrijfsprofiel/Search Console | Eigenaarsrechten, consistente openingstijden | OPEN post-launch — wacht op eigenaarsverificatie Murat (Place ID `ChIJu8aXT6XgwEcRyp23QzZ2j2A` gekoppeld in JSON-LD) |
| SEO-05 | Lighthouse mobiel & desktop | Rapport en score na livegang | PASS prod `mkstyle.be` (19/11/2026): **100 / 100 / 100 / 100** (Performance, Accessibility, Best Practices, SEO) op zowel Mobiel als Desktop |
| LEG-01 | Bedrijfsinfo | Volledig en correct volgens toepasselijke eisen | PASS prod (19/11/2026): `MK Style CommV.`, `1004.134.102`, `BE1004.134.102`, door eigenaar bevestigd |
| LEG-02 | Cookie/analytics audit | Verwerkingsinventaris en toestemming indien nodig | PASS prod (19/11/2026): `/privacy` `200 OK` (bijgewerkt voor lokale parser + Cloudflare Workers AI), CSP `font-src 'self'`, `0` third-party trackers |
| LEG-03 | Rechten op foto's | Eigendom/toestemming schriftelijk bevestigd | PASS (19/11/2026): schriftelijk akkoord eigenaar ("ok op alles") |

## D. Rollout en herstel (`v0.1.0`)
- [x] Productie-deploy `v0.1.0` op **Cloudflare Pages** (`https://mkstyle.be/`) + `npm run smoke:production` PASS (`0` fouten).
- [x] D1 staging (`mk-style-staging`) en productie (`mk-style-production`) actief in regio `eu`; initiële live configuratie `version: 1` gecontroleerd + koude SQL/Git-backups veiliggesteld.
- [x] Cloudflare Zero Trust Access (`TEAM_DOMAIN`, `POLICY_AUD`, `ADMIN_EMAILS`) live geactiveerd en alle 9 adminroutes + non-destructieve live AI-tests (A/B/C) geverifieerd met `Cache-Control: no-store` op `admin-v2.js`.
- [x] Backup via `wrangler d1 export` + lokale D1 herstel- en rollback-drill (`v1 -> v2 -> v3`, `SHA256 v3 == v1`) uitgevoerd en koud backuppakket aangemaakt.
- [x] Productie vrijgegeven met Murats schriftelijke goedkeuring (19/11/2026) en welkom-/handleiding-PDF geleverd.
- [x] DNS root/www, TLS (`WE1`, 89d), null-sender e-mailbeveiliging (`SPF`/`DMARC`/`DKIM`), cacheheaders, canonical en OTHRYS T590 5-minuten monitoring actief.
- [ ] Post-launch opvolging: +48u stabiliteitscheck, fysieke smartphone- & Murat-mutatietest, Google Business Profile / Search Console verificatie, +7-dagen feedback en +30-dagen SEO-review.

## Aftekenen
- **Technische release (`v0.1.0`):** `vtcbelgium/mk-style` — live op `https://mkstyle.be/` (19 november 2026)
- **Juridisch/inhoudelijk:** `MK Style CommV.` / `BE1004.134.102` + `/privacy` live (19 november 2026)
- **Eigenaar akkoord:** Bevestigd 19 november 2026 ("ok op alles" — teksten, foto's, privacy, welkomsthandleiding en livegang)
