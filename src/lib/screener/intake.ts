import { versionQuestions, getResearchSteps, updateResearchAnswer, validateResearchStep, type ResearchErrors, type ResearchState, type ResearchStep, type Route } from "./research.ts";
import { isWorking, multiAnswer, questions, type ContentStep, type Question } from "./research-questions.ts";

const personalSituation = questions.find((question) => question.id === "personalSituation");
if (!personalSituation) throw new Error("De vraag naar de huidige situatie ontbreekt.");
const roleQuestion = questions.find((question) => question.id === "employerRole");
if (!roleQuestion) throw new Error("De vraag naar de rol ontbreekt.");
export const intakeRoleQuestion = roleQuestion;

export const topicOptions = [
  { value: "personal", label: "Over mezelf: werk zoeken en wat ik belangrijk vind in een baan" },
  { value: "employer", label: "Vanuit een organisatie: medewerkers zoeken en aannemen" },
];

export const intakeQuestion: Question = {
  ...personalSituation,
  hint: undefined,
  options: personalSituation.options?.map((option) => option.value === "other" ? { ...option, exclusive: true } : option.value === "self-employed" ? { ...option, label: "Ik werk als zelfstandige / ondernemer" } : option),
};

export function intakeValues(state: ResearchState): string[] {
  return multiAnswer(state.answers, "personalSituation");
}

export function updateIntake(state: ResearchState, values: string[]): ResearchState {
  return updateResearchAnswer(state, "personalSituation", values);
}

export function updateTopic(state: ResearchState, route: Route): ResearchState {
  return { ...state, participantType: route, firstRoute: route, secondRoute: "no" };
}

export function validateIntake(state: ResearchState): ResearchErrors {
  if (state.participantType !== "personal" && state.participantType !== "employer") return { participantType: "Kies over welk onderwerp je vragen wilt beantwoorden." };
  if (state.participantType === "employer") {
    const { employerRole, employerRoleOther } = validateResearchStep("employer-context", state);
    return {
      ...(employerRole ? { employerRole } : {}),
      ...(employerRoleOther ? { employerRoleOther } : {}),
    };
  }
  const values = intakeValues(state);
  if (values.includes("other") && values.length > 1) return { personalSituation: "Combineer Anders, namelijk niet met andere keuzes." };
  const { personalSituation, personalSituationOther } = validateResearchStep("personal-context", state);
  return {
    ...(personalSituation ? { personalSituation } : {}),
    ...(personalSituationOther ? { personalSituationOther } : {}),
  };
}

export function intakeSteps(state: ResearchState): ResearchStep[] {
  return getResearchSteps(state).filter((step) => step !== "second-route" && (step !== "personal-context" || isWorking(state.answers)));
}

export function intakeQuestions(step: ContentStep, state: ResearchState) {
  const content = versionQuestions(step, state.answers).filter((question) => question.id !== "personalSituation" && question.id !== "employerRole");
  return step === "personal-search" && !isWorking(state.answers)
    ? [...versionQuestions("personal-context", state.answers).filter((question) => question.id === "personalHome"), ...content]
    : content;
}

export function validateIntakeStep(step: ResearchStep, state: ResearchState): ResearchErrors {
  if (step === "intro") return validateIntake(state);
  const errors = validateResearchStep(step, state);
  if (step === "personal-search" && !isWorking(state.answers)) {
    const { personalHome } = validateResearchStep("personal-context", state);
    if (personalHome) errors.personalHome = personalHome;
  }
  return errors;
}
