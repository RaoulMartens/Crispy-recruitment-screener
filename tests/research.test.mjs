import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { initialResearch, getResearchSteps, firstInvalidResearchStep, validateResearchStep, parseResearchSubmission, updateResearchAnswer, activeQuestions, createResearchSubmission, RESEARCH_VERSION, DETAILED_SECTOR_VERSION, PREVIOUS_RESEARCH_VERSION } from "../src/lib/screener/research.ts";
import { getQuestions as getPreviousQuestions } from "../src/lib/screener/research-questions-v1.ts";
import { getQuestions, questions, sectors, detailedSectors, toggleChoice } from "../src/lib/screener/research-questions.ts";
import { researchHeaders, storageRow, storageSchema, storageHeaderUpdate, sheetColumn } from "../src/lib/screener/research-storage.ts";
import { createSubmissionHandler, SubmissionConflict } from "../src/lib/screener/submit-handler.ts";
import { writeToSheets } from "../src/lib/screener/sheets-writer.ts";
import { researchState, researchPayload } from "./research-fixtures.mjs";
import { createSubmission, initialAnswers, LEGACY_FORM_VERSION } from "../src/lib/screener/steps.ts";
import { sheetHeaders, toSheetRow } from "../src/lib/screener/submission-storage.ts";

test("research routes include three content blocks, optional second route and one closing", () => {
  for (const perspective of ["employer", "personal", "both"]) for (const first of ["employer", "personal"]) for (const secondRoute of ["yes", "no"]) {
    const state = researchState(perspective, first, { secondRoute });
    assert.equal(firstInvalidResearchStep(state), undefined);
    const steps = getResearchSteps(state);
    assert.equal(steps.filter((v) => v === "closing").length, 1);
    assert.equal(steps.length, perspective === "both" ? secondRoute === "yes" ? 10 : 7 : 6);
    const payload = researchPayload(state);
    assert.deepEqual(parseResearchSubmission(payload), payload);
    assert.equal(payload.completedRoutes.length, perspective === "both" && secondRoute === "yes" ? 2 : 1);
    assert.equal(payload.participantType, payload.completedRoutes.length === 2 ? "both" : payload.completedRoutes[0]);
  }
  assert.equal(firstInvalidResearchStep({ ...initialResearch }), "intro");
  assert.ok(validateResearchStep("intro", { ...initialResearch, participantType: "both" }).firstRoute);
});

test("declining an interview still produces a complete submission with zero contact fields", () => {
  const state = researchState("personal", "personal", { name: "STALE NAME", email: "stale@example.com", phone: "0612345678" });
  const payload = researchPayload(state);
  assert.equal(payload.interviewConsent, false);
  assert.equal("contact" in payload, false);
  assert.equal(JSON.stringify(payload).includes("STALE"), false);
  assert.deepEqual(parseResearchSubmission(payload), payload);
  assert.equal(parseResearchSubmission({ ...payload, contact: { name: "Leak", email: "leak@example.com" } }), null);
  const row = storageRow(payload, "time", "hash");
  assert.deepEqual(row.slice(7, 12), ["Nee", "", "", "", ""]);
});

test("interview choice defaults to yes while no still permits submission without contact", () => {
  assert.equal(initialResearch.interviewConsent, "yes");
  const state = researchState("personal", "personal", { interviewConsent: initialResearch.interviewConsent });
  const errors = validateResearchStep("closing", state);
  assert.ok(errors.name);
  assert.ok(errors.email);
  assert.equal(errors.interviewConsent, undefined);
  assert.deepEqual(validateResearchStep("closing", { ...state, interviewConsent: "no" }), {});
  assert.equal(researchPayload({ ...state, interviewConsent: "no" }).contact, undefined);
});

test("interview contact validates only with permission and retains phone formatting", () => {
  let state = researchState("employer", "employer", { interviewConsent: "yes" });
  assert.ok(validateResearchStep("closing", state).name);
  assert.ok(validateResearchStep("closing", state).email);
  state = { ...state, name: " Test ", email: " test@example.com ", phone: " +31 (0)6 1234 5678 " };
  const payload = researchPayload(state);
  assert.deepEqual(payload.contact, { name: "Test", email: "test@example.com", phone: "+31 (0)6 1234 5678" });
  assert.deepEqual(parseResearchSubmission(payload), payload);
  for (const phone of ["123", "nope", "+".repeat(3)]) {
    assert.ok(validateResearchStep("closing", { ...state, phone }).phone);
    assert.equal(parseResearchSubmission({ ...payload, contact: { ...payload.contact, phone } }), null);
  }
  assert.equal(parseResearchSubmission({ ...payload, contact: undefined }), null);
});

