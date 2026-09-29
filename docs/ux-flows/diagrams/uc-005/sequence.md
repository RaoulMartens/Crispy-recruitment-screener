# uc-005: interactie

```mermaid
sequenceDiagram
actor Deelnemer
participant UI as Formulier
participant API
participant Sheets
Deelnemer->>UI: Versturen
UI->>UI: Valideer; maak vaste inzend-ID
UI->>API: POST /api/submissions
API->>API: Versie en actieve velden valideren
API->>Sheets: Controleer tabblad, kolommen en inzend-ID
alt Nog niet opgeslagen
API->>Sheets: Schrijf antwoorden met inzend-ID
Sheets-->>API: Opslagresultaat
end
alt Succes
API-->>UI: 200 ok
UI-->>Deelnemer: Bedankje
else Fout
API-->>UI: 400, 409, 502 of 503
UI-->>Deelnemer: Geen succes; antwoorden behouden
end
```

