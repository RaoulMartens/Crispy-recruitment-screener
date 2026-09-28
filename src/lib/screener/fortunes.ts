export const fortuneAudiences = ["jobSeeker", "employer", "both"] as const;
export type FortuneAudience = (typeof fortuneAudiences)[number];

export const fortuneTones = [
  "oprecht",
  "mysterieus",
  "droog",
  "speels",
  "werk_match",
] as const;
export type FortuneTone = (typeof fortuneTones)[number];

export type Fortune = {
  readonly id: string;
  readonly audience: FortuneAudience;
  readonly tone: FortuneTone;
  readonly text: string;
};

export const fortunes = [
  // JOB SEEKER — OPRECHT
  { id: "js_001", audience: "jobSeeker", tone: "oprecht", text: "Je mag goed zijn in iets wat je zelf gewoon vindt." },
  { id: "js_002", audience: "jobSeeker", tone: "oprecht", text: "Ook op een gewone dinsdag kun je op je plek zijn." },
  { id: "js_003", audience: "jobSeeker", tone: "oprecht", text: "Je hoeft vandaag alleen de volgende stap te weten." },
  { id: "js_004", audience: "jobSeeker", tone: "oprecht", text: "Wat je onderweg leerde, neem je overal mee naartoe." },
  { id: "js_005", audience: "jobSeeker", tone: "oprecht", text: "Er mag best iets op je wensenlijst staan voor jezelf." },
  { id: "js_006", audience: "jobSeeker", tone: "oprecht", text: "Je bent ook van waarde op een dag dat weinig lukt." },

  // JOB SEEKER — MYSTERIEUS
  { id: "js_007", audience: "jobSeeker", tone: "mysterieus", text: "Binnenkort zegt iemand precies wat je nodig had." },
  { id: "js_008", audience: "jobSeeker", tone: "mysterieus", text: "Een terloops gesprek krijgt nog een vervolg." },
  { id: "js_009", audience: "jobSeeker", tone: "mysterieus", text: "Er wacht iets leuks buiten je vaste rondje." },
  { id: "js_010", audience: "jobSeeker", tone: "mysterieus", text: "Een oud idee komt terug op een goed moment." },
  { id: "js_011", audience: "jobSeeker", tone: "mysterieus", text: "Iemand ziet iets in je dat jij heel gewoon vindt." },
  { id: "js_012", audience: "jobSeeker", tone: "mysterieus", text: "Vandaag heeft het toeval een klein plan met je." },

  // JOB SEEKER — DROOG
  { id: "js_013", audience: "jobSeeker", tone: "droog", text: "Je hoeft van je hobby geen verdienmodel te maken." },
  { id: "js_014", audience: "jobSeeker", tone: "droog", text: "Je kunt veel. Vandaag hoeft niet alles." },
  { id: "js_015", audience: "jobSeeker", tone: "droog", text: "Ook een droombaan heeft een printerstoring." },
  { id: "js_016", audience: "jobSeeker", tone: "droog", text: "Je agenda heeft je pauzeverzoek goedgekeurd." },
  { id: "js_017", audience: "jobSeeker", tone: "droog", text: "Dit koekje heeft geen tips voor je LinkedIn." },
  { id: "js_018", audience: "jobSeeker", tone: "droog", text: "Je mag dit inzicht ook morgen toepassen." },

  // JOB SEEKER — SPEELS
  { id: "js_019", audience: "jobSeeker", tone: "speels", text: "Nieuwsgierig zijn telt vandaag als een plan." },
  { id: "js_020", audience: "jobSeeker", tone: "speels", text: "Geef dat gekke idee eens een proefrit." },
  { id: "js_021", audience: "jobSeeker", tone: "speels", text: "Vandaag mag je ergens voor het eerst slecht in zijn." },
  { id: "js_022", audience: "jobSeeker", tone: "speels", text: "Een kleine overwinning verdient een groot koekje." },
  { id: "js_023", audience: "jobSeeker", tone: "speels", text: "Je volgende goede idee komt misschien onder de douche." },
  { id: "js_024", audience: "jobSeeker", tone: "speels", text: "Stel eens de vraag die je bijna voor jezelf hield." },

  // JOB SEEKER — WERK / MATCH
  { id: "js_025", audience: "jobSeeker", tone: "werk_match", text: "Fijn werk laat ook ruimte voor je leven ernaast." },
  { id: "js_026", audience: "jobSeeker", tone: "werk_match", text: "Bij een kennismaking mag jij ook de vragen stellen." },
  { id: "js_027", audience: "jobSeeker", tone: "werk_match", text: "Ook blijven kan een bewuste keuze zijn." },
  { id: "js_028", audience: "jobSeeker", tone: "werk_match", text: "Een baan mag passen bij wie je nu bent." },
  { id: "js_029", audience: "jobSeeker", tone: "werk_match", text: "De sfeer merk je vaak tussen de vragen door." },
  { id: "js_030", audience: "jobSeeker", tone: "werk_match", text: "Een collega die je laat uitpraten is een goed begin." },

  // EMPLOYER — OPRECHT
  { id: "em_001", audience: "employer", tone: "oprecht", text: "Een oprecht bedankje kan ook op een gewone werkdag." },
  { id: "em_002", audience: "employer", tone: "oprecht", text: "Iemand voelt het als je tijd maakt om te luisteren." },
  { id: "em_003", audience: "employer", tone: "oprecht", text: "Een nieuwe collega hoeft op dag één niet alles te kunnen." },
  { id: "em_004", audience: "employer", tone: "oprecht", text: "De mensen die blijven, hebben ook een verhaal." },
  { id: "em_005", audience: "employer", tone: "oprecht", text: "Een goede vraag geeft iemand ruimte." },
  { id: "em_006", audience: "employer", tone: "oprecht", text: "Er zit veel kennis in werk dat vanzelf lijkt te gaan." },

  // EMPLOYER — MYSTERIEUS
  { id: "em_007", audience: "employer", tone: "mysterieus", text: "De volgende verrassing stelt misschien eerst een vraag." },
  { id: "em_008", audience: "employer", tone: "mysterieus", text: "Een idee van de werkvloer blijft straks bij je hangen." },
  { id: "em_009", audience: "employer", tone: "mysterieus", text: "Iemand die weinig zegt, heeft nog iets te vertellen." },
  { id: "em_010", audience: "employer", tone: "mysterieus", text: "Een toevallig gesprek krijgt een plek in je plannen." },
  { id: "em_011", audience: "employer", tone: "mysterieus", text: "Binnenkort hoor je een antwoord dat je niet verwachtte." },
  { id: "em_012", audience: "employer", tone: "mysterieus", text: "De beste vraag van de week staat nog niet op de agenda." },

  // EMPLOYER — DROOG
  { id: "em_013", audience: "employer", tone: "droog", text: "De printer is ook nog steeds in zijn inwerkperiode." },
  { id: "em_014", audience: "employer", tone: "droog", text: "Een compliment hoeft niet in de kwartaalplanning." },
  { id: "em_015", audience: "employer", tone: "droog", text: "Ook een vacature kan zichzelf overschatten." },
  { id: "em_016", audience: "employer", tone: "droog", text: "De ideale kandidaat vergeet ook weleens een wachtwoord." },
  { id: "em_017", audience: "employer", tone: "droog", text: "Een vergadering met koekjes blijft een vergadering." },
  { id: "em_018", audience: "employer", tone: "droog", text: "Een functieprofiel kan zelf geen dienst overnemen." },

  // EMPLOYER — SPEELS
  { id: "em_019", audience: "employer", tone: "speels", text: "Geef een onverwacht idee eens een stoel aan tafel." },
  { id: "em_020", audience: "employer", tone: "speels", text: "Laat de nieuwste collega de eerste vraag stellen." },
  { id: "em_021", audience: "employer", tone: "speels", text: "Ook de buurafdeling kan een goed idee hebben." },
  { id: "em_022", audience: "employer", tone: "speels", text: "Trakteer iemand eens op vijf minuten volle aandacht." },
  { id: "em_023", audience: "employer", tone: "speels", text: "Een klein succes mag best hoorbaar gevierd worden." },
  { id: "em_024", audience: "employer", tone: "speels", text: "Ruil vandaag één aanname in voor een vraag." },

  // EMPLOYER — WERK / MATCH
  { id: "em_025", audience: "employer", tone: "werk_match", text: "Een eerlijk beeld van het werk helpt beide kanten." },
  { id: "em_026", audience: "employer", tone: "werk_match", text: "Een welkom zit ook in weten waar de mokken staan." },
  { id: "em_027", audience: "employer", tone: "werk_match", text: "Vraag ook eens waarom iemand graag blijft." },
  { id: "em_028", audience: "employer", tone: "werk_match", text: "Een goed begin verdient een goed vervolg." },
  { id: "em_029", audience: "employer", tone: "werk_match", text: "Samenwerken leer je pas als je samen werkt." },
  { id: "em_030", audience: "employer", tone: "werk_match", text: "Wie nieuw binnenkomt, ziet wat jij niet meer opmerkt." },

  // BOTH — OPRECHT
  { id: "bo_001", audience: "both", tone: "oprecht", text: "Het is fijn als iemand onthoudt wat je vertelde." },
  { id: "bo_002", audience: "both", tone: "oprecht", text: "Je hoeft het niet eens te zijn om elkaar te begrijpen." },
  { id: "bo_003", audience: "both", tone: "oprecht", text: "Een klein gebaar kan iemands hele dag veranderen." },
  { id: "bo_004", audience: "both", tone: "oprecht", text: "Een goed gesprek laat ruimte voor een tweede gedachte." },
  { id: "bo_005", audience: "both", tone: "oprecht", text: "Je mag trots zijn op iets wat niemand heeft gezien." },
  { id: "bo_006", audience: "both", tone: "oprecht", text: "Sommige antwoorden hebben even stilte nodig." },

  // BOTH — MYSTERIEUS
  { id: "bo_007", audience: "both", tone: "mysterieus", text: "Een losse opmerking brengt je straks op een idee." },
  { id: "bo_008", audience: "both", tone: "mysterieus", text: "Het leukste verhaal van vandaag heb je nog niet gehoord." },
  { id: "bo_009", audience: "both", tone: "mysterieus", text: "Wat vandaag klein begint, krijgt misschien een vervolg." },
  { id: "bo_010", audience: "both", tone: "mysterieus", text: "Een bekende plek heeft nog een verrassing voor je." },
  { id: "bo_011", audience: "both", tone: "mysterieus", text: "Het toeval heeft je naam alvast opgeschreven." },
  { id: "bo_012", audience: "both", tone: "mysterieus", text: "Een gesprek van vijf minuten blijft langer bij je." },

  // BOTH — DROOG
  { id: "bo_013", audience: "both", tone: "droog", text: "Dit koekje heeft geen vijfjarenplan. Jij hoeft ook niet." },
  { id: "bo_014", audience: "both", tone: "droog", text: "Je hebt zojuist succesvol een koekje geopend." },
  { id: "bo_015", audience: "both", tone: "droog", text: "Voor dit inzicht is geen vervolgoverleg nodig." },
  { id: "bo_016", audience: "both", tone: "droog", text: "Geluk laat zich lastig in Excel zetten." },
  { id: "bo_017", audience: "both", tone: "droog", text: "Neem deze wijsheid gerust met een korrel suiker." },
  { id: "bo_018", audience: "both", tone: "droog", text: "Dit koekje had ook gewoon een e-mail kunnen zijn." },

  // BOTH — SPEELS
  { id: "bo_019", audience: "both", tone: "speels", text: "Zeg iets aardigs dat je anders alleen denkt." },
  { id: "bo_020", audience: "both", tone: "speels", text: "Teken dat idee eens op de achterkant van een bonnetje." },
  { id: "bo_021", audience: "both", tone: "speels", text: "Neem een omweg. Misschien staat daar de koffie." },
  { id: "bo_022", audience: "both", tone: "speels", text: "Maak van een klein succes een groot verhaal." },
  { id: "bo_023", audience: "both", tone: "speels", text: "Vandaag mag nieuwsgierigheid het gesprek beginnen." },
  { id: "bo_024", audience: "both", tone: "speels", text: "Deel een koekje. Of begin met dit bericht." },

  // BOTH — WERK / MATCH
  { id: "bo_025", audience: "both", tone: "werk_match", text: "Een goed team kan tegen een eerlijke vraag." },
  { id: "bo_026", audience: "both", tone: "werk_match", text: "Je leert elkaar ook kennen als iets anders loopt." },
  { id: "bo_027", audience: "both", tone: "werk_match", text: "Heldere afspraken geven ruimte om samen te werken." },
  { id: "bo_028", audience: "both", tone: "werk_match", text: "Een prettige werkdag maak je vaak samen." },
  { id: "bo_029", audience: "both", tone: "werk_match", text: "Je hoeft niet hetzelfde te zijn om goed samen te werken." },
  { id: "bo_030", audience: "both", tone: "werk_match", text: "Er is meer dan één manier om ergens op je plek te zijn." },
] as const satisfies readonly Fortune[];

export function getFortunesByAudience(
  audience: FortuneAudience,
): readonly Fortune[] {
  return fortunes.filter((fortune) => fortune.audience === audience);
}
