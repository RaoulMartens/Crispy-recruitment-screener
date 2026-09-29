# uc-004: interactie

```mermaid
sequenceDiagram
actor Deelnemer
participant UI as Formulier
Deelnemer->>UI: Kiest toevoegen of overslaan
UI->>UI: Bepaalt welke complete routes worden verstuurd
UI-->>Deelnemer: Toon volgende toestand
```

