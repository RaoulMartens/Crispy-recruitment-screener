import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { intakeQuestion, intakeValues, updateIntake, updateTopic, validateIntake, validateIntakeStep, intakeSteps, intakeQuestions } from "../src/lib/screener/intake.ts";
import { initialResearch, createResearchSubmission, parseResearchSubmission, updateResearchAnswer } from "../src/lib/screener/research.ts";
import { toggleChoice } from "../src/lib/screener/research-questions.ts";
import { researchState } from "./research-fixtures.mjs";

test("situation never chooses a perspective; every situation can answer from either perspective", () => {
  assert.ok(validateIntake(initialResearch).participantType);
  for (const situation of [["employed"], ["self-employed"], ["student"], ["not-working"], ["employed", "student"], ["other"]]) {
    let state = updateIntake(initialResearch, situation);
    assert.equal(state.participantType, "");
    state = updateResearchAnswer(state, "personalSituationOther", "Eigen situatie");
    for (const route of ["personal", "employer"]) {
      const start = updateResearchAnswer(updateTopic(state, route), "employerRole", ["owner"]);
      assert.deepEqual(validateIntake(start), {});
      assert.deepEqual(intakeValues(start), situation);
      const compact = route === "personal" && !situation.some(s => s === "employed" || s === "self-employed");
      assert.deepEqual(intakeSteps(start).filter(s => s.endsWith("-context")), compact ? [] : [`${route}-context`]);
      assert.equal(intakeSteps(start).length, compact ? 5 : 6);
      const completed = researchState(route, route, start);
      completed.interviewConsent = "no";
      const payload = createResearchSubmission(completed, randomUUID());
      assert.deepEqual(payload.completedRoutes, [route]);
      assert.deepEqual(parseResearchSubmission(payload), payload);
      if (route === "employer") assert.equal(Object.keys(payload.answers).some(k => k.startsWith("personal")), false);
    }
  }
});

test("situation is required only for personal answers and is never repeated", () => {
  const personal = updateTopic(initialResearch, "personal");
  assert.ok(validateIntake(personal).personalSituation);
  const employer = updateTopic(initialResearch, "employer");
  assert.ok(validateIntake(employer).employerRole);
  assert.equal(intakeQuestions("employer-context", employer).some(q => q.id === "employerRole"), false);
  const otherRole = updateResearchAnswer(employer, "employerRole", ["other"]);
  assert.ok(validateIntake(otherRole).employerRoleOther);
  assert.deepEqual(validateIntake(updateResearchAnswer(otherRole, "employerRoleOther", "Teamcoach")), {});
  assert.equal(intakeQuestions("personal-context", personal).some(q => q.id === "personalSituation"), false);
  const other = updateIntake(personal, ["other"]);
  assert.ok(validateIntake(other).personalSituationOther);
});

test("non-working participants see home once on search with validation and unchanged storage", () => {
  for (const situation of [["student"], ["not-working"], ["student", "not-working"], ["other"]]) {
    let state = updateIntake(updateTopic(researchState(), "personal"), situation);
    state = updateResearchAnswer(state, "personalSituationOther", "Eigen situatie");
    assert.deepEqual(intakeSteps(state), ["intro", "personal-search", "personal-experience", "closing", "complete"]);
    assert.equal(intakeQuestions("personal-search", state)[0].id, "personalHome");
    state = updateResearchAnswer(state, "personalHome", "x".repeat(121));
    assert.ok(validateIntakeStep("personal-search", state).personalHome);
    for (const home of ["", "Venlo"]) {
      state = updateResearchAnswer(state, "personalHome", home);
      assert.deepEqual(validateIntakeStep("personal-search", state), {});
      const payload = createResearchSubmission(state, randomUUID());
      assert.equal(payload.answers.personalHome, home || undefined);
      assert.deepEqual(parseResearchSubmission(payload), payload);
    }
    state = updateIntake(state, ["student", "employed"]);
    assert.ok(intakeSteps(state).includes("personal-context"));
    assert.equal(intakeQuestions("personal-search", state).some(q => q.id === "personalHome"), false);
    assert.equal(intakeQuestions("personal-context", state).filter(q => q.id === "personalHome").length, 1);
  }
});

test("work and study combine while not working excludes working", () => {
  let values = toggleChoice(intakeQuestion, ["employed", "student"], "not-working");
  assert.deepEqual(values, ["student", "not-working"]);
  values = toggleChoice(intakeQuestion, values, "self-employed");
  assert.deepEqual(values, ["student", "self-employed"]);
  assert.ok(validateIntake(updateIntake(updateTopic(initialResearch, "personal"), ["not-working", "employed"])).personalSituation);
});

test("Other is exclusive and its explanation clears when deselected", () => {
  assert.deepEqual(toggleChoice(intakeQuestion, ["employed", "student"], "other"), ["other"]);
  const explained = updateResearchAnswer(updateIntake(updateTopic(initialResearch, "personal"), ["other"]), "personalSituationOther", "Eigen situatie");
  for (const option of intakeQuestion.options.filter(o => o.value !== "other")) {
    const values = toggleChoice(intakeQuestion, ["other"], option.value);
    assert.deepEqual(values, [option.value]);
    const state = updateIntake(explained, values);
    assert.equal(state.answers.personalSituationOther, undefined);
    assert.deepEqual(validateIntake(state), {});
    assert.ok(validateIntake(updateIntake(explained, ["other", option.value])).personalSituation);
  }
});

test("changing perspective omits inactive answers and preserves personal choices for back navigation", () => {
  const personal = updateTopic(researchState(), "personal");
  const employer = updateTopic(personal, "employer");
  const payload = createResearchSubmission(employer, randomUUID());
  assert.equal(Object.keys(payload.answers).some(k => k.startsWith("personal")), false);
  assert.deepEqual(intakeValues(updateTopic(employer, "personal")), intakeValues(personal));
  const student = updateIntake(personal, ["student"]);
  assert.equal(student.answers.personalSector, undefined);
  assert.equal(intakeSteps(student).includes("employer-context"), false);
});
