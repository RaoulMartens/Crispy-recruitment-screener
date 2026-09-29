# uc-002: toestanden

```mermaid
stateDiagram-v2
Context --> Werving: Geldig
Werving --> Keuzes: Alleen zichtbare vragen geldig
Keuzes --> Context: Terug
Keuzes --> Gereed: Geldig
```