test("no or unknown hiring skips experienced channel results and pain points", () => {
  for (const value of ["no", "unknown"]) {
    const state = updateResearchAnswer(researchState("employer"), "employerRecentHiring", value);
    const payload = researchPayload(state);
    for (const field of ["employerChannels", "employerEffectiveChannels", "employerBarriers"]) {
      assert.equal(field in payload.answers, false);
      assert.equal(parseResearchSubmission({ ...payload, answers: { ...payload.answers, [field]: ["unknown"] } }), null);
    }
    assert.deepEqual(parseResearchSubmission(payload), payload);
  }
});

test("work, study and no work coexist correctly; hidden work details do not leak", () => {
  for (const situations of [["employed"], ["self-employed"], ["employed", "student"], ["self-employed", "student"], ["student"], ["not-working", "student"], ["not-working"]]) {
    const state = updateResearchAnswer(researchState("personal"), "personalSituation", situations);
    const payload = researchPayload(state);
    assert.deepEqual(parseResearchSubmission(payload), payload);
    assert.equal("personalSector" in payload.answers, situations.includes("employed") || situations.includes("self-employed"));
  }
  const question = questions.find((q) => q.id === "personalSituation");
  assert.deepEqual(toggleChoice(question, ["student", "employed"], "not-working"), ["student", "not-working"]);
  assert.deepEqual(toggleChoice(question, ["student", "not-working"], "self-employed"), ["student", "self-employed"]);
  assert.ok(validateResearchStep("personal-context", { ...researchState("personal"), answers: { personalSituation: ["not-working", "employed"] } }).personalSituation);
});

test("retired tenure stays hidden without changing storage columns", () => {
  const state = researchState("personal");
  state.answers.personalTenure = "1-to-3";
  const visible = getQuestions("personal-context", state.answers);
  assert.equal(visible.some((q) => q.id === "personalTenure"), false);
  assert.equal(firstInvalidResearchStep(state), undefined);
  const payload = researchPayload(state);
  assert.equal("personalTenure" in payload.answers, false);
  assert.deepEqual(parseResearchSubmission(payload), payload);
  const index = researchHeaders.indexOf("personalTenure: Duur huidig werk");
  assert.ok(index >= 0);
  assert.equal(storageRow(payload, "time", "hash")[index], "");
});

test("personal mismatch offers the standard choices plus Other and only yes asks for a reason", () => {
  const question = questions.find((q) => q.id === "personalMismatch");
  assert.deepEqual(question.options.map((o) => o.value), ["yes", "no", "no-experience", "other"]);
  for (const value of ["yes", "no", "no-experience"]) {
    const state = updateResearchAnswer(researchState("personal"), "personalMismatch", value);
    const payload = researchPayload(state);
    assert.deepEqual(parseResearchSubmission(payload), payload);
    assert.equal("personalMismatchReason" in payload.answers, value === "yes");
  }
  const payload = researchPayload(updateResearchAnswer(researchState("personal"), "personalMismatch", "no"));
  assert.equal(parseResearchSubmission({ ...payload, answers: { ...payload.answers, personalMismatch: "unknown" } }), null);
});

test("openness has three distinct current states plus Other and rejects the redundant later option", () => {
  const question = questions.find((q) => q.id === "personalOpenness");
  assert.deepEqual(question.options.map((o) => o.value), ["active", "open", "closed", "other"]);
  for (const value of ["active", "open", "closed"]) {
    const payload = researchPayload(updateResearchAnswer(researchState("personal"), question.id, value));
    assert.deepEqual(parseResearchSubmission(payload), payload);
  }
  const payload = researchPayload();
  assert.equal(parseResearchSubmission({ ...payload, answers: { ...payload.answers, personalOpenness: "later" } }), null);
});

test("active searching cannot be combined with no search in the past two years", () => {
  for (const openness of ["active", "open", "closed"]) for (const recent of ["active", "browsing", "no"]) {
    const state = researchState("personal", "personal", { answers: { personalOpenness: openness, personalRecentSearch: recent } });
    const contradictory = openness === "active" && recent === "no";
    assert.equal(Boolean(validateResearchStep("personal-search", state).personalRecentSearch), contradictory);
    assert.equal(firstInvalidResearchStep(state), contradictory ? "personal-search" : undefined);
    if (contradictory) {
      assert.throws(() => researchPayload(state), /personal-search/);
      const payload = researchPayload(updateResearchAnswer(state, "personalOpenness", "open"));
      assert.equal(parseResearchSubmission({ ...payload, answers: { ...payload.answers, personalOpenness: "active" } }), null);
      continue;
    }
    const payload = researchPayload(state);
    assert.deepEqual(parseResearchSubmission(payload), payload);
  }
  let state = researchState("personal", "personal", { answers: { personalOpenness: "active", personalRecentSearch: "no" } });
  state = updateResearchAnswer(state, "personalRecentSearch", "active");
  assert.equal(validateResearchStep("personal-search", state).personalRecentSearch, undefined);
  assert.ok(validateResearchStep("personal-search", state).personalChannels);
  assert.ok(getQuestions("personal-experience", state.answers).some((q) => q.id === "personalMissingInfo"));
});

