export type Option = { value: string; label: string; exclusive?: boolean };
export const questionIds = [
  "employerRole",
  "employerLocation", "employerSector", "employerSize", "employerInvolvement", "employerFrequency", "employerRecruiters", "employerRecentHiring", "employerChannels", "employerEffectiveChannels", "employerBarriers", "employerPriorities", "employerEarlyDeparture", "employerDepartureReason",
  "personalSituation", "personalHome", "personalSector", "personalSize", "personalWorkplace", "personalTenure", "personalOpenness", "personalRecentSearch", "personalChannels", "personalPriorities", "personalBarriers", "personalMissingInfo", "personalChecks", "personalMismatch", "personalMismatchReason",
] as const;
export type QuestionId = (typeof questionIds)[number];
export type AnswerId = QuestionId | `${QuestionId}Other`;
export type AnswerValues = Partial<Record<AnswerId, string | string[]>>;
export type ContentStep = "employer-context" | "employer-search" | "employer-experience" | "personal-context" | "personal-search" | "personal-experience";
export type Question = {
  id: QuestionId; label: string; step: ContentStep; kind: "text" | "choice" | "select" | "multi";
  options?: readonly Option[]; hint?: string; optional?: boolean; max?: number;
  visible?: (answers: AnswerValues) => boolean;
};
export const textAnswer = (answers: AnswerValues, id: AnswerId) => typeof answers[id] === "string" ? answers[id] : "";
export const multiAnswer = (answers: AnswerValues, id: AnswerId): string[] => Array.isArray(answers[id]) ? answers[id] : [];
export const hasAnswer = (answers: AnswerValues, id: QuestionId, choice: string) => textAnswer(answers, id) === choice || multiAnswer(answers, id).includes(choice);
export const isWorking = (answers: AnswerValues) => multiAnswer(answers, "personalSituation").some((value) => value === "employed" || value === "self-employed");
export const recentSearch = (answers: AnswerValues) => ["active", "browsing"].includes(textAnswer(answers, "personalRecentSearch"));
export const searchContext = (answers: AnswerValues) => recentSearch(answers) ? "experience" : textAnswer(answers, "personalRecentSearch") === "other" ? "other" : "expectation";
const hiredRecently = (answers: AnswerValues) => textAnswer(answers, "employerRecentHiring") === "yes";
export const other: Option = { value: "other", label: "Anders, namelijk" };
export const unknown: Option = { value: "unknown", label: "Weet ik niet", exclusive: true };
const none: Option = { value: "none", label: "Eigenlijk nergens", exclusive: true };
const notApplicable: Option = { value: "not-applicable", label: "Niet van toepassing", exclusive: true };
export const yesNo: Option[] = [{ value: "yes", label: "Ja" }, { value: "no", label: "Nee" }];
const options = (entries: [string, string][]): Option[] => entries.map(([value, label]) => ({ value, label }));
// Adapted categories and per-question decisions: docs/questionnaire-evidence.md.
export const detailedSectors = [...options([
  ["agriculture", "Landbouw, bosbouw en visserij"], ["industry", "Industrie"], ["utilities", "Energie, water, afval en delfstoffen"],
  ["construction", "Bouw en installatie"], ["wholesale", "Groothandel"], ["retail", "Detailhandel / winkels"],
  ["logistics", "Vervoer en opslag / logistiek"], ["hospitality", "Horeca"], ["media", "Media en uitgeverijen"],
  ["ict", "ICT en telecom"], ["finance", "Financiële dienstverlening"], ["real-estate", "Vastgoed"],
  ["services", "Zakelijke dienstverlening"], ["government", "Overheid / openbaar bestuur"], ["education", "Onderwijs"],
  ["care", "Zorg en welzijn / kinderopvang"], ["culture", "Cultuur, sport en recreatie"], ["other-services", "Overige dienstverlening, zoals kappers en reparatie"],
]), other, unknown];
export const sectors = [...options([
  ["agriculture", "Landbouw"], ["industry-energy", "Industrie en energie"],
  ["construction", "Bouw en installatie"], ["trade", "Handel en winkels"],
  ["logistics", "Logistiek"], ["hospitality", "Horeca"],
  ["ict-media", "ICT en media"], ["service-sector", "Dienstverlening"],
  ["government", "Overheid"], ["education", "Onderwijs"],
  ["care", "Zorg en welzijn"], ["culture", "Cultuur, sport en recreatie"],
]), other, unknown];
export const sizes = [...options([["solo", "Alleen ikzelf"], ["2-9", "2–9 mensen"], ["10-49", "10–49 mensen"], ["50-249", "50–249 mensen"], ["250-plus", "250 of meer mensen"]]), other, unknown];
export const employerChannels = [...options([
  ["network", "Eigen contacten buiten de organisatie"], ["employees", "Via huidige medewerkers"], ["job-boards", "Vacaturesites"], ["linkedin", "LinkedIn"], ["social", "Andere social media"], ["website", "Eigen website / werken-bij-site"], ["recruitment-agency", "Recruitmentbureau"], ["temp-agency", "Uitzendbureau"], ["events", "Banenmarkt / evenement"], ["education", "School / stage"], ["unsolicited", "Open sollicitaties"], ["direct", "Zelf kandidaten benaderen"], ["public-service", "UWV, gemeente of Werkcentrum"],
]), other, unknown];
const personalChannels = [...options([
  ["job-boards", "Vacaturesites"], ["linkedin", "LinkedIn"], ["social", "Andere social media"], ["website", "Websites van werkgevers"], ["network", "Eigen netwerk"], ["education", "School / stage"], ["recruitment-agency", "Recruiter / recruitmentbureau"], ["temp-agency", "Uitzendbureau"], ["events", "Banenmarkt / evenement"], ["direct", "Rechtstreeks contact met een bedrijf"], ["public-service", "UWV, gemeente of Werkcentrum"],
]), other, unknown];
const personalBarriers = options([
  ["unclear-vacancy", "Onduidelijk wat het werk inhoudt"], ["no-salary", "Geen salaris genoemd"], ["slow-response", "Lang wachten op een reactie"], ["long-process", "Te veel sollicitatierondes of opdrachten"], ["communication", "Onduidelijke of tegenstrijdige communicatie"], ["salary", "Het salaris is te laag"], ["conditions", "Andere arbeidsvoorwaarden passen niet"], ["work-life", "Het werk is lastig te combineren met mijn privéleven"], ["commute", "Reistijd is te lang"], ["impression", "De sfeer of omgang past niet bij mij"],
]);

