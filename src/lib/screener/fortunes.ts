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
  { id: "js_001", audience: "jobSeeker", tone: "oprecht", text: "De juiste plek geeft ruimte om jezelf te zijn." },
  { id: "js_002", audience: "jobSeeker", tone: "oprecht", text: "Een goed gesprek kan je richting helder maken." },
  { id: "js_003", audience: "jobSeeker", tone: "oprecht", text: "Je hoeft niet overal perfect in te passen." },
  { id: "js_004", audience: "jobSeeker", tone: "oprecht", text: "De beste stap voelt vaak rustig en helder." },
  { id: "js_005", audience: "jobSeeker", tone: "oprecht", text: "Een goede plek ziet meer dan je cv." },
  { id: "js_006", audience: "jobSeeker", tone: "oprecht", text: "Je volgende stap mag beter bij je passen." },

  // JOB SEEKER — MYSTERIEUS
  { id: "js_007", audience: "jobSeeker", tone: "mysterieus", text: "Een kleine omweg brengt je dichterbij." },
  { id: "js_008", audience: "jobSeeker", tone: "mysterieus", text: "Een onverwacht gesprek krijgt later meer waarde." },
  { id: "js_009", audience: "jobSeeker", tone: "mysterieus", text: "De juiste kans komt soms via een zijweg." },
  { id: "js_010", audience: "jobSeeker", tone: "mysterieus", text: "Iets kleins zet binnenkort veel in beweging." },
  { id: "js_011", audience: "jobSeeker", tone: "mysterieus", text: "De beste klik verschijnt niet altijd gepland." },
  { id: "js_012", audience: "jobSeeker", tone: "mysterieus", text: "Een stille kans blijkt later verrassend groot." },

  // JOB SEEKER — DROOG
  { id: "js_013", audience: "jobSeeker", tone: "droog", text: "Niet elke leuke vacature is echt leuk." },
  { id: "js_014", audience: "jobSeeker", tone: "droog", text: "Een functietitel weet ook niet alles." },
  { id: "js_015", audience: "jobSeeker", tone: "droog", text: "Je cv hoeft vandaag even niets te bewijzen." },
  { id: "js_016", audience: "jobSeeker", tone: "droog", text: "Soms is minder zoeken gewoon beter zoeken." },
  { id: "js_017", audience: "jobSeeker", tone: "droog", text: "Niet elk vinkje verdient jouw aandacht." },
  { id: "js_018", audience: "jobSeeker", tone: "droog", text: "Ook recruiters gokken soms een klein beetje." },

  // JOB SEEKER — SPEELS
  { id: "js_019", audience: "jobSeeker", tone: "speels", text: "Je volgende klik kan zomaar raak zijn." },
  { id: "js_020", audience: "jobSeeker", tone: "speels", text: "Vandaag wint nieuwsgierig zijn van zeker weten." },
  { id: "js_021", audience: "jobSeeker", tone: "speels", text: "Een goede kans mag best vreemd beginnen." },
  { id: "js_022", audience: "jobSeeker", tone: "speels", text: "Je beste route hoeft niet rechtdoor te gaan." },
  { id: "js_023", audience: "jobSeeker", tone: "speels", text: "Een klein ja kan veel deuren openen." },
  { id: "js_024", audience: "jobSeeker", tone: "speels", text: "Je volgende stap heeft nog geen label nodig." },

  // JOB SEEKER — WERK / MATCH
  { id: "js_025", audience: "jobSeeker", tone: "werk_match", text: "De juiste klik past niet altijd op papier." },
  { id: "js_026", audience: "jobSeeker", tone: "werk_match", text: "Niet elke goede match begint met een vacature." },
  { id: "js_027", audience: "jobSeeker", tone: "werk_match", text: "Een functie past pas als jij ook past." },
  { id: "js_028", audience: "jobSeeker", tone: "werk_match", text: "Goed werk voelt vaak beter dan het klinkt." },
  { id: "js_029", audience: "jobSeeker", tone: "werk_match", text: "De beste match begint vaak zonder haast." },
  { id: "js_030", audience: "jobSeeker", tone: "werk_match", text: "Een bedrijf kan beter passen dan een functie." },

  // EMPLOYER — OPRECHT
  { id: "em_001", audience: "employer", tone: "oprecht", text: "Goed talent verdient meer dan een snelle blik." },
  { id: "em_002", audience: "employer", tone: "oprecht", text: "Een goed gesprek maakt potentie beter zichtbaar." },
  { id: "em_003", audience: "employer", tone: "oprecht", text: "De juiste keuze begint vaak met aandacht." },
  { id: "em_004", audience: "employer", tone: "oprecht", text: "Een sterke match vraagt ruimte aan beide kanten." },
  { id: "em_005", audience: "employer", tone: "oprecht", text: "Goed kijken maakt verborgen talent zichtbaar." },
  { id: "em_006", audience: "employer", tone: "oprecht", text: "De beste kandidaat voelt soms eerst anders." },

  // EMPLOYER — MYSTERIEUS
  { id: "em_007", audience: "employer", tone: "mysterieus", text: "Een onverwachte kandidaat blijft langer hangen." },
  { id: "em_008", audience: "employer", tone: "mysterieus", text: "De juiste klik meldt zich zelden netjes aan." },
  { id: "em_009", audience: "employer", tone: "mysterieus", text: "Een klein detail verandert straks je oordeel." },
  { id: "em_010", audience: "employer", tone: "mysterieus", text: "Iemand buiten beeld blijkt verrassend passend." },
  { id: "em_011", audience: "employer", tone: "mysterieus", text: "De beste keuze staat niet altijd bovenaan." },
  { id: "em_012", audience: "employer", tone: "mysterieus", text: "Een stille kandidaat kan veel losmaken." },

  // EMPLOYER — DROOG
  { id: "em_013", audience: "employer", tone: "droog", text: "Een cv heeft zelden het laatste woord." },
  { id: "em_014", audience: "employer", tone: "droog", text: "Niet elk talent draagt een perfect profiel." },
  { id: "em_015", audience: "employer", tone: "droog", text: "Ook een vacature kan zichzelf overschatten." },
  { id: "em_016", audience: "employer", tone: "droog", text: "Een vinkje is nog geen goede match." },
  { id: "em_017", audience: "employer", tone: "droog", text: "Soms wint iemand zonder perfecte bulletpoints." },
  { id: "em_018", audience: "employer", tone: "droog", text: "Ervaring is handig, een open blik ook." },

  // EMPLOYER — SPEELS
  { id: "em_019", audience: "employer", tone: "speels", text: "Een frisse blik vindt vaker nieuw talent." },
  { id: "em_020", audience: "employer", tone: "speels", text: "De beste klik mag best onverwacht zijn." },
  { id: "em_021", audience: "employer", tone: "speels", text: "Een klein gesprek kan groot verschil maken." },
  { id: "em_022", audience: "employer", tone: "speels", text: "Kijk nog één keer buiten het bekende." },
  { id: "em_023", audience: "employer", tone: "speels", text: "Soms zit talent net buiten je zoekvak." },
  { id: "em_024", audience: "employer", tone: "speels", text: "Een goede verrassing past zelden in vakjes." },

  // EMPLOYER — WERK / MATCH
  { id: "em_025", audience: "employer", tone: "werk_match", text: "De beste kandidaat past niet altijd precies." },
  { id: "em_026", audience: "employer", tone: "werk_match", text: "Een goede match vraagt meer dan ervaring." },
  { id: "em_027", audience: "employer", tone: "werk_match", text: "Een sterke klik staat zelden in een profiel." },
  { id: "em_028", audience: "employer", tone: "werk_match", text: "Goed talent valt soms buiten je eerste blik." },
  { id: "em_029", audience: "employer", tone: "werk_match", text: "De juiste kandidaat verrast soms eerst." },
  { id: "em_030", audience: "employer", tone: "werk_match", text: "Een cv vertelt nooit het hele verhaal." },

  // BOTH — OPRECHT
  { id: "bo_001", audience: "both", tone: "oprecht", text: "Een goede match begint met echte aandacht." },
  { id: "bo_002", audience: "both", tone: "oprecht", text: "Goed contact maakt verwachtingen sneller helder." },
  { id: "bo_003", audience: "both", tone: "oprecht", text: "Een open blik geeft beide kanten ruimte." },
  { id: "bo_004", audience: "both", tone: "oprecht", text: "De beste klik vraagt aandacht van twee kanten." },
  { id: "bo_005", audience: "both", tone: "oprecht", text: "Een eerlijk gesprek brengt mensen dichterbij." },
  { id: "bo_006", audience: "both", tone: "oprecht", text: "Goed luisteren maakt verschil snel voelbaar." },

  // BOTH — MYSTERIEUS
  { id: "bo_007", audience: "both", tone: "mysterieus", text: "Een toevallig gesprek krijgt later betekenis." },
  { id: "bo_008", audience: "both", tone: "mysterieus", text: "De juiste klik laat zich niet altijd plannen." },
  { id: "bo_009", audience: "both", tone: "mysterieus", text: "Iets kleins brengt binnenkort mensen samen." },
  { id: "bo_010", audience: "both", tone: "mysterieus", text: "Een onverwachte ontmoeting krijgt later waarde." },
  { id: "bo_011", audience: "both", tone: "mysterieus", text: "De beste match verschijnt soms zonder reden." },
  { id: "bo_012", audience: "both", tone: "mysterieus", text: "Een open deur blijkt straks belangrijker." },

  // BOTH — DROOG
  { id: "bo_013", audience: "both", tone: "droog", text: "Papier blijft verrassend slecht in mensen." },
  { id: "bo_014", audience: "both", tone: "droog", text: "Een goede match leest geen functietitels." },
  { id: "bo_015", audience: "both", tone: "droog", text: "Niet alles hoeft meteen een perfecte klik." },
  { id: "bo_016", audience: "both", tone: "droog", text: "Mensen blijven lastig in hokjes te stoppen." },
  { id: "bo_017", audience: "both", tone: "droog", text: "Data weet veel, maar lang niet alles." },
  { id: "bo_018", audience: "both", tone: "droog", text: "Ook algoritmes hebben soms gewoon pech." },

  // BOTH — SPEELS
  { id: "bo_019", audience: "both", tone: "speels", text: "Een kleine klik kan veel in beweging zetten." },
  { id: "bo_020", audience: "both", tone: "speels", text: "Vandaag mag toeval ook even meedoen." },
  { id: "bo_021", audience: "both", tone: "speels", text: "Een goede match mag best vreemd beginnen." },
  { id: "bo_022", audience: "both", tone: "speels", text: "Soms is één gesprek al genoeg richting." },
  { id: "bo_023", audience: "both", tone: "speels", text: "Een beetje ruimte maakt mensen verrassender." },
  { id: "bo_024", audience: "both", tone: "speels", text: "De beste klik komt soms zonder waarschuwing." },

  // BOTH — WERK / MATCH
  { id: "bo_025", audience: "both", tone: "werk_match", text: "Een open blik brengt werk en talent samen." },
  { id: "bo_026", audience: "both", tone: "werk_match", text: "Niet alles wat past staat meteen op papier." },
  { id: "bo_027", audience: "both", tone: "werk_match", text: "Een goede match begint niet bij haast." },
  { id: "bo_028", audience: "both", tone: "werk_match", text: "De juiste klik vraagt ruimte van beide kanten." },
  { id: "bo_029", audience: "both", tone: "werk_match", text: "Goed contact zegt vaak meer dan data." },
  { id: "bo_030", audience: "both", tone: "werk_match", text: "De beste match voelt beter dan hij scoort." },
] as const satisfies readonly Fortune[];

export function getFortunesByAudience(
  audience: FortuneAudience,
): readonly Fortune[] {
  return fortunes.filter((fortune) => fortune.audience === audience);
}