test("barriers distinguish no actual dropout from no hypothetical deterrent", () => {
  for (const context of ["active", "browsing", "no"]) {
    const state = researchState("personal", "personal", { answers: { personalOpenness: "open", personalRecentSearch: context } });
    const question = getQuestions("personal-experience", state.answers).find((q) => q.id === "personalBarriers");
    assert.equal(question.options.some((o) => o.value === "not-applicable"), false);
    if (context === "no") {
      assert.match(question.options.find((o) => o.value === "none").label, /zou/);
      const payload = researchPayload(state);
      assert.ok(parseResearchSubmission({ ...payload, answers: { ...payload.answers, personalBarriers: ["none"] } }));
    } else {
      assert.equal(question.options.find((o) => o.value === "none").label, "Ik ben niet afgehaakt");
      assert.deepEqual(toggleChoice(question, ["slow-response"], "none"), ["none"]);
      assert.deepEqual(toggleChoice(question, ["none"], "long-process"), ["long-process"]);
    }
    for (const option of question.options.filter((o) => o.value !== "other")) {
      const payload = researchPayload(updateResearchAnswer(state, question.id, [option.value]));
      assert.deepEqual(parseResearchSubmission(payload), payload);
    }
    const payload = researchPayload(state);
    assert.equal(parseResearchSubmission({ ...payload, answers: { ...payload.answers, personalBarriers: ["not-applicable"] } }), null);
  }
});

test("none and Other remain distinct and exclusive in both search contexts", () => {
  for (const context of ["active", "browsing", "no"]) {
    for (const id of ["personalChecks", "personalBarriers"]) {
      let state = researchState("personal", "personal", { answers: { personalOpenness: "open", personalRecentSearch: context } });
      const question = getQuestions("personal-experience", state.answers).find((q) => q.id === id);
      if (id === "personalChecks") {
        assert.equal(question.options.find((o) => o.value === "none").exclusive, true);
        const payload = researchPayload(state);
        assert.ok(parseResearchSubmission({ ...payload, answers: { ...payload.answers, [id]: ["none"] } }));
        assert.equal(parseResearchSubmission({ ...payload, answers: { ...payload.answers, [id]: ["none", "website"] } }), null);
      }
      state = updateResearchAnswer(state, id, ["other"]);
      assert.ok(validateResearchStep("personal-experience", state)[`${id}Other`]);
      state = updateResearchAnswer(state, `${id}Other`, "Mijn eigen toelichting");
      const payload = researchPayload(state);
      assert.deepEqual(parseResearchSubmission(payload), payload);
      assert.equal(payload.answers[`${id}Other`], "Mijn eigen toelichting");
      const column = researchHeaders.indexOf(`${id}: Anders`);
      assert.ok(column >= 0);
      assert.equal(storageRow(payload, "time", "hash")[column], "Mijn eigen toelichting");
      state = updateResearchAnswer(state, id, ["unknown"]);
      assert.equal(state.answers[`${id}Other`], undefined);
    }
  }
});

test("channel comparison needs multiple channels and is pruned when only one remains", () => {
  let state = updateResearchAnswer(researchState("employer"), "employerChannels", ["network", "linkedin"]);
  state = updateResearchAnswer(state, "employerEffectiveChannels", ["no-difference"]);
  const payload = researchPayload(state);
  assert.deepEqual(parseResearchSubmission(payload), payload);
  state = updateResearchAnswer(state, "employerChannels", ["network"]);
  const question = getQuestions("employer-search", state.answers).find((q) => q.id === "employerEffectiveChannels");
  assert.equal(question.options.some((o) => o.value === "no-difference"), false);
  assert.deepEqual(state.answers.employerEffectiveChannels, []);
  assert.ok(validateResearchStep("employer-search", state).employerEffectiveChannels);
  for (const value of ["network", "no-candidates", "unknown"]) {
    const updated = researchPayload(updateResearchAnswer(state, question.id, [value]));
    assert.deepEqual(parseResearchSubmission(updated), updated);
  }
});

