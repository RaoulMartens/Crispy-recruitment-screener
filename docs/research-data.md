# Datamodel onderzoeksformulier

Huidige versie: `v5-research-3` (30 september 2026). Vorige versies: `v5-research-1` en `v5-research-2`. Alle drie gebruiken `<prefix> v5 onderzoek`, met de versie in kolom D. Een regel is een bevestigde inzending, niet noodzakelijk een unieke persoon. Een herladen pagina begint een nieuwe sessie; er wordt geen apparaatidentiteit opgeslagen.

De onderstaande vraaginventaris en aanscherpingen van 29 september beschrijven de historische eerste v5-versie. Voor de actuele formuleringen, sectorindeling, antwoordkeuzes en interpretatie geldt [Onderbouwing van de vragenlijst](questionnaire-evidence.md). Analyseer beide versies apart: gelijke vraagcodes betekenen niet automatisch een gelijke vraaginhoud. Het privédashboard biedt daarvoor een versiekeuze.

## Historische vraaginventaris (v5-research-1)

Vraagcodes en antwoordwaarden zijn stabiele interne codes. De huidige Sheet schrijft leesbare labels en aparte Anders-kolommen. De labels van de Sheet-kolommen staan bewust los van de vraagtekst op het scherm: een tekstuele UI-verbetering mag opslag niet breken. Verander geen kolomvolgorde of inhoudelijke betekenis zonder nieuwe dataversie.

| Bron | Code | Vraag | Type |
|---|---|---|---|
| A1 | `employerLocation` | In welke plaats werk je voor deze organisatie? | text (optioneel) |
| A2 | `employerSector` | In welke sector werkt jullie organisatie? | select |
| A3 | `employerSize` | Hoeveel mensen werken er in de hele organisatie? | select |
| Toegevoegd | `employerInvolvement` | Ben je zelf betrokken bij werving, selectie of het aannemen van medewerkers? | choice |
| A4 | `employerFrequency` | Hoe vaak hebben jullie nieuwe medewerkers nodig? | select |
| A5 | `employerRecruiters` | Wie houdt zich bij jullie bezig met het vinden van nieuwe medewerkers? | multi |
| Toegevoegd | `employerRecentHiring` | Hebben jullie de afgelopen twee jaar geprobeerd nieuwe medewerkers te vinden? | choice |
| A6 | `employerChannels` | Welke manieren hebben jullie daarvoor gebruikt? | multi |
| A7 | `employerEffectiveChannels` | Welke van deze manieren leverden de meest geschikte kandidaten op? | multi |
| A8 | `employerBarriers` | Waar liepen jullie daarbij tegenaan? | multi |
| A9 | `employerPriorities` | Wat vinden jullie het belangrijkst bij een nieuwe medewerker? | multi; maximaal 3 |
| A10 | `employerEarlyDeparture` | Hebben jullie meegemaakt dat een nieuwe medewerker binnen een jaar weer vertrok? | choice |
| A10 vervolg | `employerDepartureReason` | Wat was volgens jou de belangrijkste reden? | select |
| B1 | `personalSituation` | Wat is je huidige situatie? | multi |
| Bestaand behouden | `personalHome` | Waar woon je? | text (optioneel) |
| B1a | `personalSector` | In welke sector werk je? | select |
| B1b | `personalSize` | Hoeveel mensen werken er in de hele organisatie? | select |
| B1c | `personalWorkplace` | In welke plaats werk je? | text (optioneel) |
| B1d (vervallen) | `personalTenure` | Niet meer gevraagd; opslagkolom blijft gereserveerd | niet actief |
| B2 | `personalOpenness` | Hoe sta je tegenover nieuw of ander werk? | choice |
| B3 | `personalRecentSearch` | Heb je de afgelopen twee jaar naar nieuw of ander werk gekeken? | choice |
| B4 | `personalChannels` | Waar heb je naar werk gezocht of rondgekeken? | multi |
| B5 | `personalPriorities` | Wat vind je het belangrijkst in een nieuwe baan? | multi; maximaal 3 |
| B6 | `personalBarriers` | Waardoor ben je afgehaakt bij een vacature of sollicitatie? | multi |
| B7 | `personalMissingInfo` | Welke informatie over het werk miste je tijdens je zoektocht? | multi |
| B8 | `personalChecks` | Wat heb je over werkgevers bekeken voordat je verder ging? | multi |
| B9 | `personalMismatch` | Heb je meegemaakt dat een baan anders bleek dan je vooraf dacht? | choice |
| B9 vervolg | `personalMismatchReason` | Wat was bij die baan het grootste verschil met je verwachtingen? | select |

