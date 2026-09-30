---
name: Crispy onderzoeksresultaten
description: Privé-werkblad voor onderzoeksantwoorden
colors:
  ink: "#111225"
  muted: "#595d69"
  line: "#d7dcdf"
  accent: "#187b77"
  soft: "#e4f4f2"
  paper: "#fcfcfa"
typography:
  heading:
    fontFamily: "Poppins, sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Poppins, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  control: "5px"
  surface: "6px"
spacing:
  compact: "16px"
  normal: "24px"
  generous: "36px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "9px 17px"
---

# Design System: Crispy onderzoeksresultaten

## Overview

Leesbare, rustige werkinterface die de bestaande Crispy-identiteit volgt. Geen marketingpagina of nieuwe visuele wereld.

## Colors

Ink voor tekst en geselecteerde bediening; teal voor de antwoordbalken en focus. Wit als inhoudsvlak, een tweede neutrale laag voor filters.

## Typography

Poppins met vaste schaal: hoofdtitel, vraag, sectietitel, body en kleine contextlabels. Tabulaire cijfers voor aantallen en percentages.

## Layout

Een smalle filterkolom naast het resultaat. Op mobiel staan de filters boven de antwoorden. Standaard een rustige deelnemerslijst met naam, datum en ingevulde routes. Een klik opent het antwoordoverzicht: onderwerp, vraag in gedempte tekst en het letterlijke antwoord eronder, zoals de antwoordweergave van de vragenlijst. Een terugknop brengt je naar dezelfde deelnemer in de lijst. In `Patronen per vraag` vormen antwoordlabel, balk en aantal één herhaald leespatroon.

## Elevation & Depth

Vlakke vlakken, dunne scheidingen, geen schaduwen of decoratieve effecten.

## Shapes

Licht afgeronde bediening en één samenhangend werkvlak.

## Components

Native keuzelijsten en twee routeknoppen. Verversknop toont laden en is tijdelijk uitgeschakeld. Balken zijn semantische progress-elementen met aantallen als tekst. Open tekst gebruikt letterlijk weergegeven tekst, nooit HTML uit de bron.

## Do's and Don'ts

- Gebruik aantallen en de geldige noemer naast percentages.
- Houd lege, fout- en laadstatus zichtbaar en eerlijk.
- Gebruik geen contactgegevens in grafieken.
- Voeg geen veronderstelde inzichten of fictieve antwoorden toe aan de live resultaten.
