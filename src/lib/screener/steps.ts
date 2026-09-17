export const participantOptions = [
  { value: "employer", label: "Ik ben betrokken bij het aannemen of werven van personeel" },
  { value: "job-seeker", label: "Ik wil vertellen over mijn eigen ervaring met werk vinden, overstappen of blijven" },
  { value: "both", label: "Beide" },
] as const;

export type ParticipantType = (typeof participantOptions)[number]["value"];
export type YesNo = "yes" | "no";
export type YesMaybeNo = YesNo | "maybe";

export const yesNoOptions = [
  { value: "yes", label: "Ja" },
  { value: "no", label: "Nee" },
] as const;
export const yesMaybeNoOptions = [
  { value: "yes", label: "Ja" },
  { value: "maybe", label: "Misschien" },
  { value: "no", label: "Nee" },
] as const;

export const employerSizeOptions = ["1", "2–5", "6–10", "11–19", "20–49", "50–99", "100+"] as const;
export const employerRoleOptions = [
  { value: "direct", label: "Ja, direct" },
  { value: "partial", label: "Ja, soms of gedeeltelijk" },
  { value: "no", label: "Nee" },
] as const;
export const workerSituationOptions = [
  { value: "employed", label: "Ik werk in loondienst" },
  { value: "self-employed", label: "Ik werk zelfstandig" },
  { value: "unemployed", label: "Ik zoek werk en heb momenteel geen baan" },
  { value: "student-working", label: "Ik studeer en werk daarnaast" },
  { value: "other", label: "Anders, namelijk…" },
] as const;
export const workerDecisionOptions = [
  { value: "changed-job", label: "Ik ben overgestapt naar ander werk" },
  { value: "considered-stayed", label: "Ik heb ander werk overwogen maar ben gebleven" },
  { value: "applied-stayed", label: "Ik heb gesolliciteerd of gesprekken gevoerd zonder over te stappen" },
  { value: "chose-to-stay", label: "Ik heb bewust besloten niet te zoeken of te blijven" },
  { value: "none", label: "Geen van deze situaties" },
] as const;
export const contactPreferenceOptions = [
  { value: "email", label: "E-mail" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "call", label: "Bellen" },
  { value: "any", label: "Maakt niet uit" },
] as const;

export type WorkerDecision = (typeof workerDecisionOptions)[number]["value"];
export type Answers = {
  participantType: string;
  employerLocation: string;
  employerSize: string;
  employerHiringRole: string;
  employerRecurringNeed: string;
  employerCase: string;
  employerFunctions: string;
  employerInterview: string;
  workerHomeLocation: string;
  workerWorkLocation: string;
  workerSituation: string;
  workerSituationOther: string;
  workerActiveSearch: string;
  workerOpenToWork: string;
  workerOpenReason: string;
  workerDecisions: WorkerDecision[];
  workerCase: string;
  workerInterview: string;
  name: string;
  email: string;
  phone: string;
  contactPreference: string;
  consent: string;
};

export const initialAnswers: Answers = {
  participantType: "",
  employerLocation: "",
  employerSize: "",
  employerHiringRole: "",
  employerRecurringNeed: "",
  employerCase: "",
  employerFunctions: "",
  employerInterview: "",
  workerHomeLocation: "",
  workerWorkLocation: "",
  workerSituation: "",
  workerSituationOther: "",
  workerActiveSearch: "",
  workerOpenToWork: "",
  workerOpenReason: "",
  workerDecisions: [],
  workerCase: "",
  workerInterview: "",
  name: "",
  email: "",
  phone: "",
  contactPreference: "",
  consent: "",
};

type TextField = {
  [Key in keyof Answers]: Answers[Key] extends string ? Key : never;
}[keyof Answers];
type QuestionBase = { label: string; title: string; description: string };
export type ChoiceQuestion = QuestionBase & {
  kind: "choice";
  field: TextField;
  options: readonly { value: string; label: string }[];
};
export type TextQuestion = QuestionBase & {
  kind: "text";
  field: TextField;
  placeholder: string;
  optional?: boolean;
  inputType?: "email" | "tel";
  autoComplete?: "given-name" | "email" | "tel";
  maxLength: number;
};
export type MultipleQuestion = QuestionBase & {
  kind: "multiple";
  field: "workerDecisions";
  options: typeof workerDecisionOptions;
};
export type LocationsQuestion = QuestionBase & { kind: "locations" };
export type Question = ChoiceQuestion | TextQuestion | MultipleQuestion | LocationsQuestion;