export const questions: readonly Question[] = [
  { id: "employerRole", step: "employer-context", kind: "multi", label: "Wat is jouw rol binnen de organisatie?", options: [...options([["owner", "Eigenaar / directie"], ["hr", "HR-medewerker"], ["recruiter", "Recruiter"], ["manager", "Leidinggevende"]]), other] },
  { id: "employerLocation", step: "employer-context", kind: "text", label: "In welke plaats werk je?", optional: true, hint: "Geen vaste werkplek? Laat dit veld dan leeg." },
  { id: "employerSector", step: "employer-context", kind: "select", label: "In welke sector is jullie organisatie vooral actief?", hint: "Kies de belangrijkste activiteit van de organisatie.", options: sectors },
  { id: "employerSize", step: "employer-context", kind: "select", label: "Hoeveel mensen werken er in de hele organisatie?", options: sizes },
  { id: "employerInvolvement", step: "employer-context", kind: "choice", label: "Ben je betrokken bij het zoeken, selecteren of aannemen van medewerkers?", hint: "Ook als je niet betrokken bent, kun je meedoen. Antwoord op wat je weet.", options: [...yesNo, other] },
  { id: "employerFrequency", step: "employer-search", kind: "select", label: "Hoe vaak hebben jullie meestal nieuwe medewerkers nodig?", options: [...options([["continuous", "Vrijwel het hele jaar door"], ["several-year", "Op meerdere losse momenten per jaar"], ["annual", "Ongeveer één keer per jaar"], ["less-often", "Minder dan één keer per jaar"], ["never", "Nooit"]]), other, unknown] },
  { id: "employerRecruiters", step: "employer-search", kind: "multi", label: "Wie zoekt bij jullie naar nieuwe medewerkers?", options: [...options([["owner", "Eigenaar / directie"], ["manager", "Leidinggevende"], ["hr", "HR"], ["recruiter", "Interne recruiter"], ["agency", "Extern recruitmentbureau"], ["temp-agency", "Uitzendbureau"]]), other, { value: "none", label: "Niemand", exclusive: true }, unknown] },
  { id: "employerRecentHiring", step: "employer-search", kind: "choice", label: "Hebben jullie in de afgelopen twee jaar naar nieuwe medewerkers gezocht?", hint: "Ook als er uiteindelijk niemand is aangenomen.", options: [...yesNo, other, unknown] },
  { id: "employerChannels", step: "employer-search", kind: "multi", label: "Welke manieren hebben jullie gebruikt om medewerkers te zoeken?", hint: "Denk aan de laatste keer dat jullie medewerkers zochten.", options: employerChannels, visible: hiredRecently },
  { id: "employerEffectiveChannels", step: "employer-search", kind: "multi", label: "Welke manieren leverden de meest geschikte kandidaten op?", options: [...employerChannels, { ...other, value: "own-answer" }], visible: (a) => hiredRecently(a) && multiAnswer(a, "employerChannels").some((v) => v !== "unknown") },
  { id: "employerBarriers", step: "employer-search", kind: "multi", label: "Waar liepen jullie daarbij tegenaan?", options: [...options([["few-responses", "Te weinig reacties"], ["unsuitable", "Reacties passen niet bij wat we zoeken"], ["dropout", "Kandidaten haken tijdens het proces af"], ["conditions", "Salaris of arbeidsvoorwaarden sluiten niet aan"], ["competition", "Veel concurrentie van andere werkgevers"], ["capacity", "Weinig tijd of capaciteit voor werving"], ["assessment", "Kandidaten goed beoordelen is lastig"], ["slow", "Het duurt lang voordat iemand gevonden is"]]), other, none, unknown], visible: hiredRecently },
  { id: "employerPriorities", step: "employer-experience", kind: "multi", label: "Wat vinden jullie het belangrijkst bij een nieuwe medewerker?", hint: "Denk aan één functie waarvoor jullie medewerkers zoeken of hebben gezocht.", max: 3, options: [...options([["motivation", "Motivatie"], ["experience", "Werkervaring"], ["skills", "Vaardigheden"], ["knowledge", "Vakkennis"], ["education", "Opleiding / diploma's"], ["learning", "Bereidheid en vermogen om te leren"], ["availability", "Beschikbaarheid"], ["reliability", "Betrouwbaarheid"], ["team", "Passend bij het team / de cultuur"], ["salary", "Salarisverwachting"]]), other, { ...notApplicable, label: "We hebben nog geen functie voor ogen" }, unknown] },
  { id: "employerEarlyDeparture", step: "employer-experience", kind: "choice", label: "Is er de afgelopen twee jaar iemand uit dienst gegaan die nog geen jaar bij jullie werkte?", hint: "Ook bij ontslag of het aflopen van een contract.", options: [...yesNo, other, unknown, { ...notApplicable, label: "Er waren in die periode geen medewerkers in hun eerste dienstjaar" }] },
  { id: "employerDepartureReason", step: "employer-experience", kind: "select", label: "Wat was volgens jou de belangrijkste reden bij het meest recente vertrek binnen het eerste dienstjaar?", visible: (a) => hasAnswer(a, "employerEarlyDeparture", "yes"), options: [...options([["work-fit", "Het werk bleek niet passend"], ["team", "Sfeer / team"], ["manager", "Leidinggevende"], ["conditions", "Salaris / arbeidsvoorwaarden"], ["hours", "Werktijden"], ["development", "Te weinig ontwikkeling"], ["other-job", "Ander werk gevonden"], ["private", "Privéreden"], ["performance", "Functioneren"], ["contract-ended", "Het tijdelijke werk of contract liep af"], ["reorganisation", "Er was minder werk of een reorganisatie"]]), other, unknown] },
  { id: "personalSituation", step: "personal-context", kind: "multi", label: "Wat is je huidige situatie?", hint: "Ook een bijbaan telt als werk. Werken en studeren kunnen samen.", options: [...options([["employed", "Ik werk in loondienst"], ["self-employed", "Ik werk als zelfstandige"], ["student", "Ik studeer"], ["not-working", "Ik werk op dit moment niet"]]), other] },
  { id: "personalHome", step: "personal-context", kind: "text", label: "In welke plaats woon je?", optional: true },
  { id: "personalSector", step: "personal-context", kind: "select", label: "In welke sector is je werkgever of eigen bedrijf vooral actief?", hint: "Kies de belangrijkste activiteit van de organisatie. Bij meerdere banen: houd hier en bij de volgende vragen de baan aan waarin je de meeste uren werkt.", options: sectors, visible: isWorking },
  { id: "personalSize", step: "personal-context", kind: "select", label: "Hoeveel mensen werken er in de hele organisatie?", options: sizes, visible: isWorking },
  { id: "personalWorkplace", step: "personal-context", kind: "text", label: "In welke plaats werk je?", optional: true, hint: "Geen vaste werkplek? Laat dit veld dan leeg.", visible: isWorking },
  // Retired question: retain its storage position so existing Sheet columns do not shift.
  { id: "personalTenure", step: "personal-context", kind: "select", label: "Hoe lang werk je daar al?", options: options([["under-1", "Korter dan 1 jaar"], ["1-to-3", "1 tot minder dan 3 jaar"], ["3-to-5", "3 tot en met 5 jaar"], ["over-5", "Langer dan 5 jaar"]]), visible: () => false },
  { id: "personalOpenness", step: "personal-search", kind: "choice", label: "Hoe sta je tegenover nieuw of ander werk?", options: [...options([["active", "Ik zoek actief naar werk"], ["open", "Ik zoek niet actief, maar sta wel open voor iets anders"], ["closed", "Ik sta nu niet open voor ander werk"]]), other] },
  { id: "personalRecentSearch", step: "personal-search", kind: "choice", label: "Heb je de afgelopen twee jaar naar nieuw of ander werk gekeken?", options: [...options([["active", "Ja, ik heb actief gezocht"], ["browsing", "Ja, ik heb vooral rondgekeken"], ["no", "Nee"]]), other] },
  { id: "personalChannels", step: "personal-search", kind: "multi", label: "Welke manieren heb je bij je laatste zoektocht naar werk gebruikt?", options: personalChannels, visible: (a) => ["active", "browsing", "no", "other"].includes(textAnswer(a, "personalRecentSearch")) },
  { id: "personalPriorities", step: "personal-experience", kind: "multi", label: "Wat vind je het belangrijkst in een nieuwe baan?", max: 3, options: [...options([["salary", "Salaris"], ["team", "Sfeer en manier van samenwerken"], ["work", "Inhoud van het werk"], ["remote", "Thuis kunnen werken"], ["schedule", "Zelf werktijden kunnen bepalen"], ["work-life", "Balans tussen werk en privé"], ["conditions", "Andere arbeidsvoorwaarden, zoals verlof en pensioen"], ["development", "Mogelijkheden om te ontwikkelen"], ["commute", "Reistijd"], ["hours", "Aantal uren per week"], ["security", "Werkzekerheid"], ["purpose", "Maatschappelijke betekenis van mijn werk"]]), other, unknown] },
  { id: "personalBarriers", step: "personal-experience", kind: "multi", label: "Waardoor ben je bij je laatste zoektocht afgehaakt bij een vacature of sollicitatie?", options: [...personalBarriers, other] },
  { id: "personalMissingInfo", step: "personal-experience", kind: "multi", label: "Welke informatie over het werk miste je bij je laatste zoektocht?", hint: "Denk ook aan gesprekken of je netwerk.", visible: recentSearch, options: [...options([["salary", "Salaris"], ["hours", "Werktijden"], ["weekly-hours", "Aantal uren per week"], ["work", "Concrete werkzaamheden"], ["team", "Team / sfeer"], ["development", "Ontwikkelmogelijkheden"], ["remote", "Mogelijkheden om thuis te werken"], ["schedule", "Mogelijkheden om zelf werktijden te bepalen"], ["security", "Type contract"], ["location", "Werklocatie"], ["process", "Hoe het sollicitatieproces verloopt"]]), other, { value: "none", label: "Ik miste geen informatie", exclusive: true }, { ...notApplicable, label: "Ik heb nog geen informatie over het werk bekeken of besproken" }, unknown] },
  { id: "personalChecks", step: "personal-experience", kind: "multi", label: "Welke bronnen gebruikte je bij je laatste zoektocht om meer over werkgevers te weten te komen?", options: [...options([["website", "Website van het bedrijf"], ["social", "Andere social media"], ["linkedin", "LinkedIn"], ["reviews", "Reviews van medewerkers"], ["contacts", "Mensen die ik ken buiten dat bedrijf"], ["employees", "Gesprekken met medewerkers van het bedrijf"], ["visit", "Een bezoek, open dag of meeloopdag"]]), other, { value: "none", label: "Ik heb geen informatie over werkgevers opgezocht of nagevraagd", exclusive: true }, unknown] },
  { id: "personalMismatch", step: "personal-experience", kind: "choice", label: "Heb je meegemaakt dat een baan anders bleek dan je vooraf dacht?", options: [...yesNo, { value: "no-experience", label: "Nog geen werkervaring" }, other] },
  { id: "personalMismatchReason", step: "personal-experience", kind: "select", label: "Wat was bij die baan het grootste verschil met je verwachtingen?", hint: "Denk aan de meest recente keer. Het verschil kan positief of negatief zijn.", visible: (a) => hasAnswer(a, "personalMismatch", "yes"), options: [...options([["work", "Werkzaamheden"], ["hours", "Werktijden"], ["conditions", "Salaris / arbeidsvoorwaarden"], ["team", "Sfeer / team"], ["manager", "Leidinggevende"], ["pressure", "Werkdruk"], ["development", "Ontwikkelmogelijkheden"], ["remote", "Mogelijkheden om thuis te werken"], ["schedule", "Vrijheid om zelf werktijden te bepalen"], ["onboarding", "Inwerken en begeleiding"]]), other, unknown] },
];