test("answer audit keeps meaningful distinctions and removes the umbrella departure reason", () => {
  const state = researchState();
  const active = activeQuestions(state);
  const checks = active.find((q) => q.id === "personalChecks");
  assert.equal(checks.options.find((o) => o.value === "social").label, "Andere social media");
  assert.ok(checks.options.some((o) => o.value === "linkedin"));
  const missingInfo = active.find((q) => q.id === "personalMissingInfo");
  for (const value of ["none", "unknown"]) assert.ok(missingInfo.options.find((o) => o.value === value)?.exclusive);
  const departure = active.find((q) => q.id === "employerDepartureReason");
  assert.equal(departure.options.some((o) => o.value === "expectations"), false);
  for (const option of departure.options.filter((o) => o.value !== "other")) {
    const payload = researchPayload(updateResearchAnswer(state, departure.id, option.value));
    assert.deepEqual(parseResearchSubmission(payload), payload);
  }
  for (const question of active) {
    const choices = question.options ?? [];
    assert.equal(new Set(choices.map((o) => o.value)).size, choices.length, question.id);
    assert.equal(new Set(choices.map((o) => o.label)).size, choices.length, question.id);
  }
});

test("missing information follows recent search experience without assuming vacancy use", () => {
  for (const context of ["active", "browsing"]) {
    const state = researchState("personal", "personal", { answers: { personalOpenness: "open", personalRecentSearch: context, personalChannels: ["network"] } });
    const question = getQuestions("personal-experience", state.answers).find((q) => q.id === "personalMissingInfo");
    assert.equal(question.label, "Welke informatie over het werk miste je bij je laatste zoektocht?");
    assert.equal(question.options.find((o) => o.value === "not-applicable").exclusive, true);
    for (const value of ["salary", "none", "not-applicable", "unknown"]) {
      const payload = researchPayload(updateResearchAnswer(state, question.id, [value]));
      assert.deepEqual(parseResearchSubmission(payload), payload);
    }
    const payload = researchPayload(state);
    assert.equal(parseResearchSubmission({ ...payload, answers: { ...payload.answers, personalMissingInfo: ["not-applicable", "salary"] } }), null);
    let changed = updateResearchAnswer(state, question.id, ["other"]);
    changed = updateResearchAnswer(changed, "personalMissingInfoOther", "Toelichting");
    changed = updateResearchAnswer(changed, "personalRecentSearch", "no");
    assert.equal(getQuestions("personal-experience", changed.answers).some((q) => q.id === question.id), false);
    assert.equal(changed.answers.personalMissingInfo, undefined);
    assert.equal(changed.answers.personalMissingInfoOther, undefined);
    const noSearchPayload = researchPayload(researchState("personal", "personal", { answers: changed.answers }));
    assert.deepEqual(parseResearchSubmission(noSearchPayload), noSearchPayload);
    assert.equal(parseResearchSubmission({ ...noSearchPayload, answers: { ...noSearchPayload.answers, personalMissingInfo: ["salary"] } }), null);
    changed = updateResearchAnswer(changed, "personalRecentSearch", context);
    assert.ok(validateResearchStep("personal-experience", changed).personalMissingInfo);
  }
});

test("switching search context resets answers rather than reinterpreting actual behaviour", () => {
  const state = updateResearchAnswer(researchState("personal", "personal", { answers: { personalOpenness: "open" } }), "personalRecentSearch", "no");
  for (const id of ["personalChannels", "personalBarriers", "personalChecks", "personalMissingInfo"]) assert.equal(state.answers[id], undefined);
  assert.match(getQuestions("personal-search", state.answers).find((q) => q.id === "personalChannels").label, /zou/);
  assert.equal(getQuestions("personal-experience", state.answers).some((q) => q.id === "personalMissingInfo"), false);
  const complete = researchState("personal", "personal", { answers: state.answers });
  const payload = researchPayload(complete);
  assert.deepEqual(parseResearchSubmission(payload), payload);
  assert.equal(storageRow(payload, "time", "hash")[13], "Verwachting: hypothetisch");
});

test("search channels wait for a valid context and clear when the parent becomes unanswered", () => {
  for (const value of [undefined, "", "invalid"]) {
    const answers = { personalRecentSearch: value };
    assert.equal(getQuestions("personal-search", answers).some(q => q.id === "personalChannels"), false);
  }
  for (const value of ["active", "browsing", "no", "other"]) {
    assert.equal(getQuestions("personal-search", { personalRecentSearch: value }).some(q => q.id === "personalChannels"), true);
  }
  let state = updateResearchAnswer(researchState("personal"), "personalChannels", ["other"]);
  state = updateResearchAnswer(state, "personalChannelsOther", "Een eigen manier");
  state = updateResearchAnswer(state, "personalRecentSearch", "");
  assert.equal(state.answers.personalChannels, undefined);
  assert.equal(state.answers.personalChannelsOther, undefined);
  const errors = validateResearchStep("personal-search", state);
  assert.ok(errors.personalRecentSearch);
  assert.equal(errors.personalChannels, undefined);
});