export const questions = {
  participant: { kind: "choice", field: "participantType", label: "Kennismaken", title: "Welke situatie past het beste bij jou?", description: "Kies één optie.", options: participantOptions },
  employerLocation: { kind: "text", field: "employerLocation", label: "Als werkgever", title: "Waar is de vestiging waar jij werkt gevestigd?", description: "Een plaatsnaam is genoeg.", placeholder: "Bijvoorbeeld: Venlo", maxLength: 120 },
  employerSize: { kind: "choice", field: "employerSize", label: "Als werkgever", title: "Ongeveer hoeveel mensen werken op deze vestiging?", description: "Een schatting is voldoende.", options: employerSizeOptions.map((value) => ({ value, label: value })) },
  employerHiringRole: { kind: "choice", field: "employerHiringRole", label: "Als werkgever", title: "Ben jij betrokken bij het aannemen, zoeken of selecteren van personeel?", description: "Ook gedeeltelijke betrokkenheid telt mee.", options: employerRoleOptions },
  employerRecurringNeed: { kind: "choice", field: "employerRecurringNeed", label: "Als werkgever", title: "Heeft jullie organisatie de afgelopen twee jaar meerdere keren nieuw personeel nodig gehad?", description: "Kies wat het beste past.", options: [{ value: "yes", label: "Ja" }, { value: "no", label: "Nee" }, { value: "unsure", label: "Weet ik niet zeker" }] },
  employerCase: { kind: "choice", field: "employerCase", label: "Als werkgever", title: "Kun je een recente situatie bedenken waarin het aannemen van iemand goed ging, moeilijk ging of niet doorging?", description: "Een concreet voorbeeld is genoeg; het hoeft niet moeilijk te zijn gegaan.", options: yesMaybeNoOptions },
  employerFunctions: { kind: "text", field: "employerFunctions", label: "Als werkgever", title: "Voor wat voor soort functies hadden jullie recent personeel nodig?", description: "Een korte omschrijving is genoeg.", placeholder: "Bijvoorbeeld: productie, techniek of horeca", maxLength: 200 },
  employerInterview: { kind: "choice", field: "employerInterview", label: "Gesprek", title: "Zou je hierover ongeveer 30 minuten met mij in gesprek willen?", description: "Je mag ook 'misschien' kiezen.", options: yesMaybeNoOptions },
  workerLocations: { kind: "locations", label: "Over jouw werk", title: "Waar woon en werk je?", description: "Vul alleen plaatsnamen in. Beide velden zijn optioneel." },
  workerSituation: { kind: "choice", field: "workerSituation", label: "Over jouw werk", title: "Welke situatie past nu het beste bij jou?", description: "Kies één optie. Dit bepaalt niet automatisch of je kunt meedoen.", options: workerSituationOptions },
  workerSituationOther: { kind: "text", field: "workerSituationOther", label: "Over jouw werk", title: "Wat is jouw situatie?", description: "Omschrijf het kort.", placeholder: "Jouw situatie", maxLength: 200 },
  workerActiveSearch: { kind: "choice", field: "workerActiveSearch", label: "Over jouw werk", title: "Heb je in de afgelopen drie maanden gericht iets gedaan om ander werk te vinden?", description: "Bijvoorbeeld vacatures gezocht, iemand benaderd, gereageerd of gesolliciteerd.", options: yesNoOptions },
  workerOpenToWork: { kind: "choice", field: "workerOpenToWork", label: "Over jouw werk", title: "Zou je onder bepaalde omstandigheden serieus ander werk overwegen?", description: "Ook als je nu niet actief zoekt.", options: yesMaybeNoOptions },
  workerOpenReason: { kind: "text", field: "workerOpenReason", label: "Over jouw werk", title: "Wat zou ervoor kunnen zorgen dat je ander werk serieus zou overwegen?", description: "Je mag deze vraag overslaan.", placeholder: "Een korte toelichting (optioneel)", optional: true, maxLength: 200 },
  workerDecisions: { kind: "multiple", field: "workerDecisions", label: "Over jouw werk", title: "Welke situatie heb je de afgelopen twee jaar meegemaakt?", description: "Meerdere antwoorden zijn mogelijk.", options: workerDecisionOptions },
  workerCase: { kind: "choice", field: "workerCase", label: "Over jouw werk", title: "Zou je tijdens een gesprek één zo'n concrete situatie stap voor stap kunnen bespreken?", description: "Kies wat voor jou klopt.", options: yesMaybeNoOptions },
  workerInterview: { kind: "choice", field: "workerInterview", label: "Gesprek", title: "Zou je hierover ongeveer 30 minuten met mij in gesprek willen?", description: "Je mag ook 'misschien' kiezen.", options: yesMaybeNoOptions },
  name: { kind: "text", field: "name", label: "Bijna klaar", title: "Voornaam", description: "Als je binnen het onderzoek past, neem ik contact op om te kijken of we een gesprek kunnen plannen. Hoe mag ik je aanspreken?", placeholder: "Jouw voornaam", autoComplete: "given-name", maxLength: 120 },
  email: { kind: "text", field: "email", label: "Bijna klaar", title: "E-mailadres", description: "Hierop kan ik contact met je opnemen over het onderzoek.", placeholder: "naam@voorbeeld.nl", inputType: "email", autoComplete: "email", maxLength: 254 },
  phone: { kind: "text", field: "phone", label: "Bijna klaar", title: "Telefoonnummer", description: "Optioneel. Vul dit in als je via WhatsApp of telefonisch bereikbaar wilt zijn.", placeholder: "Telefoonnummer (optioneel)", inputType: "tel", autoComplete: "tel", optional: true, maxLength: 30 },
  contactPreference: { kind: "choice", field: "contactPreference", label: "Bijna klaar", title: "Hoe neem ik het liefst contact met je op?", description: "Kies één optie.", options: contactPreferenceOptions },
  consent: { kind: "choice", field: "consent", label: "Toestemming en privacy", title: "Mag ik je gegevens gebruiken om contact met je op te nemen over dit onderzoek?", description: "Je gegevens worden alleen gebruikt voor contact over dit afstudeeronderzoek en niet gedeeld voor commerciële doeleinden.", options: yesNoOptions },
} as const satisfies Record<string, Question>;