C1 is `comment` (optioneel, maximaal 1500 tekens). C2 is `interviewConsent` (Ja/Nee, standaard Ja op verzoek). Alleen bij Ja: naam en e-mail verplicht, telefoon optioneel. Contactgegevens uit een eerdere Ja-keuze worden bij Nee gewist en niet verstuurd. Plaatsen zijn optioneel; Andere-toelichtingen zijn alleen bij de gekozen optie verplicht (maximaal 200 tekens).

## Routes en context van v5-research-1

- Organisatie, eigen werk/studie of beide zijn gelijkwaardige bijdragen; er is geen automatische selectie of regiofilter.
- `requestedPerspective` bewaart de oorspronkelijke keuze; `completedRoutes` bewaart de daadwerkelijk afgeronde routes in volgorde. Een gekozen maar overgeslagen tweede route is geen volledige Beide-respons.
- A6-A8 worden alleen gesteld na een wervingspoging in de afgelopen twee jaar. Bij Nee/onbekend blijven ze leeg; dat betekent niet dat er geen problemen zijn.
- A7 toont de bij A6 genoemde kanalen en biedt daarnaast een eigen antwoord. Ook geen verschil, nog geen geschikte kandidaten en onbekend zijn geldige exclusieve uitkomsten.
- B1 staat werken, zelfstandig werken en studeren naast elkaar toe. Niet werken kan samen met studeren, maar niet met een werkende keuze. B1a-B1c verschijnen alleen bij werkenden. B1d (duur huidig werk) is verwijderd; nieuwe inzendingen laten de bestaande kolom leeg zodat andere kolommen niet verschuiven.
- B3 onderscheidt actief zoeken, rondkijken en geen recente zoektocht. B4/B6/B8 zijn bij de eerste twee echte gerapporteerde ervaringen over twee jaar; bij de laatste zijn het verwachtingen. De context staat apart in kolom N.
- Actief zoeken bij B2 kan niet samen met geen recente zoektocht bij B3. De deelnemer moet deze tegenstrijdigheid corrigeren; de validatie geldt ook op de server. Eerder zoeken en nu niet meer openstaan blijft wel mogelijk.
- B7 wordt alleen gesteld bij actief zoeken of rondkijken in de afgelopen twee jaar. De vraag gaat over gemiste werkinformatie tijdens de zoektocht, ook via netwerk of direct contact. Geen vacatures bekeken is verwijderd; Eigenlijk niets en Weet ik niet blijven afzonderlijke antwoorden. Bij geen recente zoektocht blijft de vraag verborgen en worden eerdere antwoorden gewist.
- A10/B9 vervolgen alleen bij Ja en verwijzen naar de meest recente keer. Vertrekredenen zijn de inschatting van de respondent, geen bewezen oorzaak.
- Bij een gewijzigde context worden oude afhankelijke antwoorden verwijderd; verborgen velden worden niet verzonden en worden server-side afgewezen.

## Aangescherpte antwoordopties (29 september 2026)

