export const participantOptions = [
  {
    value: "job-seeker",
    label: "Ik heb recent naar werk gezocht of ben momenteel werkzoekend",
  },
  {
    value: "employer",
    label: "Ik ben betrokken bij het zoeken of selecteren van medewerkers",
  },
  { value: "both", label: "Beide" },
] as const;

export const yesNoOptions = [
  { value: "yes", label: "Ja" },
  { value: "no", label: "Nee" },
] as const;

export type ParticipantType = (typeof participantOptions)[number]["value"];
export type YesNo = (typeof yesNoOptions)[number]["value"];

// Draft values remain intact when a participant changes routes.
export type Answers = {
  participantType: string;
  jobSeekerExperience: string;
  workType: string;
  employerExperience: string;
  employerRole: string;
  organizationType: string;
  interview: string;
  name: string;
  email: string;
};

export const initialAnswers: Answers = {
  participantType: "",
  jobSeekerExperience: "",
  workType: "",
  employerExperience: "",
  employerRole: "",
  organizationType: "",
  interview: "",
  name: "",
  email: "",
};

type QuestionBase = { label: string; title: string; description: string };
export type ChoiceQuestion = QuestionBase & {
  kind: "choice";
  field:
    | "participantType"
    | "jobSeekerExperience"
    | "employerExperience"
    | "interview";
  options: readonly { value: string; label: string }[];
};
export type TextQuestion = QuestionBase & {
  kind: "text";
  field: "workType" | "employerRole" | "organizationType" | "name" | "email";
  placeholder: string;
  inputType?: "email";
  autoComplete?: "name" | "email";
  maxLength: number;
};
export type Question = ChoiceQuestion | TextQuestion;

export const questions = {
  participant: {
    kind: "choice",
    field: "participantType",
    label: "Kennismaken",
    title: "Welke situatie past het beste bij jou?",
    description: "Kies één optie.",
    options: participantOptions,
  },
  jobSeekerExperience: {
    kind: "choice",
    field: "jobSeekerExperience",
    label: "Als werkzoekende",
    title:
      "Heb je in de afgelopen 12 maanden actief naar werk gezocht, vacatures bekeken of een overstap overwogen?",
    description: "Denk aan je eigen zoektocht naar werk.",
    options: yesNoOptions,
  },
  workType: {
    kind: "text",
    field: "workType",
    label: "Als werkzoekende",
    title: "Welk soort werk zoek je, of heb je recent gezocht?",
    description: "Een korte omschrijving is genoeg.",
    placeholder: "Bijvoorbeeld: marketing, bouw of IT",
    maxLength: 500,
  },
  employerExperience: {
    kind: "choice",
    field: "employerExperience",
    label: "Als werkgever",
    title:
      "Ben je in de afgelopen 12 maanden betrokken geweest bij het zoeken, beoordelen of aannemen van medewerkers?",
    description:
      "Denk aan je ervaring met het vinden van medewerkers.",
    options: yesNoOptions,
  },
  employerRole: {
    kind: "text",
    field: "employerRole",
    label: "Als werkgever",
    title: "Wat is jouw rol bij het zoeken of selecteren van medewerkers?",
    description: "Omschrijf kort hoe je hierbij betrokken bent.",
    placeholder: "Bijvoorbeeld: leidinggevende, recruiter of ondernemer",
    maxLength: 500,
  },
  organizationType: {
    kind: "text",
    field: "organizationType",
    label: "Als werkgever",
    title: "Wat voor soort organisatie is dit?",
    description: "Denk aan de branche of het soort organisatie.",
    placeholder: "Bijvoorbeeld: een klein bouwbedrijf of een zorginstelling",
    maxLength: 500,
  },
  interview: {
    kind: "choice",
    field: "interview",
    label: "Contact",
    title: "Sta je open voor een kort interview van ongeveer 30 minuten?",
    description:
      "Je kunt ook afronden als je geen interview wilt.",
    options: yesNoOptions,
  },
  name: {
    kind: "text",
    field: "name",
    label: "Contact",
    title: "Naam",
    description: "Laat weten hoe ik je mag aanspreken.",
    placeholder: "Jouw naam",
    autoComplete: "name",
    maxLength: 120,
  },
  email: {
    kind: "text",
    field: "email",
    label: "Contact",
    title: "E-mailadres",
    description:
      "Hierop kan ik je benaderen voor een interview.",
    placeholder: "naam@voorbeeld.nl",
    inputType: "email",
    autoComplete: "email",
    maxLength: 254,
  },
} satisfies Record<string, Question>;