export type QuestionId = keyof typeof questions;
export type StepId = "intro" | "bridge" | QuestionId | "complete";

export function wantsInterview(value: string): boolean {
  return value === "yes" || value === "maybe";
}

export function getQuestionIds(answers: Answers): QuestionId[] {
  const route: QuestionId[] = ["participant"];
  const hasEmployer = answers.participantType === "employer" || answers.participantType === "both";
  const hasWorker = answers.participantType === "job-seeker" || answers.participantType === "both";

  if (hasEmployer) {
    route.push("employerLocation", "employerSize", "employerHiringRole");
    if (answers.employerHiringRole !== "no") {
      route.push("employerRecurringNeed", "employerCase", "employerFunctions", "employerInterview");
    }
  }

  if (hasWorker) {
    route.push("workerLocations", "workerSituation");
    if (answers.workerSituation === "other") route.push("workerSituationOther");
    route.push("workerActiveSearch");
    if (answers.workerActiveSearch === "no") {
      route.push("workerOpenToWork");
      if (wantsInterview(answers.workerOpenToWork)) route.push("workerOpenReason");
    }
    route.push("workerDecisions", "workerCase", "workerInterview");
  }

  const mayContact =
    (hasEmployer && answers.employerHiringRole !== "no" && wantsInterview(answers.employerInterview)) ||
    (hasWorker && wantsInterview(answers.workerInterview));
  if (mayContact) route.push("name", "email", "phone", "contactPreference", "consent");
  return route;
}

export function getSteps(answers: Answers): StepId[] {
  const route: StepId[] = getQuestionIds(answers);
  if (answers.participantType === "both") {
    route.splice(route.indexOf("workerLocations"), 0, "bridge");
  }
  return ["intro", ...route, "complete"];
}

export function validateStep(step: StepId, answers: Answers): string | null {
  if (step === "intro" || step === "bridge" || step === "complete") return null;
  const question: Question = questions[step];
  if (question.kind === "locations") {
    if (answers.workerHomeLocation.trim().length > 120) return "Gebruik maximaal 120 tekens voor je woonplaats.";
    if (answers.workerWorkLocation.trim().length > 120) return "Gebruik maximaal 120 tekens voor je werkplaats.";
    return null;
  }
  if (question.kind === "multiple") {
    const values = answers.workerDecisions;
    if (values.length === 0) return "Kies minstens één situatie.";
    if (values.includes("none") && values.length > 1) return "'Geen van deze situaties' kun je niet combineren met andere antwoorden.";
    return values.every((value) => workerDecisionOptions.some((option) => option.value === value)) &&
      new Set(values).size === values.length
      ? null
      : "Kies een geldig antwoord.";
  }
  const value = answers[question.field].trim();
  if (question.kind === "choice") {
    if (!question.options.some((option) => option.value === value)) return "Kies een antwoord om verder te gaan.";
    return null;
  }
  if (!value && !question.optional) return "Vul dit veld in om verder te gaan.";
  if (value.length > question.maxLength) return `Gebruik maximaal ${question.maxLength} tekens.`;
  if (step === "email" && !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value)) return "Vul een geldig e-mailadres in.";
  if (step === "phone" && value && !/^\+?[\d\s().-]{6,30}$/.test(value)) return "Vul een geldig telefoonnummer in of laat dit veld leeg.";
  if (step === "phone" && !value && (answers.contactPreference === "whatsapp" || answers.contactPreference === "call")) return "Vul een telefoonnummer in voor WhatsApp of bellen.";
  return null;
}

