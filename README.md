# Crispy onderzoeksformulier

Een Next.js-formulier voor het afstudeeronderzoek naar werk en personeel vinden. Iedere inzending levert onderzoeksinput op; een verdiepend interview is vrijwillig. Het formulier sluit niemand automatisch uit.

## Lokaal draaien

Node.js 22 of nieuwer:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. De bestaande Crispy-vormgeving, deelknoppen en het gelukskoekje blijven behouden.

## Routes

- Start: doel, vrijwilligheid en perspectief (organisatie, eigen werk/studie, beide).
- Organisatie: drie blokken voor context, personeel vinden, keuzes/ervaringen.
- Persoonlijk: drie blokken voor situatie, werk vinden, keuzes/ervaringen.
- Beide: kies de eerste route; na afloop is de tweede optioneel. Ook een begonnen tweede route kan expliciet worden overgeslagen. Slechts complete, gekozen routes worden verzonden.
- Gezamenlijke afsluiting: optionele aanvulling, Ja/Nee voor interviewcontact. Alleen Ja vraagt naam/e-mail en biedt een optioneel telefoonnummer. Bij Nee worden eerder ingevoerde contactgegevens gewist en nooit verzonden.
- Versturen slaat de onderzoeksantwoorden op bij zowel Ja als Nee. Alleen na bevestigde opslag verschijnen het bedankje, gelukskoekje en read-only antwoordoverzicht.

Geen tussentijdse opslag of opslag van antwoorden in localStorage. Antwoorden blijven bij fouten binnen de huidige pagina behouden; herladen sluit die invoersessie af. De inzend-ID blijft gelijk bij opnieuw proberen. Na een onzekere opslag en gewijzigde antwoorden kan een conflictmelding verschijnen: een al ontvangen inzending wordt nooit stilzwijgend overschreven.

Het uitklapblok met uitgebreide privacyuitleg is op verzoek verwijderd. Bij de afsluiting blijft de korte uitleg over het delen van antwoorden en optioneel contact staan. De bestaande afspraken over toegang voor Crispy/HAN en zes maanden bewaren zijn hiermee niet gewijzigd, maar worden niet meer in dat blok getoond. De toepassing voert geen automatische bewaartermijnverwijdering uit; beheer daarvan blijft bij de onderzoeker.

De vragen scheiden actuele gerapporteerde ervaring (afgelopen twee jaar) van hypothetisch zoekgedrag. Geen ervaring, onbekend, geen probleem en een overgeslagen vraag zijn verschillende uitkomsten. Maximaal-drie-keuzes, exclusieve antwoorden en Andere-toelichtingen worden ook server-side gecontroleerd. De oude belofte van 1-2 minuten is verwijderd; een nieuwe tijdsinschatting vereist een praktijktest.

[UX-flows en klikbare routeschets](docs/ux-flows/UX-FLOWS.md) · [Goedgekeurde inhoudelijke correcties](docs/ux-flows/use-cases.md) · [Datamodel](docs/research-data.md)

## Code

- `src/lib/screener/research-questions.ts`: vraagdefinities, opties, voorwaarden, contextafhankelijke formuleringen.
- `src/lib/screener/research.ts`: navigatie, validatie, genormaliseerde inzending en strikte serverparser.
- `src/components/screener/screener.tsx`: formulier en bevestigde antwoordweergave.
- `src/lib/screener/research-storage.ts`: versie-afhankelijk tabblad/kolommen en leesbare Sheet-waarden.
- `src/lib/screener/submit-handler.ts`: testbare API-afhandeling en proceslokale bescherming tegen dubbele verzoeken.
- `src/lib/screener/sheets-writer.ts`: Google Sheets-adapter, headercontrole en persistente ID-controle.
- `src/lib/screener/steps.ts` en `submission-storage.ts`: ongewijzigd v4-contract voor reeds geopende oude formulieren en hun tests.
- `src/lib/screener/fortunes.ts`: cookieberichten, ongewijzigd.

## Google Sheets

Alleen de server gebruikt:

