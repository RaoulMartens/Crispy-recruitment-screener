import { randomUUID } from "node:crypto";
import { initialResearch, getResearchSteps, isContentStep, createResearchSubmission } from "../src/lib/screener/research.ts";
import { getQuestions } from "../src/lib/screener/research-questions.ts";

export function researchState(participantType = "both", firstRoute = "employer", overrides = {}) {
  const state = { ...initialResearch, participantType, firstRoute, secondRoute: "yes", interviewConsent: "no", answers: {}, ...overrides };
  for (const step of getResearchSteps(state).filter(isContentStep)) {
    // Re-resolve after each parent question to include its conditional children.
    for (let i = 0; i < getQuestions(step, state.answers).length; i++) {
      const question = getQuestions(step, state.answers)[i];
      if (state.answers[question.id] !== undefined) continue;
      state.answers[question.id] = question.kind === "text" ? "Venlo" : question.kind === "multi" ? [question.options[0].value] : question.options[0].value;
    }
  }
  return state;
}
export function researchPayload(state = researchState(), id = randomUUID()) { return createResearchSubmission(state, id); }