export function firstInvalidStep(answers: Answers): QuestionId | undefined {
  return getQuestionIds(answers).find((id) => validateStep(id, answers) !== null);
}

export type EmployerResponse = {
  location: string;
  size: string;
  hiringRole: "direct" | "partial" | "no";
  recurringNeed?: "yes" | "no" | "unsure";
  concreteCase?: YesMaybeNo;
  functions?: string;
  interview?: YesMaybeNo;
};
export type WorkerResponse = {
  homeLocation?: string;
  workLocation?: string;
  situation: (typeof workerSituationOptions)[number]["value"];
  situationOther?: string;
  activeSearch: YesNo;
  openToWork?: YesMaybeNo;
  openReason?: string;
  decisions: WorkerDecision[];
  concreteCase: YesMaybeNo;
  interview: YesMaybeNo;
};
export type ContactResponse = {
  name: string;
  email: string;
  phone?: string;
  preference: (typeof contactPreferenceOptions)[number]["value"];
};
export type Submission = {
  participantType: ParticipantType;
  employer?: EmployerResponse;
  worker?: WorkerResponse;
  interviewInterest: boolean;
  consent: boolean;
  contact?: ContactResponse;
};

export function createSubmission(answers: Answers): Submission {
  const invalid = firstInvalidStep(answers);
  if (invalid) throw new Error(`Ongeldig antwoord: ${invalid}`);
  const participantType = answers.participantType as ParticipantType;
  const hasEmployer = participantType === "employer" || participantType === "both";
  const hasWorker = participantType === "job-seeker" || participantType === "both";
  const interviewInterest =
    (hasEmployer && answers.employerHiringRole !== "no" && wantsInterview(answers.employerInterview)) ||
    (hasWorker && wantsInterview(answers.workerInterview));
  const consent = interviewInterest && answers.consent === "yes";

  const employer: EmployerResponse | undefined = hasEmployer
    ? {
        location: answers.employerLocation.trim(),
        size: answers.employerSize,
        hiringRole: answers.employerHiringRole as EmployerResponse["hiringRole"],
        ...(answers.employerHiringRole !== "no"
          ? {
              recurringNeed: answers.employerRecurringNeed as NonNullable<EmployerResponse["recurringNeed"]>,
              concreteCase: answers.employerCase as YesMaybeNo,
              functions: answers.employerFunctions.trim(),
              interview: answers.employerInterview as YesMaybeNo,
            }
          : {}),
      }
    : undefined;
  const worker: WorkerResponse | undefined = hasWorker
    ? {
        ...(answers.workerHomeLocation.trim() ? { homeLocation: answers.workerHomeLocation.trim() } : {}),
        ...(answers.workerWorkLocation.trim() ? { workLocation: answers.workerWorkLocation.trim() } : {}),
        situation: answers.workerSituation as WorkerResponse["situation"],
        ...(answers.workerSituation === "other" ? { situationOther: answers.workerSituationOther.trim() } : {}),
        activeSearch: answers.workerActiveSearch as YesNo,
        ...(answers.workerActiveSearch === "no"
          ? {
              openToWork: answers.workerOpenToWork as YesMaybeNo,
              ...(wantsInterview(answers.workerOpenToWork) && answers.workerOpenReason.trim()
                ? { openReason: answers.workerOpenReason.trim() }
                : {}),
            }
          : {}),
        decisions: answers.workerDecisions,
        concreteCase: answers.workerCase as YesMaybeNo,
        interview: answers.workerInterview as YesMaybeNo,
      }
    : undefined;

  const contact: ContactResponse | undefined = consent
    ? {
        name: answers.name.trim(),
        email: answers.email.trim(),
        ...(answers.phone.trim() ? { phone: answers.phone.trim() } : {}),
        preference: answers.contactPreference as ContactResponse["preference"],
      }
    : undefined;

  return {
    participantType,
    ...(employer ? { employer } : {}),
    ...(worker ? { worker } : {}),
    interviewInterest,
    consent,
    ...(contact ? { contact } : {}),
  };
}
