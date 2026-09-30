import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { researchState } from "./research-fixtures.mjs";
import { createResearchSubmission, parseResearchSubmission, validateResearchStep, COMPACT_SECTOR_VERSION } from "../src/lib/screener/research.ts";
import { researchHeaders, storageRow, storageHeaderUpdate } from "../src/lib/screener/research-storage.ts";
import { parseRows, versions } from "../private-dashboard/model.mjs";
import { intakeQuestions } from "../src/lib/screener/intake.ts";

test("current employer route omits involvement without inventing an answer", () => {
  const state = researchState("employer");
  delete state.answers.employerInvolvement;
  assert.equal(intakeQuestions("employer-context", state).some(q => q.id === "employerInvolvement"), false);
  assert.deepEqual(validateResearchStep("employer-context", state), {});
  const payload = createResearchSubmission(state, randomUUID());
  assert.equal(payload.answers.employerInvolvement, undefined);
  assert.deepEqual(parseResearchSubmission(payload), payload);
  assert.equal(storageRow(payload, "time", "hash")[researchHeaders.indexOf("employerInvolvement: Eigen betrokkenheid werving")], "");
  assert.ok(validateResearchStep("employer-context", state, COMPACT_SECTOR_VERSION).employerInvolvement);
});

test("employer role supports multiple roles and requires an explanation for Other", () => {
  const state = researchState("employer");
  state.answers.employerRole = [];
  assert.ok(validateResearchStep("employer-context", state).employerRole);
  state.answers.employerRole = ["owner", "hr", "other"];
  assert.ok(validateResearchStep("employer-context", state).employerRoleOther);
  state.answers.employerRoleOther = "Teamcoach";
  const payload = createResearchSubmission(state, randomUUID());
  assert.deepEqual(parseResearchSubmission(payload), payload);
  const row = storageRow(payload, "time", "hash");
  assert.equal(row.at(-1), "Eigenaar / directie; HR-medewerker; Anders: Teamcoach");
  assert.ok(parseRows([researchHeaders, row])[0].sections.some(s => s.entries.some(e => e.value === row.at(-1))));
});

test("older submissions and sheet columns remain compatible without a role", () => {
  const state = researchState("employer");
  delete state.answers.employerRole;
  const payload = createResearchSubmission(state, randomUUID(), COMPACT_SECTOR_VERSION);
  assert.deepEqual(parseResearchSubmission(payload), payload);
  const oldHeaders = researchHeaders.slice(0, -1);
  assert.equal(oldHeaders.length, 56);
  assert.deepEqual(storageHeaderUpdate(payload, oldHeaders), { range: "BE1:BE1", values: [["employerRole: Rol van de invuller"]] });
  const oldRow = storageRow(payload, "time", "hash").slice(0, -1);
  assert.equal(parseRows([oldHeaders, oldRow])[0].answers.employerRole, "");
  assert.equal(versions.find(v => v.id === COMPACT_SECTOR_VERSION).questions.some(q => q.id === "employerRole"), false);
});