export function resolveQuestion(question: Question, answers: AnswerValues): Question {
  if (question.id === "employerEffectiveChannels") {
    const selected = multiAnswer(answers, "employerChannels");
    return { ...question, options: [
      ...employerChannels.filter((option) => !option.exclusive && selected.includes(option.value)).map((option) => option.value === "other" ? { ...option, label: textAnswer(answers, "employerChannelsOther") || "Andere gebruikte manier" } : option),
      { ...other, value: "own-answer" },
      ...(selected.filter((value) => value !== "unknown").length > 1 ? [{ value: "no-difference", label: "Wel geschikte kandidaten, geen duidelijk verschil", exclusive: true }] : []),
      { value: "no-candidates", label: "Nog geen geschikte kandidaten opgeleverd", exclusive: true }, unknown,
    ] };
  }
  if (searchContext(answers) === "other") {
    if (question.id === "personalChannels") return { ...question, label: "Welke manieren gebruikte je of zou je gebruiken om werk te zoeken?", hint: undefined };
    if (question.id === "personalBarriers") return { ...question, label: "Wat is of zou voor jou een reden zijn om af te haken?", hint: undefined, options: [...personalBarriers, other, { value: "none", label: "Geen afhaakreden", exclusive: true }, unknown] };
    if (question.id === "personalChecks") return { ...question, label: "Welke bronnen gebruikte je of zou je gebruiken om meer over een werkgever te weten te komen?", hint: undefined, options: question.options?.map((option) => option.value === "none" ? { ...option, label: "Geen bronnen" } : option) };
  }
  if (question.id === "personalChannels") return { ...question, label: recentSearch(answers) ? question.label : "Waar zou je beginnen met zoeken naar werk?", hint: undefined };
  if (question.id === "personalBarriers") return { ...question,
    label: recentSearch(answers) ? question.label : "Wat zou voor jou een reden zijn om af te haken?",
    hint: recentSearch(answers) ? undefined : "Je hoeft dit niet te hebben meegemaakt.",
    options: [...personalBarriers, other, { value: "none", label: recentSearch(answers) ? "Ik ben niet afgehaakt" : "Geen van deze redenen zou mij laten afhaken", exclusive: true }, unknown],
  };
  if (question.id === "personalChecks") return { ...question,
    label: recentSearch(answers) ? question.label : "Welke bronnen zou je gebruiken om meer over een werkgever te weten te komen?",
    hint: undefined,
    options: question.options?.map((option) => option.value === "none" && !recentSearch(answers) ? { ...option, label: "Ik zou geen informatie over werkgevers opzoeken of navragen" } : option),
  };
  return question;
}
export function getQuestions(step: ContentStep, answers: AnswerValues): Question[] {
  return questions.filter((q) => q.step === step && (!q.visible || q.visible(answers))).map((q) => resolveQuestion(q, answers));
}
export function hasOther(question: Question, answers: AnswerValues): boolean {
  const value = question.id === "employerEffectiveChannels" ? "own-answer" : "other";
  return !!question.options?.some((option) => option.value === value) && hasAnswer(answers, question.id, value);
}
export function toggleChoice(question: Question, values: string[], value: string): string[] {
  if (values.includes(value)) return values.filter((v) => v !== value);
  if (question.options?.find((option) => option.value === value)?.exclusive) return [value];
  let next = values.filter((v) => !question.options?.find((option) => option.value === v)?.exclusive);
  if (question.id === "personalSituation") {
    if (value === "not-working") next = next.filter((v) => v !== "employed" && v !== "self-employed" && v !== "employer");
    if (value === "employed" || value === "self-employed" || value === "employer") next = next.filter((v) => v !== "not-working");
  }
  return [...next, value];
}