- B2 heeft drie actuele situaties: actief zoeken, openstaan zonder actief zoeken en nu niet openstaan. De overlappende keuze `later` wordt niet meer aangeboden.
- B6 behoudt niet afgehaakt alleen bij eerdere zoekervaring. Geen van deze dingen (verwachting) en de algemene `not-applicable`-keuze vervallen; Anders met toelichting en onbekend blijven beschikbaar.
- B6 onderscheidt onduidelijke werkzaamheden, ontbrekend salaris, wachten op antwoord, veel rondes/opdrachten, tegenstrijdige communicatie en sfeer/omgang met concretere labels.
- B8 onderscheidt LinkedIn van andere social media en biedt geen aparte Niets-keuze meer; een afwijkend antwoord kan via Anders met toelichting.
- B7 is verbreed van bekeken vacatures naar de zoektocht. De bestaande opslagkolom heet om technische compatibiliteit nog Gemiste vacatureinformatie. Eerdere antwoorden op de vacaturegerichte formulering zijn niet zonder meer vergelijkbaar met deze bredere vraag.
- A10 vervolg laat de brede categorie `expectations` weg; concrete vertrekredenen en Anders blijven beschikbaar.
- A7 biedt geen verschil alleen bij meerdere gekozen kanalen, met expliciet wel geschikte kandidaten. Geen geschikte kandidaten en onbekend blijven aparte uitkomsten.
- De kolommen blijven ongewijzigd. Bestaande opgeslagen antwoorden worden niet herschreven. Eventuele eerdere testantwoorden met oude labels niet zonder controle samenvoegen met deze aangescherpte opties.

## Analyseafspraken

- Een lege cel kan betekenen: optioneel niet ingevuld, vraag overgeslagen of route niet ingevuld. Gebruik route- en contextkolommen om dit te onderscheiden. Zet lege cellen niet om naar Nee.
- Weet ik niet, niet van toepassing, niets/geen probleem en Nee zijn aparte uitkomsten.
- Meervoudige keuzes staan als leesbare labels gescheiden door `; `. De volgorde volgt de opties en is geen rangschikking. Bij A9/B5 zijn een tot drie keuzes toegestaan.
- Anders-tekst staat leesbaar als `Anders: ...` in de antwoordkolom. Waar al een aparte Anders-kolom bestond, blijft deze ook gevuld. De nieuw toegevoegde eigen antwoorden gebruiken de antwoordkolom zodat de bestaande 56 kolommen niet verschuiven. Vrije tekst kan leestekens bevatten; behandel deze tekst niet als een lijst met categorieen.
- Bij B6 en B8 hebben sommige identieke categorieen een andere betekenis per zoekcontext. Vergelijk gerapporteerd gedrag en intenties niet zonder die splitsing.
- Oud v4 en nieuw v5 zijn verschillende meetinstrumenten. Voeg drie-maandsvragen uit v4 niet samen met twee-jaarsvragen uit v5.
- Deze open werving levert patronen binnen de bereikte groep op, geen representatieve percentages over alle werkgevers of werkenden. Interviews verdiepen opvallende antwoorden met concrete situaties.
- Er wordt geen anonimiteit gegarandeerd voor open antwoorden. Vraag daarom geen namen van collega's/kandidaten. Toegang en bewaartermijn volgen de zichtbare privacyuitleg.

## Sheet-kolommen

56 kolommen: A t/m BD. RAW-opslag voorkomt dat vrije tekst als spreadsheetformule wordt uitgevoerd.

