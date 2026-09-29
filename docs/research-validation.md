# Verificatie onderzoeksformulier

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