export type QuestionId = keyof typeof questions;
export type StepId = "intro" | QuestionId | "complete";

export function getQuestionIds(answers: Answers): QuestionId[] {
  const route: QuestionId[] = ["participant"];
  if (
    answers.participantType === "job-seeker" ||
    answers.participantType === "both"
  ) {
    route.push("jobSeekerExperience", "workType");
  }
  if (
    answers.participantType === "employer" ||
    answers.participantType === "both"
  ) {
    route.push("employerExperience", "employerRole", "organizationType");
  }
  route.push("interview");
  if (answers.interview === "yes") route.push("name", "email");
  return route;
}

export function getSteps(answers: Answers): StepId[] {
  return ["intro", ...getQuestionIds(answers), "complete"];
}

export function validateStep(step: StepId, answers: Answers): string | null {
  if (step === "intro" || step === "complete") return null;
  const question: Question = questions[step];
  const value = answers[question.field].trim();
  if (question.kind === "choice") {
    return question.options.some((option) => option.value === value)
      ? null
      : step === "participant"
        ? "Kies de situatie die het beste bij je past."
        : "Kies ja of nee om verder te gaan.";
  }
  if (!value)
    return step === "name"
      ? "Vul je naam in."
      : step === "email"
        ? "Vul je e-mailadres in."
        : "Vul een korte omschrijving in.";
  if (value.length > question.maxLength)
    return `Gebruik maximaal ${question.maxLength} tekens.`;
  if (step === "email" && !/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value)) {
    return "Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl.";
  }
  return null;
}

export function firstInvalidStep(answers: Answers): QuestionId | undefined {
  return getQuestionIds(answers).find(
    (id) => validateStep(id, answers) !== null,
  );
}

type JobSeekerResponse = { experienceLast12Months: YesNo; workType: string };
type EmployerResponse = {
  experienceLast12Months: YesNo;
  role: string;
  organizationType: string;
};
type RouteResponse =
  | {
      participantType: "job-seeker";
      jobSeeker: JobSeekerResponse;
      employer?: never;
    }
  | {
      participantType: "employer";
      employer: EmployerResponse;
      jobSeeker?: never;
    }
  | {
      participantType: "both";
      jobSeeker: JobSeekerResponse;
      employer: EmployerResponse;
    };
type ContactResponse =
  | {
      openToInterview: true;
      consent: true;
      contact: { name: string; email: string };
    }
  | { openToInterview: false; consent: false; contact?: never };
export type Submission = RouteResponse & ContactResponse;

function yesNo(value: string): YesNo {
  if (value !== "yes" && value !== "no")
    throw new Error("Een ervaringsantwoord ontbreekt.");
  return value;
}

// Only active routes and explicitly requested contact details enter the result.
export function createSubmission(answers: Answers): Submission {
  const invalid = firstInvalidStep(answers);
  if (invalid) throw new Error(`Ongeldig antwoord: ${invalid}`);
  const contact: ContactResponse =
    answers.interview === "yes"
      ? {
          openToInterview: true,
          consent: true,
          contact: { name: answers.name.trim(), email: answers.email.trim() },
        }
      : { openToInterview: false, consent: false };
  const jobSeeker = (): JobSeekerResponse => ({
    experienceLast12Months: yesNo(answers.jobSeekerExperience),
    workType: answers.workType.trim(),
  });
  const employer = (): EmployerResponse => ({
    experienceLast12Months: yesNo(answers.employerExperience),
    role: answers.employerRole.trim(),
    organizationType: answers.organizationType.trim(),
  });
  switch (answers.participantType) {
    case "job-seeker":
      return {
        participantType: "job-seeker",
        jobSeeker: jobSeeker(),
        ...contact,
      };
    case "employer":
      return { participantType: "employer", employer: employer(), ...contact };
    case "both":
      return {
        participantType: "both",
        jobSeeker: jobSeeker(),
        employer: employer(),
        ...contact,
      };
    default:
      throw new Error("Ongeldig deelnemertype.");
  }
}