| Kolom | Betekenis |
|---|---|
| A | Inzend-ID |
| B | Inhoudsvingerafdruk |
| C | Ingezonden op |
| D | Formulierversie |
| E | Gekozen perspectief |
| F | Ingevulde routes |
| G | Eerste route |
| H | Toestemming interviewcontact |
| I | Toestemming op |
| J | Naam |
| K | E-mailadres |
| L | Telefoonnummer |
| M | Aanvulling |
| N | Zoekcontext (ervaring of verwachting) |
| O | employerLocation: Werkplaats |
| P | employerSector: Sector organisatie |
| Q | employerSector: Anders |
| R | employerSize: Grootte hele organisatie |
| S | employerInvolvement: Eigen betrokkenheid werving |
| T | employerFrequency: Frequentie personeelsbehoefte |
| U | employerRecruiters: Wie werft |
| V | employerRecruiters: Anders |
| W | employerRecentHiring: Wervingspoging afgelopen twee jaar |
| X | employerChannels: Gebruikte wervingskanalen |
| Y | employerChannels: Anders |
| Z | employerEffectiveChannels: Meest geschikte kandidaten via |
| AA | employerBarriers: Ervaren wervingsproblemen |
| AB | employerBarriers: Anders |
| AC | employerPriorities: Prioriteiten nieuwe medewerker |
| AD | employerPriorities: Anders |
| AE | employerEarlyDeparture: Vertrek binnen een jaar meegemaakt |
| AF | employerDepartureReason: Belangrijkste gemelde vertrekreden |
| AG | employerDepartureReason: Anders |
| AH | personalSituation: Huidige situatie |
| AI | personalSituation: Anders |
| AJ | personalHome: Woonplaats |
| AK | personalSector: Sector huidig werk |
| AL | personalSector: Anders |
| AM | personalSize: Grootte hele organisatie huidig werk |
| AN | personalWorkplace: Werkplaats huidig werk |
| AO | personalTenure: Duur huidig werk |
| AP | personalOpenness: Openstaan voor ander werk |
| AQ | personalRecentSearch: Zoekervaring afgelopen twee jaar |
| AR | personalChannels: Zoekkanalen ervaring of verwachting |
| AS | personalChannels: Anders |
| AT | personalPriorities: Prioriteiten nieuwe baan |
| AU | personalPriorities: Anders |
| AV | personalBarriers: Afhaakredenen ervaring of verwachting |
| AW | personalBarriers: Anders |
| AX | personalMissingInfo: Gemiste vacatureinformatie |
| AY | personalMissingInfo: Anders |
| AZ | personalChecks: Werkgeverscheck ervaring of verwachting |
| BA | personalChecks: Anders |
| BB | personalMismatch: Afwijkende baanverwachting meegemaakt |
| BC | personalMismatchReason: Belangrijkste verschil met verwachting |
| BD | personalMismatchReason: Anders |

## Opslag en overgang

De inzend-ID is een willekeurige UUID per formulierinzending. De SHA-256-inhoudsvingerafdruk hoort bij de genormaliseerde payload en is geen anonimiseringsgarantie. Het tijdstip is servertijd in ISO/UTC. De toestemmingsdatum blijft leeg bij Nee.

De server accepteert ook de twee bestaande v4-versies en schrijft die ongewijzigd naar het oude v4-tabblad. Oude rijen en kopteksten worden niet omgezet. Het nieuwe tabblad wordt pas bij de eerste echte v5-inzending aangemaakt. Afwijkende kopteksten blokkeren de inzending met een foutmelding in plaats van bestaande data te overschrijven.

Vanaf 30 september accepteert de server daarnaast beide v5-versies met hun eigen antwoordlijsten, validatie en opslaglabels. Nog geopende eerdere formulieren blijven werken. De 56 kolommen veranderen niet; eerdere rijen worden niet herschreven. Zet bij een rollback niet alleen een oude server terug die `v5-research-2` nog niet kent.

De compacte sectorlijst krijgt `v5-research-3`: 12 sectoren plus Anders en onbekend, voor beide routes. `v5-research-2` blijft zijn 18 gedetailleerde sectoren accepteren en met de oorspronkelijke labels opslaan. Nieuwe samengevoegde categorieen gebruiken eigen codes. De opslagkolommen blijven gelijk en het dashboard toont de drie versies afzonderlijk. Bewaar bij een rollback ook de serverondersteuning voor versie 3.

In de huidige versie bieden alle zichtbare inhoudelijke keuzevragen `Anders, namelijk` met een verplicht eigen antwoord van maximaal 200 tekens. Routekeuzes en interviewtoestemming houden vaste opties. A7 bewaart een eigen toelichting los van het hergebruikte antwoord van A6. Een eigen antwoord bij B3 wordt opgeslagen als `Niet ingedeeld: eigen antwoord`; de vervolgvragen blijven neutraal over ervaring of verwachting. Een gewijzigd zoekcontextantwoord wist eerdere afhankelijke antwoorden.

Retrybescherming werkt per inzend-ID en controleert die ID opnieuw in Sheets. Dezelfde ID met gewijzigde inhoud geeft een conflict. Sheets biedt geen atomaire unieke sleutel: simultane retries op verschillende serverinstanties kunnen nog een dubbele rij veroorzaken. Gebruik de ID voor controle bij analyse; verschillende deelnemers met identieke antwoorden houden verschillende ID's.

Zie [README](../README.md) voor configuratie, veilige terugkeer naar een eerdere interface en verificatiebeperkingen.

