// Frozen v5-research-1 contract: keep old submissions and their labels unchanged.
export type Option = { value: string; label: string; exclusive?: boolean };
export const questionIds = [
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
const hiredRecently = (answers: AnswerValues) => textAnswer(answers, "employerRecentHiring") === "yes";
export const other: Option = { value: "other", label: "Anders, namelijk" };
export const unknown: Option = { value: "unknown", label: "Weet ik niet", exclusive: true };
const none: Option = { value: "none", label: "Eigenlijk nergens", exclusive: true };
const notApplicable: Option = { value: "not-applicable", label: "Niet van toepassing", exclusive: true };
export const yesNo: Option[] = [{ value: "yes", label: "Ja" }, { value: "no", label: "Nee" }];
const options = (entries: [string, string][]): Option[] => entries.map(([value, label]) => ({ value, label }));
export const sectors = [...options([
  ["industry", "Techniek / industrie"], ["construction", "Bouw"], ["logistics", "Logistiek"], ["care", "Zorg"], ["hospitality", "Horeca"], ["retail", "Retail"], ["services", "Zakelijke dienstverlening"], ["education", "Onderwijs"], ["government", "Overheid"], ["agriculture", "Agrarisch"],
]), other, unknown];
export const sizes = [...options([["solo", "Alleen ikzelf"], ["2-9", "2–9 mensen"], ["10-49", "10–49 mensen"], ["50-249", "50–249 mensen"], ["250-plus", "250 of meer mensen"]]), unknown];
export const employerChannels = [...options([
  ["network", "Eigen netwerk"], ["employees", "Via huidige medewerkers"], ["job-boards", "Vacaturesites"], ["linkedin", "LinkedIn"], ["social", "Andere social media"], ["website", "Eigen website / werken-bij-site"], ["recruitment-agency", "Recruitmentbureau"], ["temp-agency", "Uitzendbureau"], ["events", "Banenmarkt / evenement"], ["education", "School / stage"], ["unsolicited", "Open sollicitaties"],
]), other, unknown];
const personalChannels = [...options([
  ["job-boards", "Vacaturesites"], ["linkedin", "LinkedIn"], ["social", "Andere social media"], ["website", "Websites van werkgevers"], ["network", "Eigen netwerk"], ["education", "School / stage"], ["recruitment-agency", "Recruiter / recruitmentbureau"], ["temp-agency", "Uitzendbureau"], ["events", "Banenmarkt / evenement"], ["direct", "Rechtstreeks contact met een bedrijf"],
]), other, unknown];
const personalBarriers = options([
  ["unclear-vacancy", "Onduidelijk wat het werk inhoudt"], ["no-salary", "Geen salaris genoemd"], ["slow-response", "Lang wachten op een reactie"], ["long-process", "Te veel sollicitatierondes of opdrachten"], ["communication", "Onduidelijke of tegenstrijdige communicatie"], ["conditions", "Arbeidsvoorwaarden passen niet"], ["commute", "Reistijd is te lang"], ["impression", "De sfeer of omgang past niet bij mij"],
]);

export const questions: readonly Question[] = [
  { id: "employerLocation", step: "employer-context", kind: "text", label: "In welke plaats werk je?", optional: true, hint: "Geen vaste werkplek? Laat dit veld dan leeg." },
  { id: "employerSector", step: "employer-context", kind: "select", label: "In welke sector zijn jullie actief?", options: sectors },
  { id: "employerSize", step: "employer-context", kind: "select", label: "Hoeveel mensen werken er in totaal bij jullie?", options: sizes },
  { id: "employerInvolvement", step: "employer-context", kind: "choice", label: "Ben je zelf betrokken bij werving, selectie of het aannemen van medewerkers?", hint: "Je kunt ook verder als je niet zelf betrokken bent. Antwoord alleen op wat je weet.", options: yesNo },
  { id: "employerFrequency", step: "employer-search", kind: "select", label: "Hoe vaak hebben jullie nieuwe medewerkers nodig?", options: [...options([["continuous", "Doorlopend"], ["several-year", "Meerdere keren per jaar"], ["annual", "Ongeveer één keer per jaar"], ["less-often", "Minder vaak"], ["never", "We hebben geen nieuwe medewerkers nodig"]]), unknown] },
  { id: "employerRecruiters", step: "employer-search", kind: "multi", label: "Wie houdt zich bij jullie bezig met het vinden van nieuwe medewerkers?", options: [...options([["owner", "Eigenaar / directie"], ["manager", "Leidinggevende"], ["hr", "HR"], ["recruiter", "Interne recruiter"], ["agency", "Extern recruitmentbureau"], ["temp-agency", "Uitzendbureau"]]), other, { value: "none", label: "Niemand", exclusive: true }, unknown] },
  { id: "employerRecentHiring", step: "employer-search", kind: "choice", label: "Hebben jullie de afgelopen twee jaar geprobeerd nieuwe medewerkers te vinden?", hint: "Ook als er uiteindelijk niemand is aangenomen.", options: [...yesNo, unknown] },
  { id: "employerChannels", step: "employer-search", kind: "multi", label: "Welke manieren hebben jullie daarvoor gebruikt?", hint: "Denk aan de afgelopen twee jaar.", options: employerChannels, visible: hiredRecently },
  { id: "employerEffectiveChannels", step: "employer-search", kind: "multi", label: "Welke van deze manieren leverden de meest geschikte kandidaten op?", options: employerChannels, visible: (a) => hiredRecently(a) && multiAnswer(a, "employerChannels").some((v) => v !== "unknown") },
  { id: "employerBarriers", step: "employer-search", kind: "multi", label: "Waar liepen jullie daarbij tegenaan?", options: [...options([["few-responses", "Te weinig reacties"], ["unsuitable", "Reacties passen niet bij wat we zoeken"], ["dropout", "Kandidaten haken tijdens het proces af"], ["conditions", "Salaris of arbeidsvoorwaarden sluiten niet aan"], ["competition", "Veel concurrentie van andere werkgevers"], ["capacity", "Weinig tijd of capaciteit voor werving"], ["assessment", "Kandidaten goed beoordelen is lastig"], ["slow", "Het duurt lang voordat iemand gevonden is"]]), other, none, unknown], visible: hiredRecently },
  { id: "employerPriorities", step: "employer-experience", kind: "multi", label: "Wat vinden jullie het belangrijkst bij een nieuwe medewerker?", hint: "Ook als jullie nu niemand zoeken.", max: 3, options: [...options([["motivation", "Motivatie"], ["experience", "Werkervaring"], ["skills", "Vaardigheden"], ["education", "Opleiding"], ["learning", "Bereidheid en vermogen om te leren"], ["availability", "Beschikbaarheid"], ["reliability", "Betrouwbaarheid"], ["team", "Passend bij het team / de cultuur"], ["salary", "Salarisverwachting"]]), other, unknown] },
  { id: "employerEarlyDeparture", step: "employer-experience", kind: "choice", label: "Hebben jullie meegemaakt dat een nieuwe medewerker binnen een jaar weer vertrok?", options: [...yesNo, unknown, { ...notApplicable, label: "We hebben nog geen medewerkers aangenomen" }] },
  { id: "employerDepartureReason", step: "employer-experience", kind: "select", label: "Wat was volgens jou de belangrijkste reden?", hint: "Denk aan de meest recente keer dat dit gebeurde.", visible: (a) => hasAnswer(a, "employerEarlyDeparture", "yes"), options: [...options([["work-fit", "Het werk bleek niet passend"], ["team", "Sfeer / team"], ["manager", "Leidinggevende"], ["conditions", "Salaris / arbeidsvoorwaarden"], ["hours", "Werktijden"], ["development", "Te weinig ontwikkeling"], ["other-job", "Ander werk gevonden"], ["private", "Privéreden"], ["performance", "Functioneren"]]), other, unknown] },
  { id: "personalSituation", step: "personal-context", kind: "multi", label: "Wat is je huidige situatie?", hint: "Ook een bijbaan telt als werk. Werken en studeren kunnen samen.", options: [...options([["employed", "Ik werk in loondienst"], ["self-employed", "Ik werk als zelfstandige"], ["student", "Ik studeer"], ["not-working", "Ik werk op dit moment niet"]]), other] },
  { id: "personalHome", step: "personal-context", kind: "text", label: "Waar woon je?", optional: true },
  { id: "personalSector", step: "personal-context", kind: "select", label: "In welke sector werk je?", options: sectors, visible: isWorking },
  { id: "personalSize", step: "personal-context", kind: "select", label: "Hoeveel mensen werken er in de hele organisatie?", options: sizes, visible: isWorking },
  { id: "personalWorkplace", step: "personal-context", kind: "text", label: "In welke plaats werk je?", optional: true, hint: "Geen vaste werkplek? Laat dit veld dan leeg.", visible: isWorking },
  // Retired question: retain its storage position so existing Sheet columns do not shift.
  { id: "personalTenure", step: "personal-context", kind: "select", label: "Hoe lang werk je daar al?", options: options([["under-1", "Korter dan 1 jaar"], ["1-to-3", "1 tot minder dan 3 jaar"], ["3-to-5", "3 tot en met 5 jaar"], ["over-5", "Langer dan 5 jaar"]]), visible: () => false },
  { id: "personalOpenness", step: "personal-search", kind: "choice", label: "Hoe sta je tegenover nieuw of ander werk?", options: options([["active", "Ik zoek actief naar werk"], ["open", "Ik zoek niet actief, maar sta wel open voor iets anders"], ["closed", "Ik sta nu niet open voor ander werk"]]) },
  { id: "personalRecentSearch", step: "personal-search", kind: "choice", label: "Heb je de afgelopen twee jaar naar nieuw of ander werk gekeken?", options: options([["active", "Ja, ik heb actief gezocht"], ["browsing", "Ja, ik heb vooral rondgekeken"], ["no", "Nee"]]) },
  { id: "personalChannels", step: "personal-search", kind: "multi", label: "Waar heb je naar werk gezocht of rondgekeken?", options: personalChannels },
  { id: "personalPriorities", step: "personal-experience", kind: "multi", label: "Wat vind je het belangrijkst in een nieuwe baan?", max: 3, options: [...options([["salary", "Salaris"], ["team", "Sfeer en manier van samenwerken"], ["work", "Inhoud van het werk"], ["flexibility", "Flexibiliteit"], ["development", "Mogelijkheden om te ontwikkelen"], ["commute", "Reistijd"], ["hours", "Werktijden"], ["security", "Zekerheid / contract"], ["purpose", "Doel / betekenis van het bedrijf"]]), other, unknown] },
  { id: "personalBarriers", step: "personal-experience", kind: "multi", label: "Waardoor ben je afgehaakt bij een vacature of sollicitatie?", options: [...personalBarriers, other] },
  { id: "personalMissingInfo", step: "personal-experience", kind: "multi", label: "Welke informatie over het werk miste je tijdens je zoektocht?", visible: recentSearch, options: [...options([["salary", "Salaris"], ["hours", "Werktijden"], ["work", "Concrete werkzaamheden"], ["team", "Team / sfeer"], ["development", "Ontwikkelmogelijkheden"], ["flexibility", "Flexibiliteit"], ["security", "Contract / zekerheid"], ["location", "Werklocatie"], ["process", "Hoe het sollicitatieproces verloopt"]]), other, { value: "none", label: "Eigenlijk niets", exclusive: true }, unknown] },
  { id: "personalChecks", step: "personal-experience", kind: "multi", label: "Wat heb je over werkgevers bekeken voordat je verder ging?", options: [...options([["website", "Website van het bedrijf"], ["social", "Andere social media"], ["linkedin", "LinkedIn"], ["reviews", "Reviews"], ["contacts", "Mensen die ik ken"], ["location", "Locatie / reistijd"], ["team", "Medewerkers / sfeer"]]), other, unknown] },
  { id: "personalMismatch", step: "personal-experience", kind: "choice", label: "Heb je meegemaakt dat een baan anders bleek dan je vooraf dacht?", options: [...yesNo, { value: "no-experience", label: "Nog geen werkervaring" }] },
  { id: "personalMismatchReason", step: "personal-experience", kind: "select", label: "Wat was bij die baan het grootste verschil met je verwachtingen?", hint: "Denk aan de meest recente keer dat dit gebeurde.", visible: (a) => hasAnswer(a, "personalMismatch", "yes"), options: [...options([["work", "Werkzaamheden"], ["hours", "Werktijden"], ["conditions", "Salaris / arbeidsvoorwaarden"], ["team", "Sfeer / team"], ["manager", "Leidinggevende"], ["pressure", "Werkdruk"], ["development", "Ontwikkelmogelijkheden"], ["flexibility", "Flexibiliteit"]]), other, unknown] },
];

export function resolveQuestion(question: Question, answers: AnswerValues): Question {
  if (question.id === "employerEffectiveChannels") {
    const selected = multiAnswer(answers, "employerChannels");
    return { ...question, options: [
      ...employerChannels.filter((option) => !option.exclusive && selected.includes(option.value)).map((option) => option.value === "other" ? { ...option, label: textAnswer(answers, "employerChannelsOther") || "Andere gebruikte manier" } : option),
      ...(selected.filter((value) => value !== "unknown").length > 1 ? [{ value: "no-difference", label: "Wel geschikte kandidaten, geen duidelijk verschil", exclusive: true }] : []),
      { value: "no-candidates", label: "Nog geen geschikte kandidaten opgeleverd", exclusive: true }, unknown,
    ] };
  }
  if (question.id === "personalChannels") return { ...question, label: recentSearch(answers) ? question.label : "Waar zou je beginnen als je werk zou zoeken?", hint: recentSearch(answers) ? "Denk aan de afgelopen twee jaar." : undefined };
  if (question.id === "personalBarriers") return { ...question,
    label: recentSearch(answers) ? question.label : "Wat zou voor jou een reden zijn om af te haken?",
    hint: recentSearch(answers) ? "Denk aan de afgelopen twee jaar." : "Je hoeft dit niet te hebben meegemaakt.",
    options: [...personalBarriers, other, ...(recentSearch(answers) ? [{ value: "none", label: "Ik ben niet afgehaakt", exclusive: true }] : []), unknown],
  };
  if (question.id === "personalChecks") return { ...question, label: recentSearch(answers) ? question.label : "Wat zou je over een werkgever bekijken voordat je verder gaat?", hint: recentSearch(answers) ? "Denk aan de afgelopen twee jaar." : undefined };
  return question;
}
export function getQuestions(step: ContentStep, answers: AnswerValues): Question[] {
  return questions.filter((q) => q.step === step && (!q.visible || q.visible(answers))).map((q) => resolveQuestion(q, answers));
}
export function hasOther(question: Question, answers: AnswerValues): boolean {
  return question.id !== "employerEffectiveChannels" && !!question.options?.some((option) => option.value === "other") && hasAnswer(answers, question.id, "other");
}
export function toggleChoice(question: Question, values: string[], value: string): string[] {
  if (values.includes(value)) return values.filter((v) => v !== value);
  if (question.options?.find((option) => option.value === value)?.exclusive) return [value];
  let next = values.filter((v) => !question.options?.find((option) => option.value === v)?.exclusive);
  if (question.id === "personalSituation") {
    if (value === "not-working") next = next.filter((v) => v !== "employed" && v !== "self-employed");
    if (value === "employed" || value === "self-employed") next = next.filter((v) => v !== "not-working");
  }
  return [...next, value];
}
