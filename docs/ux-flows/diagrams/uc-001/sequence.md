# uc-001: interactie

```mermaid
sequenceDiagram
actor Deelnemer
participant UI as Formulier
Deelnemer->>UI: Kiest perspectief en eerste route
UI->>UI: Stelt route vast; nog geen HTTP-verzoek
UI-->>Deelnemer: Toon volgende toestand
```