test("every Other answer has a bounded required explanation, except reused employer channel", () => {
  for (const question of activeQuestions(researchState()).filter((q) => q.options?.some((o) => o.value === "other") && q.id !== "employerEffectiveChannels")) {
    let state = updateResearchAnswer(researchState(), question.id, question.kind === "multi" ? ["other"] : "other");
    const key = `${question.id}Other`;
    assert.ok(validateResearchStep(question.step, state)[key], question.id);
    state = updateResearchAnswer(state, key, " Eigen antwoord ");
    if (question.id === "employerChannels") state = updateResearchAnswer(state, "employerEffectiveChannels", ["other"]);
    state = researchState("both", "employer", { answers: state.answers });
    const payload = researchPayload(state);
    assert.equal(payload.answers[key], "Eigen antwoord");
    assert.deepEqual(parseResearchSubmission(payload), payload);
    const row = storageRow(payload, "time", "hash");
    const column = researchHeaders.findIndex((header) => header.startsWith(`${question.id}:`) && !header.endsWith(": Anders"));
    assert.match(row[column], /Anders: Eigen antwoord/, question.id);
    assert.equal(parseResearchSubmission({ ...payload, answers: { ...payload.answers, [key]: " " } }), null);
    assert.equal(parseResearchSubmission({ ...payload, answers: { ...payload.answers, [key]: "x".repeat(201) } }), null);
    assert.ok(validateResearchStep(question.step, { ...state, answers: { ...state.answers, [key]: "x".repeat(201) } })[key]);
  }
});

test("every visible content choice offers a writable own answer", () => {
  for (const state of [researchState(), researchState("both", "employer", { answers: { personalOpenness: "open", personalRecentSearch: "no" } })]) {
    for (const question of activeQuestions(state).filter(q => q.kind !== "text")) {
      const ownValue = question.id === "employerEffectiveChannels" ? "own-answer" : "other";
      assert.equal(question.options.some(o => o.value === ownValue), true, question.id);
    }
  }
});

test("effective channels accept an own explanation alongside the reused channel answer", () => {
  let state = updateResearchAnswer(researchState("employer"), "employerChannels", ["other"]);
  state = updateResearchAnswer(state, "employerChannelsOther", "Een vakvereniging");
  state = updateResearchAnswer(state, "employerEffectiveChannels", ["other", "own-answer"]);
  assert.ok(validateResearchStep("employer-search", state).employerEffectiveChannelsOther);
  state = updateResearchAnswer(state, "employerEffectiveChannelsOther", "De combinatie werkte het best");
  const payload = researchPayload(state);
  assert.deepEqual(parseResearchSubmission(payload), payload);
  const row = storageRow(payload, "time", "hash");
  assert.equal(row[researchHeaders.indexOf("employerEffectiveChannels: Meest geschikte kandidaten via")], "Een vakvereniging; Anders: De combinatie werkte het best");
  assert.equal(payload.answers.employerChannelsOther, "Een vakvereniging");
  assert.equal(parseResearchSubmission({ ...payload, answers: { ...payload.answers, employerEffectiveChannelsOther: "" } }), null);
  assert.equal(parseResearchSubmission({ ...payload, answers: { ...payload.answers, employerEffectiveChannelsOther: "x".repeat(201) } }), null);
  state = updateResearchAnswer(state, "employerEffectiveChannels", ["other"]);
  assert.equal(state.answers.employerEffectiveChannelsOther, undefined);
  state = updateResearchAnswer(state, "employerEffectiveChannels", ["own-answer"]);
  state = updateResearchAnswer(state, "employerEffectiveChannelsOther", "Toelichting");
  state = updateResearchAnswer(state, "employerChannels", ["unknown"]);
  assert.equal(state.answers.employerEffectiveChannelsOther, undefined);
  assert.equal(state.answers.employerEffectiveChannels, undefined);
});

test("an own search context is not recorded as hypothetical or experienced behaviour", () => {
  let state = updateResearchAnswer(researchState("personal"), "personalRecentSearch", "other");
  for (const id of ["personalChannels", "personalBarriers", "personalChecks", "personalMissingInfo"]) assert.equal(state.answers[id], undefined);
  state = updateResearchAnswer(state, "personalRecentSearchOther", "Alleen een interne overstap");
  state = researchState("personal", "personal", { answers: state.answers });
  const payload = researchPayload(state);
  assert.deepEqual(parseResearchSubmission(payload), payload);
  assert.equal(storageRow(payload, "time", "hash")[13], "Niet ingedeeld: eigen antwoord");
  assert.match(getQuestions("personal-search", state.answers).find(q => q.id === "personalChannels").label, /gebruikte je of zou je gebruiken/);
  const changed = updateResearchAnswer(state, "personalRecentSearch", "no");
  assert.equal(changed.answers.personalChannels, undefined);
  assert.equal(changed.answers.personalRecentSearchOther, undefined);
});