- `GOOGLE_SHEETS_SPREADSHEET_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
- optioneel `GOOGLE_SHEETS_SHEET_NAME` (standaard: Submissions)

Geef het serviceaccount schrijftoegang en schakel de Google Sheets API in. Nooit credentials via `NEXT_PUBLIC_*` beschikbaar stellen.

De huidige versie `v5-research-3` schrijft naar **<prefix> v5 onderzoek**, met 12 herkenbare sectoren plus Anders en onbekend. Nog geopende `v5-research-1`- en `v5-research-2`-formulieren blijven geldig met hun oorspronkelijke opties en opslaglabels. Het tabblad, voldoende kolommen en de header worden bij de eerste echte inzending aangemaakt. Onverwachte bestaande headers blokkeren de inzending; onderzoeksgegevens worden niet overschreven. Er is geen productie-sheet gewijzigd tijdens de lokale bouw.

`v4-employers-3` en `v4-minimal-2` blijven geldig en gebruiken **<prefix> v4 compact**, met hun oorspronkelijke kolombetekenis. De bestaande append-only overgang van 16/17 naar 19 v4-kolommen blijft ondersteund. Oude drie-maandenantwoorden worden niet als twee-jaar-antwoorden behandeld.

Tekst gaat naar Sheets met `valueInputOption: RAW`, voor behoud van telefoonnummers/nultekens en zonder formule-uitvoering. De nieuwe kolommen bevatten ID, inhoudsvingerafdruk, versie, tijd, gekozen perspectief, daadwerkelijk ingevulde routes, vraagcontext, interviewkeuze, alleen toegestane contactgegevens en vraagantwoorden.

### Herhaalverzoeken en beperkingen

- Twee deelnemers met dezelfde antwoorden hebben verschillende UUID's en worden apart opgeslagen.
- Gelijktijdige verzoeken met dezelfde ID binnen een serverinstantie wachten op dezelfde echte opslag.
- Na een verloren antwoord van Google wordt de ID in Sheets gecontroleerd voordat opnieuw wordt geschreven. De inhoudsvingerafdruk voorkomt dat een andere payload onder een bestaande ID als opgeslagen wordt bevestigd (HTTP 409).
- Sheets biedt hier **geen atomaire unieke sleutel**. Twee gelijktijdige verzoeken voor dezelfde ID op verschillende serverinstanties kunnen nog steeds beide lezen en schrijven. De inzend-ID blijft beschikbaar om zulke zeldzame dubbelingen bij analyse te herkennen. Dit is geen garantie op exactly-once.
- Google Sheets-credentials, productietoegang en een echte schrijfactie worden niet geverifieerd met de geautomatiseerde lokale tests.

### Terugdraaien

Zet desgewenst de oude interface terug, maar behoud tijdelijk beide serverparsers en schrijvers voor reeds geopende v5-formulieren. Laat beide tabbladen intact. Geen historische kolommen hernoemen, migreren of verwijderen.

## Controleren

```sh
npm test
npm run typecheck
npm run lint
npx next build --webpack
```

Unit- en integratietests gebruiken een gesimuleerde opslagadapter, inclusief mislukte opslag, retries, ID-conflict, nieuwe tabbladen en v4-compatibiliteit. Browsercontroles onderscheppen alle `/api/submissions`-verzoeken zodat ze geen echte onderzoeksrijen aanmaken. Tijdelijke browserartefacten staan in de genegeerde map `output/playwright/`.

[Uitgevoerde controles en resterende beperkingen](docs/research-validation.md).

## Delen en publiceren

Titel en beschrijving staan in `src/app/layout.tsx`; de Open Graph- en Twitter-afbeeldingen zijn `src/app/opengraph-image.png` en `src/app/twitter-image.png` (1200 x 627). De nieuwe afbeelding noemt het digitale gelukskoekje in plaats van een onbewezen invultijd. [Bewerkingsnotitie](docs/share-image.md).

De Vercel-projectroot is deze repositorymap. Lokaal aanpassen is geen publicatie. Commit/push en controle van de daadwerkelijke Vercel-deployment gebeuren alleen op verzoek. Gebruik dezelfde serverconfiguratie in Vercel; reeds bestaande Sheets-tabbladen blijven behouden.
