# Verificatie onderzoeksformulier

## Onderbouwde versie - 30 september 2026

Instrument `v5-research-2`; beslissingen en bronnen staan in [Onderbouwing van de vragenlijst](questionnaire-evidence.md).

- 51 formuliertests en 6 dashboardtests slagen. Inclusief eerdere v4-versies, de bevroren `v5-research-1`-antwoordlijsten, nieuwe sectoren, uitsluitende antwoorden, routewissels en versiegescheiden dashboardaggregatie.
- Typecontrole en gerichte lintcontrole (`src tests`) slagen. Productiebuild met webpack slaagt via de WASM-fallback; Windows blokkeert de native SWC-module. Deze beveiligingsinstelling is niet gewijzigd.
- In de lokale browser is de werkende persoonlijke route met recente zoektocht tot de afsluiting doorlopen: nieuwe sectorlijst, drie afzonderlijke baanprioriteiten, geen afhaakreden, nog geen werkinformatie en bronvragen. Een vierde gewone prioriteit is niet selecteerbaar.
- De organisatieroute zonder recente wervingspoging is tot de afsluiting doorlopen: geen kanaal-/probleemvragen, wel een geldige keuze zonder functie voor ogen en zonder medewerkers in hun eerste dienstjaar.
- De nieuwe lange antwoordteksten zijn visueel op mobiel bekeken (375px viewportinstelling, 360px documentbreedte naast de scrollbar): geen horizontale overflow. Contactvelden verdwijnen bij Nee.
- Het lokale privédashboard leest Sheets succesvol, toont nul antwoorden voor de nieuwe versie en wisselt naar de oorspronkelijke vraagteksten bij de eerdere versie. Geen consolefouten of waarschuwingen gezien in de twee gecontroleerde browsertabs.
- Geen formulier verstuurd, geen testgegevens naar Google Sheets geschreven. API/opslagtests gebruiken gesimuleerde opslag. Geen deployment of commit uitgevoerd.

De eerder gemeten 28 browserasserties hieronder horen bij 29 september en zijn geen nieuwe volledige browserregressie voor deze versie. Nog geen cognitieve proefinvulling met deelnemers; vijf minuten is een niet opnieuw gemeten indicatie, geen gevalideerde invultijd.

## Historische controle - 29 september 2026

Datum: 29 september 2026. Lokaal getest; productie en bestaande onderzoeksrijen niet gewijzigd.

## Geautomatiseerde controles

- `npm test`: 49 tests geslaagd, inclusief routes, gegevensvalidatie, API, opslagadapter en tegenstrijdige zoekantwoorden.
- `npm run typecheck`: geslaagd.
- `npx eslint src tests`: geslaagd zonder fouten of waarschuwingen. Gegenereerde, genegeerde browserartefacten vallen buiten deze controle.
- `npx next build --webpack`: productiebuild geslaagd, inclusief statische pagina's, metadata-afbeeldingen en dynamische inzendroute.
- `git diff --check`: geen whitespacefouten. Git meldt alleen de bestaande LF/CRLF-conversie-instelling.

De tests gebruiken uitsluitend gesimuleerde opslag. Onder meer: beide oude v4-versies, aparte v5-kolommen, RAW-opslag, foutieve headers zonder overschrijven, verloren Google-antwoord na een geslaagde append, retry met dezelfde ID, verschillende deelnemers met identieke antwoorden, conflict bij gewijzigde inhoud en wachten op een nog lopende opslag.

## Browser

De echte lokale toepassing is met Chromium doorlopen op 1440/1280 pixels desktop en 375/320 pixels mobiel. Alle POST-verzoeken naar `/api/submissions` zijn onderschept: vier gesimuleerde verzoeken, geen echte Google Sheets-rijen.

28 browserasserties geslaagd bij de volledige hercontrole:

- Persoonlijke route met niet-werkende student, zonder recente zoektocht en zonder interviewcontact.
- Beide perspectieven met persoonlijk eerst, daarna volledige organisatieroute en vrijwillige contactgegevens.
- Organisatie eerst, zonder recente wervingspoging, tweede route beginnen en expliciet overslaan.
- Vereiste keuze geeft een zichtbare foutmelding en toetsenbordfocus; vierde prioriteit is niet selecteerbaar.
- Werkvragen verdwijnen bij niet werken; ontbrekende vacatureinformatie wordt niet gevraagd zonder recente zoektocht.
- Gebruikte en effectieve wervingskanalen blijven consistent wanneer keuzes veranderen.
- Ja naar Nee voor contact verwijdert contactvelden en de oude gegevens uit het verzoek.
- Gesimuleerde opslagfout houdt de deelnemer op het formulier. Opnieuw versturen behoudt de inzend-ID.
- Antwoordoverzicht bevat de verzonden antwoorden en verstuurt niet opnieuw.
- Tweede-routevolgorde, terugnavigatie, keuze om over te slaan en payload komen overeen.
- Geen horizontale overflow op de gecontroleerde mobiele breedtes, geen JavaScript-paginafouten of onverwachte consolefouten.

Aanvullend twee cookiecontroles: na Antwoorden bekijken en terug naar het bedankje blijft het koekje open en blijft de boodschap gelijk. Bestaande animatie en fortune-pool zijn niet gewijzigd.

Start, meervoudige keuzes, fouttoestand, contactscherm en bedankje zijn visueel bekeken. Browserartefacten staan lokaal in `output/playwright/` en worden niet meegecommit. Een initiële hydratatiewaarschuwing bleek veroorzaakt door Playwright dat tijdens het laden de caretstijl voor een screenshot veranderde; opnieuw getest met `caret: initial`, zonder de toepassing hiervoor aan te passen, leverde geen waarschuwing op.