test("max three choices, duplicate choices and exclusive choices are enforced on the server", () => {
  const state = researchState();
  for (const id of ["personalPriorities", "employerPriorities"]) {
    const question = questions.find((q) => q.id === id);
    const payload = researchPayload(state);
    for (const values of [[], ["unknown", question.options[0].value], [question.options[0].value, question.options[0].value], question.options.slice(0, 4).map((o) => o.value)]) {
      assert.equal(parseResearchSubmission({ ...payload, answers: { ...payload.answers, [id]: values } }), null);
    }
    for (const count of [1, 2, 3]) assert.ok(parseResearchSubmission({ ...payload, answers: { ...payload.answers, [id]: question.options.slice(0, count).map((o) => o.value) } }));
    assert.deepEqual(toggleChoice(question, [question.options[0].value], "unknown"), ["unknown"]);
  }
});

test("effective channels can only refer to used channels and get pruned when channels change", () => {
  let state = researchState("employer");
  let payload = researchPayload(state);
  assert.equal(parseResearchSubmission({ ...payload, answers: { ...payload.answers, employerEffectiveChannels: ["linkedin"] } }), null);
  state = updateResearchAnswer(state, "employerChannels", ["linkedin"]);
  assert.deepEqual(state.answers.employerEffectiveChannels, []);
  state = updateResearchAnswer(state, "employerEffectiveChannels", ["no-candidates"]);
  payload = researchPayload(state);
  assert.deepEqual(parseResearchSubmission(payload), payload);
  state = updateResearchAnswer(state, "employerChannels", ["unknown"]);
  assert.equal(state.answers.employerEffectiveChannels, undefined);
  assert.ok(parseResearchSubmission(researchPayload(state)));
});

test("inactive routes and conditional followups are omitted; forged payloads are rejected", () => {
  let state = researchState();
  state = updateResearchAnswer(state, "personalMismatch", "no");
  state = updateResearchAnswer(state, "employerEarlyDeparture", "unknown");
  const payload = researchPayload(state);
  assert.equal("personalMismatchReason" in payload.answers, false);
  assert.equal("employerDepartureReason" in payload.answers, false);
  for (const raw of [null, [], {}, { ...payload, formVersion: "v6" }, { ...payload, submissionId: "bad" }, { ...payload, surprise: true }, { ...payload, participantType: "personal" }, { ...payload, completedRoutes: ["personal", "employer"] }, { ...payload, answers: { ...payload.answers, personalMismatchReason: "work" } }, { ...payload, answers: { ...payload.answers, secret: "bad" } }, { ...payload, answers: { ...payload.answers, personalChannels: [null] } }, { ...payload, answers: { ...payload.answers, personalChannelsOther: "hidden" } }, { ...payload, comment: "x".repeat(1501) }]) assert.equal(parseResearchSubmission(raw), null);
  const skipped = researchPayload({ ...state, secondRoute: "no", name: "hidden" });
  assert.equal(skipped.requestedPerspective, "both");
  assert.equal(skipped.participantType, "employer");
  assert.ok(Object.keys(skipped.answers).every((key) => key.startsWith("employer")));
  assert.ok(parseResearchSubmission(skipped));
});

test("new storage has aligned columns, a separate tab and strict non-destructive headers", () => {
  const payload = researchPayload();
  const schema = storageSchema(payload);
  assert.equal(schema.suffix, "v5 onderzoek");
  assert.equal(storageRow(payload, "time", "hash").length, researchHeaders.length);
  assert.ok(researchHeaders.length > 26);
  assert.deepEqual(storageHeaderUpdate(payload, []), { range: `A1:${schema.lastColumn}1`, values: [researchHeaders] });
  assert.equal(storageHeaderUpdate(payload, researchHeaders), null);
  assert.throws(() => storageHeaderUpdate(payload, ["old header"]));
  assert.equal(sheetColumn(26), "Z"); assert.equal(sheetColumn(27), "AA"); assert.equal(sheetColumn(52), "AZ");
  assert.equal(researchHeaders.length, 56);
  assert.equal(schema.lastColumn, "BD");
  assert.ok(researchHeaders.includes("personalBarriers: Anders"));
});

test("literal free text other is not treated as an Other option", () => {
  const state = updateResearchAnswer(researchState("personal"), "personalHome", "other");
  const payload = researchPayload(state);
  assert.equal(payload.answers.personalHome, "other");
  assert.equal("personalHomeOther" in payload.answers, false);
  assert.deepEqual(parseResearchSubmission(payload), payload);
});

