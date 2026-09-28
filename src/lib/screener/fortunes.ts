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
  { id: "js_001", audience: "jobSeeker", tone: "oprecht", text: "Wat jij gewoon vindt, kan juist je talent zijn." },
  { id: "js_002", audience: "jobSeeker", tone: "oprecht", text: "Je mag ergens goed in zijn zonder het leuk te vinden." },
  { id: "js_003", audience: "jobSeeker", tone: "oprecht", text: "Je hoeft nog niet te weten wat je hierna wilt." },
  { id: "js_004", audience: "jobSeeker", tone: "oprecht", text: "Je begint opnieuw, maar niet zonder ervaring." },
  { id: "js_005", audience: "jobSeeker", tone: "oprecht", text: "Wat jij nodig hebt, mag ook op je wensenlijst." },
  { id: "js_006", audience: "jobSeeker", tone: "oprecht", text: "Je bent meer dan wat je vandaag afkrijgt." },

  // JOB SEEKER — MYSTERIEUS
  { id: "js_007", audience: "jobSeeker", tone: "mysterieus", text: "Waar vergeet jij steeds de tijd? Daar zit iets." },
  { id: "js_008", audience: "jobSeeker", tone: "mysterieus", text: "Waarvoor vragen anderen altijd jouw hulp?" },
  { id: "js_009", audience: "jobSeeker", tone: "mysterieus", text: "Wat zou je proberen als je nog niet goed hoefde te zijn?" },
  { id: "js_010", audience: "jobSeeker", tone: "mysterieus", text: "Misschien mis je geen ambitie, maar iets dat bij je past." },
  { id: "js_011", audience: "jobSeeker", tone: "mysterieus", text: "Wat je energie kost, zegt ook iets over wat je nodig hebt." },
  { id: "js_012", audience: "jobSeeker", tone: "mysterieus", text: "Welke werkdag zou je graag nog eens overdoen?" },

  // JOB SEEKER — DROOG
  { id: "js_013", audience: "jobSeeker", tone: "droog", text: "Je kunt veel. Vandaag hoeft niet alles." },
  { id: "js_014", audience: "jobSeeker", tone: "droog", text: "Je hoeft van je hobby geen verdienmodel te maken." },
  { id: "js_015", audience: "jobSeeker", tone: "droog", text: "Je cv vertelt veel, maar niet hoe fijn je samenwerkt." },
  { id: "js_016", audience: "jobSeeker", tone: "droog", text: "Je hoeft je pauze niet eerst te verdienen." },
  { id: "js_017", audience: "jobSeeker", tone: "droog", text: "Een volle agenda is niet hetzelfde als een fijne dag." },
  { id: "js_018", audience: "jobSeeker", tone: "droog", text: "Ook iets dat je goed kunt, mag je te veel worden." },

  // JOB SEEKER — SPEELS
  { id: "js_019", audience: "jobSeeker", tone: "speels", text: "Probeer iets kleins voordat je alles omgooit." },
  { id: "js_020", audience: "jobSeeker", tone: "speels", text: "Vraag iemand eens waar die jou goed in vindt." },
  { id: "js_021", audience: "jobSeeker", tone: "speels", text: "Je mag ergens voor het eerst slecht in zijn." },
  { id: "js_022", audience: "jobSeeker", tone: "speels", text: "Bewaar dat compliment net zo goed als die kritiek." },
  { id: "js_023", audience: "jobSeeker", tone: "speels", text: "Stel de vraag die je bijna voor jezelf hield." },
  { id: "js_024", audience: "jobSeeker", tone: "speels", text: "Je mag van gedachten veranderen. Ook over je droombaan." },

  // JOB SEEKER — WERK / MATCH
  { id: "js_025", audience: "jobSeeker", tone: "werk_match", text: "Fijn werk laat ook ruimte voor je leven ernaast." },
  { id: "js_026", audience: "jobSeeker", tone: "werk_match", text: "Bij een kennismaking mag jij ook kiezen." },
  { id: "js_027", audience: "jobSeeker", tone: "werk_match", text: "Je hoeft niet weg te willen om rond te kijken." },
  { id: "js_028", audience: "jobSeeker", tone: "werk_match", text: "Wat vroeger bij je paste, hoeft dat nu niet meer te doen." },
  { id: "js_029", audience: "jobSeeker", tone: "werk_match", text: "Je zoekt geen perfecte baan, maar een plek voor jezelf." },
  { id: "js_030", audience: "jobSeeker", tone: "werk_match", text: "Je hoeft niet de luidste te zijn om iets bij te dragen." },

  // EMPLOYER — OPRECHT
  { id: "em_001", audience: "employer", tone: "oprecht", text: "Wat jij vanzelfsprekend vindt, kan voor iemand nieuw zijn." },
  { id: "em_002", audience: "employer", tone: "oprecht", text: "Je hoeft niet elk antwoord te hebben om goed te helpen." },
  { id: "em_003", audience: "employer", tone: "oprecht", text: "Ook je beste collega had ooit een eerste werkdag." },
  { id: "em_004", audience: "employer", tone: "oprecht", text: "Wie altijd klaarstaat, kan ook een bedankje gebruiken." },
  { id: "em_005", audience: "employer", tone: "oprecht", text: "Even luisteren kan meer helpen dan meteen oplossen." },
  { id: "em_006", audience: "employer", tone: "oprecht", text: "Dat het goed gaat, mag je ook hardop zeggen." },

  // EMPLOYER — MYSTERIEUS
  { id: "em_007", audience: "employer", tone: "mysterieus", text: "Wie vangt steeds iets op zonder dat het opvalt?" },
  { id: "em_008", audience: "employer", tone: "mysterieus", text: "Wat zou een nieuwe collega hier als eerste opmerken?" },
  { id: "em_009", audience: "employer", tone: "mysterieus", text: "Wie weinig zegt, heeft misschien nog een goed idee." },
  { id: "em_010", audience: "employer", tone: "mysterieus", text: "Wat maakt dat mensen graag bij jullie blijven?" },
  { id: "em_011", audience: "employer", tone: "mysterieus", text: "Welke eis is echt nodig, en welke is vooral vertrouwd?" },
  { id: "em_012", audience: "employer", tone: "mysterieus", text: "Wat leer je pas over iemand als je samenwerkt?" },

  // EMPLOYER — DROOG
  { id: "em_013", audience: "employer", tone: "droog", text: "Je zoekt een collega, geen complete afdeling." },
  { id: "em_014", audience: "employer", tone: "droog", text: "Een compliment hoeft niet op de agenda." },
  { id: "em_015", audience: "employer", tone: "droog", text: "Ervaring begint ergens. Misschien wel bij jullie." },
  { id: "em_016", audience: "employer", tone: "droog", text: "Een goed cv kan nog steeds niet met je samenwerken." },
  { id: "em_017", audience: "employer", tone: "droog", text: "Ook de ideale kandidaat moet nog ingewerkt worden." },
  { id: "em_018", audience: "employer", tone: "droog", text: "'Zo doen we dat altijd' is nog geen uitleg." },

  // EMPLOYER — SPEELS
  { id: "em_019", audience: "employer", tone: "speels", text: "Vraag de nieuwste collega wat er nog onduidelijk is." },
  { id: "em_020", audience: "employer", tone: "speels", text: "Stel eens een vraag waarop je het antwoord niet weet." },
  { id: "em_021", audience: "employer", tone: "speels", text: "Laat iemand anders vandaag als eerste iets zeggen." },
  { id: "em_022", audience: "employer", tone: "speels", text: "Geef dat compliment dat je tot nu toe alleen dacht." },
  { id: "em_023", audience: "employer", tone: "speels", text: "Vraag vandaag niet alleen hoe het werk gaat." },
  { id: "em_024", audience: "employer", tone: "speels", text: "Ruil één aanname over iemand in voor een vraag." },

  // EMPLOYER — WERK / MATCH
  { id: "em_025", audience: "employer", tone: "werk_match", text: "Vertel ook wat lastig is aan het werk." },
  { id: "em_026", audience: "employer", tone: "werk_match", text: "Een welkom zit ook in weten waar de mokken staan." },
  { id: "em_027", audience: "employer", tone: "werk_match", text: "Vraag eens waarom iemand blijft, niet alleen waarom die gaat." },
  { id: "em_028", audience: "employer", tone: "werk_match", text: "De eerste week telt ook ná het welkomstpraatje." },
  { id: "em_029", audience: "employer", tone: "werk_match", text: "Niet iedereen laat in een gesprek al zien wat die kan." },
  { id: "em_030", audience: "employer", tone: "werk_match", text: "Een frisse blik komt niet altijd met jaren ervaring." },

  // BOTH — OPRECHT
  { id: "bo_001", audience: "both", tone: "oprecht", text: "Je onthoudt vaak hoe iemand je liet voelen." },
  { id: "bo_002", audience: "both", tone: "oprecht", text: "Je kunt het oneens zijn en toch goed samenwerken." },
  { id: "bo_003", audience: "both", tone: "oprecht", text: "Wat voor jou klein is, kan voor een ander veel betekenen." },
  { id: "bo_004", audience: "both", tone: "oprecht", text: "Je hoeft niet meteen advies te geven om te helpen." },
  { id: "bo_005", audience: "both", tone: "oprecht", text: "Je mag trots zijn op iets wat niemand heeft gezien." },
  { id: "bo_006", audience: "both", tone: "oprecht", text: "Niet elke stilte hoeft meteen gevuld te worden." },

  // BOTH — MYSTERIEUS
  { id: "bo_007", audience: "both", tone: "mysterieus", text: "Bij wie hoef je niet na te denken over hoe je overkomt?" },
  { id: "bo_008", audience: "both", tone: "mysterieus", text: "Wat gaat je makkelijker af bij de juiste mensen?" },
  { id: "bo_009", audience: "both", tone: "mysterieus", text: "Welk compliment vind je nog steeds lastig te geloven?" },
  { id: "bo_010", audience: "both", tone: "mysterieus", text: "Wat zou je missen als je morgen ergens anders begon?" },
  { id: "bo_011", audience: "both", tone: "mysterieus", text: "Wat zou je een vriend aanraden in jouw situatie?" },
  { id: "bo_012", audience: "both", tone: "mysterieus", text: "Misschien weet je al meer dan je jezelf toevertrouwt." },

  // BOTH — DROOG
  { id: "bo_013", audience: "both", tone: "droog", text: "Je hoeft niet van elke dag je beste dag te maken." },
  { id: "bo_014", audience: "both", tone: "droog", text: "'Komt goed' mag ook betekenen dat je hulp vraagt." },
  { id: "bo_015", audience: "both", tone: "droog", text: "Je hoeft niet overal een mening over klaar te hebben." },
  { id: "bo_016", audience: "both", tone: "droog", text: "Je mag iets lastig vinden zonder er slecht in te zijn." },
  { id: "bo_017", audience: "both", tone: "droog", text: "Soms is 'nee' zeggen juist goed samenwerken." },
  { id: "bo_018", audience: "both", tone: "droog", text: "Je kunt betrokken zijn en toch op tijd naar huis gaan." },

  // BOTH — SPEELS
  { id: "bo_019", audience: "both", tone: "speels", text: "Zeg iets aardigs dat je anders alleen denkt." },
  { id: "bo_020", audience: "both", tone: "speels", text: "Vraag door op iets waar iemand enthousiast van wordt." },
  { id: "bo_021", audience: "both", tone: "speels", text: "Stuur dat berichtje dat je steeds uitstelt." },
  { id: "bo_022", audience: "both", tone: "speels", text: "Vier ook wat lukte zonder dat het op je lijst stond." },
  { id: "bo_023", audience: "both", tone: "speels", text: "Vraag eens hoe iemand hier eigenlijk terechtkwam." },
  { id: "bo_024", audience: "both", tone: "speels", text: "Neem je eigen advies ook eens aan." },

  // BOTH — WERK / MATCH
  { id: "bo_025", audience: "both", tone: "werk_match", text: "Een fijne werkplek laat ruimte voor een eerlijke vraag." },
  { id: "bo_026", audience: "both", tone: "werk_match", text: "Je leert elkaar pas echt kennen als iets anders loopt." },
  { id: "bo_027", audience: "both", tone: "werk_match", text: "Zeg wat je nodig hebt. De ander kan het niet raden." },
  { id: "bo_028", audience: "both", tone: "werk_match", text: "Fijne collega's maken ook gewoon werk de moeite waard." },
  { id: "bo_029", audience: "both", tone: "werk_match", text: "Je hoeft niet op elkaar te lijken om elkaar aan te vullen." },
  { id: "bo_030", audience: "both", tone: "werk_match", text: "Je mag ambitie hebben voor je leven, niet alleen je werk." },
] as const satisfies readonly Fortune[];

export function getFortunesByAudience(
  audience: FortuneAudience,
): readonly Fortune[] {
  return fortunes.filter((fortune) => fortune.audience === audience);
}
