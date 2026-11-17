# MK Style — testmatrix en acceptatieprotocol

**Dit document is een testplan, geen uitgevoerde audit.** Vermeld bij elk resultaat datum, toestel/browser, naam tester, bewijs, build/commit en eventuele issue.

## A. Basistests voor bezoekers
| ID | Scenario | Verwacht resultaat | Resultaat |
|---|---|---|---|
| WEB-01 | iPhone/Safari 375px | Geen overlap; contact/route bruikbaar | NIET GETEST |
| WEB-02 | Android/Chrome 360px | Layout leesbaar; contact/route bruikbaar | NIET GETEST |
| WEB-03 | Windows Chrome/Edge | Desktopnavigatie, prijzen, foto's kloppen | NIET GETEST |
| WEB-04 | Trage 4G / offline | Geen misleidende 'NU OPEN' bij ontbrekende actuele data | NIET GETEST |
| WEB-05 | Tijdzone België DST | Open-status, middagpauze en 'morgen' kloppen | NIET GETEST |
| WEB-06 | Eénmalige sluiting woensdag | Maakt niet alle woensdagen dicht | NIET GETEST |
| WEB-07 | Domeinroot + www | HTTPS, canonical redirect en geldige SSL | NIET GETEST |
| WEB-08 | Kaarten/telefoon/WhatsApp | Juiste locatie en correcte eigenaarstelefoon | NIET GETEST |
| WEB-09 | Fotos mobiel | Snel en legaal; juiste alt-teksten | NIET GETEST |

## B. Admin, autorisatie en AI
| ID | Scenario | Verwacht resultaat | Resultaat |
|---|---|---|---|
| ADM-01 | Zonder Cloudflare Access JWT direct /api/admin/config | 401 of veilige 503 vóór setup | NIET GETEST |
| ADM-02 | Verkeerd account, geldig JWT | 403 voor elke beheerrroute | NIET GETEST |
| ADM-03 | Verkeerde Origin voor PATCH/POST | 403, geen wijziging | NIET GETEST |
| ADM-04 | Prijs/uren met ongeldige input | 4xx, gegevens ongewijzigd | NIET GETEST |
| ADM-05 | Stale expectedVersion | 409 zonder audit-weesrecord | NIET GETEST |
| ADM-06 | AI opdracht 'volgende woensdag dicht' | Voorstel exact gedateerd; geen directe save | NIET GETEST |
| ADM-07 | Murat annuleert voorstel | Niets op de server veranderd | NIET GETEST |
| ADM-08 | Murat bevestigt voorstel | Database geüpdatet, versie++ en auditregel | NIET GETEST |
| ADM-09 | Andere bezoeker/telefoon na wijziging | Correcte gegevens binnen refresh-interval | NIET GETEST |
| ADM-10 | API/Gemini offline | Manueel beheer blijft werken; foutmelding klopt | NIET GETEST |
| ADM-11 | AI probeert andere velden te veranderen | JSON allowlist weigert wijziging | NIET GETEST |
| ADM-12 | Undo na gepubliceerde wijziging | Vorige inhoud hersteld en revisie gelogd | NIET GETEST |
| ADM-13 | AI daglimiet overschreden | 429 en geen extra externe AI-aanroep | NIET GETEST |
| ADM-14 | 2 tabbladen gelijktijdig PATCH | Eén slaagt, ander 409, geen onjuiste audit | NIET GETEST |
| ADM-15 | Sociaal concept | Kan gekopieerd worden, niet auto-gepubliceerd | NIET GETEST |

## C. SEO, performance en juridische basis
| ID | Scenario | Verwacht resultaat | Resultaat |
|---|---|---|---|
| SEO-01 | Canonical en Open Graph | Exact het klantdomein, foto werkt | NIET GETEST |
| SEO-02 | HairSalon JSON-LD | Gevalideerd tegen bevestigde bedrijfsfeiten | NIET GETEST |
| SEO-03 | Sitemap / robots | Public URLs indexeerbaar, admin niet | NIET GETEST |
| SEO-04 | Google Bedrijfsprofiel/Search Console | Eigenaarsrechten, consistente openingstijden | NIET GETEST |
| SEO-05 | Lighthouse mobiel | Rapport en voornaamste verbeteringen | NIET GETEST |
| LEG-01 | Bedrijfsinfo | Volledig en correct volgens toepasselijke eisen | NIET GETEST |
| LEG-02 | Cookie/analytics audit | Verwerkingsinventaris en toestemming indien nodig | NIET GETEST |
| LEG-03 | Rechten op foto's | Eigendom/toestemming schriftelijk bevestigd | NIET GETEST |

## D. Rollout en herstel
- [ ] Deploy preview, noteer preview-URL, controleren op geen gevoelig publiek adminverkeer.
- [ ] D1 staging schema en seed op basis van door Murat goedgekeurde gegevens.
- [ ] Test alle admin scenario's en directe API-auth.
- [ ] Backup via D1/SQL exports, daadwerkelijke restore in lege testdb.
- [ ] Productie vrijgeven pas na review en Murats goedkeuring.
- [ ] DNS root/www, TLS, cache en canonical verifiëren.
- [ ] 48-uurs nazorg, +7-dagen feedback, +30-dagen SEO-review plannen op werkelijke live-datum.

## Aftekenen
- **Technische oplevering:** [naam / datum / PR / build]
- **Juridisch/inhoudelijk:** [naam / datum / referenties]
- **Murat akkoord:** [moment en expliciete bevestiging]
