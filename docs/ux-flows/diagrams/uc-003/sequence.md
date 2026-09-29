# uc-003: interactie

```mermaid
sequenceDiagram
actor Deelnemer
participant UI as Formulier
Deelnemer->>UI: Beantwoordt werk- en zoekvragen
UI->>UI: Scheidt ervaringen van verwachtingen; geen HTTP-verzoek
UI-->>Deelnemer: Toon volgende toestand
```

