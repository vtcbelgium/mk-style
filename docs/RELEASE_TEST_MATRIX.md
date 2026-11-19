# MK Style — testmatrix en acceptatieprotocol

**Status 19 november 2026:** geautomatiseerde tests, live Cloudflare Pages staging-smoke, Lighthouse-audits en een echte lokale D1-backup/restore-drill zijn uitgevoerd op branch `feat/production-readiness-2026-11` (`https://feat-production-readiness-20.mk-style.pages.dev/`). **Nog open voor livegang:** echte smartphone-/desktopbrowsertests, live Cloudflare Access-login (`38mkstyle@gmail.com`), OVHcloud DNS-omschakeling op `mkstyle.be`, en schriftelijk akkoord van Murat.

## A. Basistests voor bezoekers
| ID | Scenario | Verwacht resultaat | Resultaat |
|---|---|---|---|
| WEB-01 | iPhone/Safari 375px | Geen overlap; contact/route bruikbaar | NIET GETEST (nog op echte iPhone afvinken) |
| WEB-02 | Android/Chrome 360px | Layout leesbaar; contact/route bruikbaar | NIET GETEST (nog op echte Android afvinken; zie wel Lighthouse mobiel onder SEO-05) |
| WEB-03 | Windows Chrome/Edge | Desktopnavigatie, prijzen, foto's kloppen | DEELS (19/11/2026): headless Chrome desktop Lighthouse zonder consolefouten; handmatige visuele check nog open |
| WEB-04 | Trage 4G / offline | Geen misleidende 'NU OPEN' bij ontbrekende actuele data | NIET GETEST (nog op vertraagd netwerk testen) |
| WEB-05 | Tijdzone België DST | Open-status, middagpauze en 'morgen' kloppen | PASS (geautomatiseerd, 19/11/2026): `npm test` (`61/61`, `Europe/Brussels` DST/morgen) |
| WEB-06 | Eénmalige sluiting woensdag | Maakt niet alle woensdagen dicht | PASS (geautomatiseerd, 19/11/2026): `npm test` (`tests/site.test.mjs`, `tests/admin-db-flow.test.mjs`) |
| WEB-07 | Domeinroot + www | HTTPS, canonical redirect en geldige SSL | GEBLOKKEERD — DNS pending (`npm run domain:check` 19/11/2026 = `NXDOMAIN`) |
| WEB-08 | Kaarten/telefoon/WhatsApp | Juiste locatie en correcte eigenaarstelefoon | DEELS (19/11/2026): map click-to-load & links getest in `npm test`; wacht op bevestiging Murat |
| WEB-09 | Fotos mobiel | Snel en legaal; juiste alt-teksten | DEELS (19/11/2026): `width`/`height`/alt getest in `npm test`; fotorechten wachten op antwoord Murat |

## B. Admin, autorisatie en AI
| ID | Scenario | Verwacht resultaat | Resultaat |
|---|---|---|---|
| ADM-01 | Zonder Cloudflare Access JWT direct /api/admin/config | 401 of veilige 503 vóór setup | PASS staging + unit (19/11/2026): `npm run smoke:staging` geeft `503` op alle 5 `/api/admin/*` routes (`dcd3e92b`); prod 401/Access-redirect na setup |
| ADM-02 | Verkeerd account, geldig JWT | 403 voor elke beheerrroute | PASS unit (19/11/2026): `tests/preview-gate.test.mjs` (`403` wrong email, `401` wrong AUD); live Access-login nog OPEN |
| ADM-03 | Verkeerde Origin voor PATCH/POST | 403, geen wijziging | PASS unit (19/11/2026): `tests/admin-db-flow.test.mjs` (`403`); live test nog OPEN |
| ADM-04 | Prijs/uren met ongeldige input | 4xx, gegevens ongewijzigd | PASS unit (19/11/2026): `tests/site.test.mjs` & `tests/social-draft.test.mjs`; live UI-test nog OPEN |
| ADM-05 | Stale expectedVersion | 409 zonder audit-weesrecord | PASS unit (19/11/2026): `tests/admin-db-flow.test.mjs` (`409`); live test nog OPEN |
| ADM-06 | AI opdracht 'volgende woensdag dicht' | Voorstel exact gedateerd; geen directe save | PASS unit (19/11/2026): `tests/admin-holiday.test.mjs` & `tests/site.test.mjs`; live Gemini-aanroep nog OPEN |
| ADM-07 | Murat annuleert voorstel | Niets op de server veranderd | NIET GETEST live (wacht op live Access + Murat) |
| ADM-08 | Murat bevestigt voorstel | Database geüpdatet, versie++ en auditregel | PASS unit (19/11/2026): `tests/admin-db-flow.test.mjs`; live met Murat nog OPEN |
| ADM-09 | Andere bezoeker/telefoon na wijziging | Correcte gegevens binnen refresh-interval | NIET GETEST live |
| ADM-10 | API/Gemini offline | Manueel beheer blijft werken; foutmelding klopt | PASS unit (19/11/2026): `tests/admin-db-flow.test.mjs` (`503` zonder key, template blijft werken); live UI nog OPEN |
| ADM-11 | AI probeert andere velden te veranderen | JSON allowlist weigert wijziging | PASS unit (19/11/2026): `tests/site.test.mjs` (`unknown field never writable`); live Gemini nog OPEN |
| ADM-12 | Undo na gepubliceerde wijziging | Vorige inhoud hersteld en revisie gelogd | PASS unit + lokale D1 drill (19/11/2026): `tests/admin-db-flow.test.mjs` + lokale `v1->v2->v3` drill (`SHA256 v3 == v1`); live Access-undo nog OPEN |
| ADM-13 | AI daglimiet overschreden | 429 en geen extra externe AI-aanroep | NIET GETEST live |
| ADM-14 | 2 tabbladen gelijktijdig PATCH | Eén slaagt, ander 409, geen onjuiste audit | PASS unit op 409-pad (19/11/2026): `tests/admin-db-flow.test.mjs`; echte 2-tabbladtest nog OPEN |
| ADM-15 | Sociaal concept | Kan gekopieerd worden, niet auto-gepubliceerd | PASS unit (19/11/2026): `tests/social-draft.test.mjs` & `tests/admin-db-flow.test.mjs`; live UI nog OPEN |