## Deelmetadata

De laatste gerichte browsercontrole bevestigt dat de browsertitel, Open Graph- en Twitter-titel gelijk zijn aan de starttitel. Ook de native deelactie gebruikt de nieuwe tekst zonder de verwijderde interviewzin. De combinatie actief zoeken + geen zoektocht in twee jaar blokkeert doorgaan met foutfocus bij de zoekvraag. Na correctie verschijnen de ervaringsvragen weer. Dezelfde combinatie wordt server-side afgewezen.

Lokaal gecontroleerd: nieuwe titel/beschrijving, Open Graph website-type, Twitter large-image-kaart, beide PNG-routes bereikbaar met HTTP 200 en `image/png`, afmetingen 1200 x 627. De bewerkte cover is visueel gecontroleerd en bevat de beloning in plaats van het oude minutenaantal. In ontwikkelmodus verwijzen Next.js-bestandsafbeeldingen naar localhost; in de gegenereerde productie-HTML zijn beide absolute afbeeldings-URL's gecontroleerd op `https://werkonderzoek-screener.vercel.app`, met een nieuwe contenthash. Dit bevestigt de lokale build, niet een al uitgevoerde deployment.

## Niet bevestigd / resterend

- Geen echte schrijfactie met de Google-serviceaccountcredentials en geen productie-end-to-end-test. Het nieuwe tabblad wordt pas bij een echte inzending aangemaakt.
- Nog geen proefpersonen voor daadwerkelijke invultijd, uitval of begrijpelijkheid. De indicatie 5-10 minuten is nog niet met deelnemers gevalideerd.
- Geen iOS/Safari-test of volledige screenreader-audit; native formuliersemantiek, labels en foutfocus zijn wel gebruikt/gecontroleerd.
- Sheets read-plus-append is niet atomair tussen serverinstanties. Zeer gelijktijdige retries kunnen dubbel voorkomen; de inzend-ID maakt controle achteraf mogelijk.
- Deze controles bevestigen de lokale versie; de productie-deployment is niet afzonderlijk geverifieerd.

## Eigen antwoorden (30 september 2026)

Alle zichtbare inhoudelijke keuzevragen bieden een eigen antwoord. Gecontroleerd: verplichte toelichting en maximaal 200 tekens, parsing en letterlijke opslag, het verwijderen van verborgen toelichtingen, apart hergebruik van een eigen wervingskanaal en een eigen antwoord over de opbrengst, en een neutrale zoekcontext bij een afwijkend antwoord. De bestaande 56 kolommen en eerdere formulierversies blijven behouden.

54 formuliertests en 6 dashboardtests slagen. Typecheck en lint slagen; lint meldt vier bestaande waarschuwingen in lokale browserscripts. De productiebuild slaagt met Webpack. De standaard Turbopack-build wordt op deze computer geblokkeerd doordat Windows de native Next.js-bibliotheek niet toestaat.

In de lokale browser zijn de nieuwe dropdown-, radio- en checkboxtekstvelden en hun weergave gecontroleerd. Lege eigen antwoorden blokkeren doorgaan met een zichtbare foutmelding; ingevulde eigen antwoorden laten doorgaan toe. Geen echte inzending naar Google Sheets en geen publicatie uitgevoerd.

## Compacte sectorlijst (30 september 2026)

Instrument `v5-research-3` gebruikt in beide routes 12 sectoren plus Anders en onbekend. Alle actuele sectoren kunnen worden ingediend en opgeslagen. Alle gedetailleerde sectoren uit `v5-research-2` blijven met hun oorspronkelijke labels werken via parser, API en opslag; de drie versies blijven apart in het dashboard. De 56 opslagkolommen veranderen niet. Geen aparte optie Meerdere sectoren toegevoegd.

55 formuliertests en 6 dashboardtests slagen, evenals typecontrole, gerichte lintcontrole en de productiebuild met Webpack. In de lokale browser zijn de 14 opties en het vrije invulveld bij Anders gecontroleerd. Geen echte inzending, wijziging van bestaande onderzoeksrijen of publicatie uitgevoerd.

## Consistentiecontrole (30 september 2026)

Beide routes zijn nagelopen op vraagstelling, koppen, toelichtingen en vervolgvragen. Koppen gebruiken dezelfde stijl, vragen over organisatiegrootte zijn gelijk en herhaalde toelichtingen over de zoekperiode zijn verwijderd. De laatste zoektocht staat waar nodig in de vraag zelf. De vertrekreden verwijst expliciet naar vertrek binnen het eerste dienstjaar. Eigen antwoorden, antwoordcodes en opslagkolommen blijven behouden.

Persoonlijke zoekkanalen verschijnen pas na een geldige keuze over recent zoeken. Een regressietest controleert de zichtbaarheid en het verwijderen van achtergebleven antwoorden bij een leeggemaakte context. De schermteller verschijnt pas na de startpagina, zodat een onvolledige routekeuze geen onjuist totaal toont.

56 formuliertests en 6 dashboardtests slagen, evenals typecontrole, gerichte lintcontrole en de productiebuild met Webpack. In de lokale browser zijn beide routes samen tot de afsluiting doorlopen, inclusief eigen wervingskanalen, maximaal drie prioriteiten, vervolgvelden, terugnavigatie, overslaan van de tweede reeks en contactvelden bij Nee. Ook een student zonder werk en zonder recente zoektocht bereikt de afsluiting. Lange vragen en antwoordregels zijn visueel bekeken op 390 pixels breed, zonder horizontale overflow. Geen testinzending naar Google Sheets en geen publicatie uitgevoerd.
