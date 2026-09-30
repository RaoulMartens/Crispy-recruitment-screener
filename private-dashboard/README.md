# Privé-resultaten

Los lokaal dashboard voor Raoul. De publieke vragenlijst en de spreadsheet worden niet gewijzigd. Alleen `127.0.0.1:3100` luistert; gegevens vereisen een willekeurige sessiesleutel. Geen openbare deployment of Google-login nodig. Niet geschikt om zonder extra authenticatie online te zetten.

Start vanuit deze map met `npm start` of gebruik `start.ps1`. Open de persoonlijke startlink uit de terminal. De sleutel wordt alleen voor deze lokale sessie gemaakt; na herstart krijg je een nieuwe link. De server blijft aan zolang de terminal draait.

Het dashboard gebruikt de bestaande dependencies en de Sheets-configuratie uit de `.env.local` van de vragenlijst. De Google-toegang is alleen-lezen. De browser krijgt geen Google-sleutel, naam, e-mail of telefoonnummer van deelnemers. Open teksten kunnen door deelnemers zelf herkenbare gegevens bevatten.

Het tabblad `v5 onderzoek` wordt gelezen. De versiekeuze toont `v5-research-3` (compacte sectorlijst), `v5-research-2` (uitgebreide sectorlijst) en `v5-research-1` apart, elk met de eigen vragen en antwoordlabels. Standaard zie je de nieuwe versie, ook wanneer die nog nul antwoorden heeft. Oudere v4-vragenlijsten blijven in Sheets; versies worden niet samengevoegd. Gegevens verversen elke minuut (30 seconden servercache). Grafieken tellen per inzending die de vraag heeft beantwoord. Niet gestelde en lege antwoorden zijn geen negatieve antwoorden. Inzendingen met beide routes tellen in beide routes, maar slechts eenmaal in het totaal.

Test met `npm test`. Alle testgegevens zijn fictief en worden niet in Sheets geschreven.
