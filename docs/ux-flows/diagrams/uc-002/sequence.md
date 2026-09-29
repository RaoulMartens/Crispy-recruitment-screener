# uc-002: interactie

```mermaid
sequenceDiagram
actor Deelnemer
participant UI as Formulier
Deelnemer->>UI: Vult organisatievragen in
UI->>UI: Valideert zichtbare vragen; bewaart tijdelijk in pagina
UI-->>Deelnemer: Toon volgende toestand
```