const request = (payload) => new Request("http://localhost/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
test("previous research forms keep their original validation, labels, API and storage contract", async () => {
  for (const perspective of ["employer", "personal", "both"]) {
    const state = { ...initialResearch, participantType: perspective, firstRoute: "employer", secondRoute: "yes", interviewConsent: "no", answers: {} };
    for (const step of getResearchSteps(state).filter(s => s.startsWith("personal-") || s.startsWith("employer-"))) {
      for (let i = 0; i < getPreviousQuestions(step, state.answers).length; i++) {
        const q = getPreviousQuestions(step, state.answers)[i];
        state.answers[q.id] = q.kind === "text" ? "Venlo" : q.kind === "multi" ? [q.options[0].value] : q.options[0].value;
      }
    }
    if (perspective !== "employer") {
      state.answers.personalPriorities = ["salary", "flexibility"];
      state.answers.personalChecks = ["location", "team"];
    }
    const old = createResearchSubmission(state, randomUUID(), PREVIOUS_RESEARCH_VERSION);
    assert.deepEqual(parseResearchSubmission(old), old);
    assert.equal(storageSchema(old).suffix, "v5 onderzoek");
    const row = storageRow(old, "time", "hash");
    assert.equal(row[3], PREVIOUS_RESEARCH_VERSION);
    if (perspective !== "employer") {
      assert.equal(row[researchHeaders.indexOf("personalPriorities: Prioriteiten nieuwe baan")], "Salaris; Flexibiliteit");
      assert.equal(row[researchHeaders.indexOf("personalChecks: Werkgeverscheck ervaring of verwachting")], "Locatie / reistijd; Medewerkers / sfeer");
      assert.equal(parseResearchSubmission({ ...old, formVersion: RESEARCH_VERSION }), null);
    }
    const writes = [];
    const handler = createSubmissionHandler(() => async value => writes.push(value));
    assert.equal((await handler(request(old))).status, 200);
    assert.deepEqual(writes, [old]);
  }
});

test("new choices are version-gated and all new sector choices round-trip", () => {
  for (const id of ["personalSector", "employerSector"]) {
    const q = questions.find(q => q.id === id);
    for (const choice of q.options.filter(o => o.value !== "other")) {
      const payload = researchPayload(updateResearchAnswer(researchState(), id, choice.value));
      assert.deepEqual(parseResearchSubmission(payload), payload);
    }
  }
  const state = updateResearchAnswer(researchState(), "personalPriorities", ["remote", "schedule", "work-life"]);
  const payload = researchPayload(state);
  assert.equal(payload.formVersion, RESEARCH_VERSION);
  assert.deepEqual(parseResearchSubmission(payload), payload);
  assert.equal(parseResearchSubmission({ ...payload, formVersion: PREVIOUS_RESEARCH_VERSION }), null);
  assert.equal(storageRow(payload, "time", "hash").length, 56);
});

test("compact sectors preserve detailed forms and their original stored labels", async () => {
  assert.equal(sectors.length, 14);
  assert.deepEqual(sectors.slice(-2).map(o => o.value), ["other", "unknown"]);
  assert.ok(sectors.some(o => o.label.includes("ICT")));
  assert.equal(sectors.some(o => /meerdere/i.test(o.label)), false);
  for (const id of ["employerSector", "personalSector"]) {
    const column = researchHeaders.findIndex(h => h.startsWith(`${id}:`) && !h.endsWith(": Anders"));
    for (const option of detailedSectors.filter(o => o.value !== "other")) {
      const state = researchState();
      state.answers[id] = option.value;
      const payload = createResearchSubmission(state, randomUUID(), DETAILED_SECTOR_VERSION);
      assert.deepEqual(parseResearchSubmission(payload), payload);
      assert.equal(storageRow(payload, "time", "hash")[column], option.label);
    }
    let state = updateResearchAnswer(researchState(), id, "other");
    state = updateResearchAnswer(state, `${id}Other`, "Wisselende klussen in horeca en winkels");
    const payload = researchPayload(state);
    assert.deepEqual(parseResearchSubmission(payload), payload);
    assert.equal(storageRow(payload, "time", "hash")[column], "Anders: Wisselende klussen in horeca en winkels");
    const merged = researchPayload(updateResearchAnswer(researchState(), id, "trade"));
    assert.equal(parseResearchSubmission({ ...merged, formVersion: DETAILED_SECTOR_VERSION }), null);
  }
  const state = researchState();
  state.answers.personalSector = "ict";
  const old = createResearchSubmission(state, randomUUID(), DETAILED_SECTOR_VERSION);
  const writes = [];
  const handler = createSubmissionHandler(() => async value => writes.push(value));
  assert.equal((await handler(request(old))).status, 200);
  assert.deepEqual(writes, [old]);
});

test("previously opened v4 forms still reach the original writer contract", async () => {
  const current = createSubmission({ ...initialAnswers, participantType: "personal", workerSituation: "not-working", workerHomeLocation: "Venray", workerActiveSearch: "no", workerOpenToWork: "maybe", name: "Test", email: "test@example.com" });
  for (const formVersion of [current.formVersion, LEGACY_FORM_VERSION]) {
    const payload = { ...current, formVersion };
    const received = [];
    const handler = createSubmissionHandler(() => async (value) => received.push(value));
    assert.equal((await handler(request(payload))).status, 200);
    assert.equal(received.length, 1);
    assert.deepEqual(received[0], payload);
    assert.equal(storageSchema(received[0]).suffix, "v4 compact");
    assert.deepEqual(storageSchema(received[0]).headers, sheetHeaders);
    assert.deepEqual(storageRow(received[0], "time", "hash"), toSheetRow(payload, "time"));
  }
});
test("API separates identical anonymous people and joins simultaneous retries of one ID", async () => {
  let release;
  const gate = new Promise((resolve) => { release = resolve; });
  const writes = [];
  const handler = createSubmissionHandler(() => async (payload) => { writes.push(payload.submissionId); await gate; });
  const payload = researchPayload();
  let completed = false;
  const first = handler(request(payload)).then((r) => { completed = true; return r; });
  const retry = handler(request(payload));
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(completed, false); assert.equal(writes.length, 1);
  release();
  assert.equal((await first).status, 200); assert.equal((await retry).status, 200);
  assert.equal((await handler(request({ ...payload, submissionId: randomUUID() }))).status, 200);
  assert.equal(writes.length, 2);
  assert.equal((await handler(request({ ...payload, comment: "changed" }))).status, 409);
  assert.equal(writes.length, 2);
});

test("API failures, missing configuration and invalid data never claim saved", async () => {
  const payload = researchPayload();
  assert.equal((await createSubmissionHandler(() => null)(request(payload))).status, 503);
  let writes = 0;
  const handler = createSubmissionHandler(() => async () => { writes++; if (writes === 1) throw new Error("simulated storage failure"); });
  assert.equal((await handler(request(payload))).status, 502);
  assert.equal((await handler(request(payload))).status, 200);
  assert.equal(writes, 2);
  assert.equal((await handler(request({ ...payload, interviewConsent: true }))).status, 400);
  assert.equal((await createSubmissionHandler(() => async () => { throw new SubmissionConflict(); })(request(payload))).status, 409);
  assert.equal((await handler(new Request("http://localhost/api/submissions", { method: "POST", body: "{" }))).status, 400);
});

function fakeSheets({ existing = false, wrongHeaders = false, loseResponse = false } = {}) {
  let header = wrongHeaders ? ["Do not overwrite"] : [];
  const rows = [];
  const calls = [];
  let found = existing;
  const sheets = { spreadsheets: {
    get: async () => ({ data: { sheets: found ? [{ properties: { title: "Submissions v5 onderzoek", sheetId: 123, gridProperties: { columnCount: 26 } } }] : [] } }),
    batchUpdate: async (args) => { calls.push(args); found = true; return { data: {} }; },
    values: {
      get: async (args) => ({ data: { values: args.range.endsWith("1:1") ? [header] : rows.map((row) => row.slice(0, 2)) } }),
      update: async (args) => { calls.push(args); header = args.requestBody.values[0]; return { data: {} }; },
      append: async (args) => { calls.push(args); rows.push(...args.requestBody.values); if (loseResponse) { loseResponse = false; throw new Error("response lost after successful write"); } return { data: {} }; },
    },
  } };
  return { sheets, calls, rows };
}
test("Google writer creates a wide new tab, writes RAW and recovers a lost write response by ID", async () => {
  const fake = fakeSheets({ loseResponse: true });
  const payload = researchPayload();
  await assert.rejects(writeToSheets(fake.sheets, "fake", "Submissions", payload, "hash"));
  assert.equal(fake.rows.length, 1);
  await writeToSheets(fake.sheets, "fake", "Submissions", payload, "hash");
  assert.equal(fake.rows.length, 1);
  assert.ok(fake.calls.some((c) => c.requestBody.requests?.[0].addSheet?.properties.gridProperties.columnCount === researchHeaders.length));
  assert.ok(fake.calls.filter((c) => c.requestBody.values).every((c) => c.valueInputOption === "RAW"));
  await assert.rejects(writeToSheets(fake.sheets, "fake", "Submissions", payload, "different-hash"), SubmissionConflict);
});
test("Google writer grows a pre-existing narrow new tab and rejects unknown headers", async () => {
  const fake = fakeSheets({ existing: true });
  await writeToSheets(fake.sheets, "fake", "Submissions", researchPayload(), "hash");
  assert.ok(fake.calls.some((c) => c.requestBody.requests?.[0].updateSheetProperties?.properties.gridProperties.columnCount === researchHeaders.length));
  const wrong = fakeSheets({ existing: true, wrongHeaders: true });
  await assert.rejects(writeToSheets(wrong.sheets, "fake", "Submissions", researchPayload(), "hash"), /Onverwachte/);
  assert.equal(wrong.rows.length, 0);
  assert.equal(wrong.calls.some((c) => c.requestBody.values), false);
});