## C. SEO, performance en juridische basis
| ID | Scenario | Verwacht resultaat | Resultaat |
|---|---|---|---|
| SEO-01 | Canonical en Open Graph | Exact het klantdomein, foto werkt | DEELS (19/11/2026): `npm test` (`tests/local-seo.test.mjs`) + `smoke:staging`; live `mkstyle.be`-check na DNS-cutover |
| SEO-02 | HairSalon JSON-LD | Gevalideerd tegen bevestigde bedrijfsfeiten | PASS op staging/dist (19/11/2026): `tests/local-seo.test.mjs`, `smoke:staging` en `agents.seo_authorship_barrier` (`4` pagina's, `0` findings) |
| SEO-03 | Sitemap / robots | Public URLs indexeerbaar, admin niet | PASS unit/dist (19/11/2026): `tests/local-seo.test.mjs` (`/privacy.html` in `sitemap.xml`, `/admin` geblokkeerd); live prodcheck na DNS |
| SEO-04 | Google Bedrijfsprofiel/Search Console | Eigenaarsrechten, consistente openingstijden | OPEN — wacht op reactie Murat (Place ID `ChIJu8aXT6XgwEcRyp23QzZ2j2A` gevonden; nog geen Search Console-verificatie zonder DNS) |
| SEO-05 | Lighthouse mobiel | Rapport en voornaamste verbeteringen | PASS staging (19/11/2026, `feat-production-readiness-20.mk-style.pages.dev`, Chrome headless): Mobiel Perf `99`, A11y `94`, Best Practices `100`, SEO `69` (`is-crawlable` bewust 0 door staging `X-Robots-Tag: noindex`), FCP `0.9s`, LCP `0.9s`, CLS `0`, TBT `0ms`, `0` third-party requests, `0` console errors; Desktop Perf `100`, A11y `94`, Best Practices `100`, SEO `69`, CLS `0.018`, `0` third-party requests, `0` console errors. Open A11y-punten: `color-contrast`, `heading-order`. Herhalen op `mkstyle.be` na livegang |
| LEG-01 | Bedrijfsinfo | Volledig en correct volgens toepasselijke eisen | PASS unit/staging (19/11/2026): `tests/legal-meta.test.mjs` & `smoke:staging` (`MK Style CommV.`, `1004.134.102`, `BE1004.134.102`); wacht op eindakkoord Murat |
| LEG-02 | Cookie/analytics audit | Verwerkingsinventaris en toestemming indien nodig | PASS staging (19/11/2026): `/privacy.html` `200 OK`, CSP `font-src 'self'`, Lighthouse `0` third-party requests bij laden; definitief na akkoord Murat |
| LEG-03 | Rechten op foto's | Eigendom/toestemming schriftelijk bevestigd | PASS (19/11/2026): schriftelijk akkoord eigenaar ("ok op alles") |

## D. Rollout en herstel
- [x] Deploy preview (`https://feat-production-readiness-20.mk-style.pages.dev/`, `dcd3e92b`), oud previewsecret `STAGING_ACCESS_PASSWORD` verwijderd, `npm run smoke:staging` geslaagd (`15` checks incl. `/privacy.html`, `outfit-latin.woff2`, CSP en alle 5 admin-API's fail-closed).
- [x] D1 staging (`mk-style-staging`) en productie (`mk-style-production`) geverifieerd in regio `eu` met identieke `config_json` SHA-256 (`7f5df0866e1bc860cf5f525ebdfb30e394e5b5f55abf3f8406aea2885d2a0991`); herhaal diff-check na eventuele tekstopmerkingen van Murat.
- [ ] Test alle live admin scenario's en directe API-auth met Cloudflare Access (`TEAM_DOMAIN`, `POLICY_AUD`, `ADMIN_EMAILS`).
- [x] Backup via `wrangler d1 export mk-style-staging --remote`, herstel in lege lokale D1 (`wrangler d1 execute mk-style-staging --local --persist-to ... --file=...`) en lokale rollback-drill `v1 -> v2 -> v3` (SHA-256 `v3 == v1`: `7f5df086...`, tijdelijke bestanden gewist) uitgevoerd op 19/11/2026.
- [x] Productie vrijgeven pas na review en Murats goedkeuring (akkoord bevestigd 19/11/2026).
- [ ] DNS root/www, TLS, cache, canonical en `npm run smoke:production` verifiëren na OVHcloud-delegatie.
- [ ] 48-uurs nazorg, +7-dagen feedback, +30-dagen SEO-review plannen op werkelijke live-datum.

## Aftekenen
- **Technische pre-launch (staging, Lighthouse, D1-restore):** uitgevoerd 19 november 2026 (`feat/production-readiness-2026-11`)
- **Juridisch/inhoudelijk:** [naam / datum / referenties — privacy & bedrijfsinfo goedgekeurd 19/11/2026]
- **Murat akkoord:** Bevestigd 19 november 2026 ("ok op alles" — teksten, foto's, privacy en geen extra betaaliconen)
