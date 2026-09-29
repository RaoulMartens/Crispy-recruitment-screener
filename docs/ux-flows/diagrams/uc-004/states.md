# uc-004: toestanden

```mermaid
stateDiagram-v2
Keuze --> TweedeRoute: Ja
Keuze --> Afsluiting: Nee
TweedeRoute --> Afsluiting: Voltooid
TweedeRoute --> Afsluiting: Expliciet overslaan
Afsluiting --> Keuze: Terug
```

