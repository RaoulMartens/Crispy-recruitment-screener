# uc-006: interactie

```mermaid
sequenceDiagram
actor Deelnemer
participant UI as Formulier
Deelnemer->>UI: Opent koekje of antwoordoverzicht
UI->>UI: Toont bevestigde inzending; geen tweede verzending
UI-->>Deelnemer: Toon volgende toestand
```

