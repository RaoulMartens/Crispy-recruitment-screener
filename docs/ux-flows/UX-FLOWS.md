# Crispy onderzoeksformulier - UX-flows

Goedgekeurde use cases: [bron en correcties](use-cases.md). Goedkeuring door Raoul op 29 september 2026.

## Schermkaart

[Alle routes](diagrams/screen-map.md).

## Schermen en klikbare schets

[Open de schets](wireframes/start.html). [Scherminventaris, onderdelen en uitgaande links](wireframes/INDEX.md).

## Routes en toestanden

- uc-001: Perspectief kiezen - [Route](diagrams/uc-001/flow.md), [Toestanden](diagrams/uc-001/states.md), [Interactie](diagrams/uc-001/sequence.md)
- uc-002: Organisatievragen - [Route](diagrams/uc-002/flow.md), [Toestanden](diagrams/uc-002/states.md), [Interactie](diagrams/uc-002/sequence.md)
- uc-003: Eigen werk en studie - [Route](diagrams/uc-003/flow.md), [Toestanden](diagrams/uc-003/states.md), [Interactie](diagrams/uc-003/sequence.md)
- uc-004: Tweede perspectief - [Route](diagrams/uc-004/flow.md), [Toestanden](diagrams/uc-004/states.md), [Interactie](diagrams/uc-004/sequence.md)
- uc-005: Opslaan en vrijwillig contact - [Route](diagrams/uc-005/flow.md), [Toestanden](diagrams/uc-005/states.md), [Interactie](diagrams/uc-005/sequence.md)
- uc-006: Bedankje en antwoorden - [Route](diagrams/uc-006/flow.md), [Toestanden](diagrams/uc-006/states.md), [Interactie](diagrams/uc-006/sequence.md)

## Navigatie

Terug bewaart antwoorden binnen de huidige pagina. Onzichtbare vragen worden niet verstuurd. Een tweede perspectief is optioneel; de gezamenlijke afsluiting verschijnt eenmaal. Een begonnen tweede route kan expliciet worden overgeslagen. Bij beide routes komen drie inhoudelijke blokken bij. Alleen een bevestigde opslag opent het bedankje.

De statische schets toont alternatieven als links, zonder formulierstaat; de werkende toepassing bewaakt routevolgorde, voorwaarden en ingevulde antwoorden. De schets verandert de bestaande Poppins/Crispy-vormgeving niet.

## Open punten voor verificatie

Werkelijke invultijd meten met proefpersonen, geen onbewezen minutenaantal publiceren. Google Sheets heeft geen unieke-sleuteltransactie: persistente inzend-ID en proceslokale vergrendeling verminderen retries, maar gelijktijdige retries op verschillende serverinstanties blijven een expliciet te documenteren beperking. Een echte schrijfcontrole vereist apart akkoord zodat er geen testdata tussen onderzoeksreacties komt.

## Optionele ontwerptools

De aanvullende ontwerp- en PRD-skills zijn niet geinstalleerd. Installatie kan op verzoek, maar dit project gebruikt het aangeleverde document en bestaande vormgeving. De schetsen kunnen desgewenst naar Figma via Code to Canvas; daarvoor zijn de Figma-desktopapp en ingeschakelde Dev Mode MCP Server nodig. Er wordt nu niets geinstalleerd of naar Figma geexporteerd.

