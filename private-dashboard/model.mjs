import { questions, resolveQuestion, detailedSectors } from "../src/lib/screener/research-questions.ts";
import { questions as previousQuestions, resolveQuestion as resolvePreviousQuestion } from "../src/lib/screener/research-questions-v1.ts";
import { RESEARCH_VERSION, DETAILED_SECTOR_VERSION, PREVIOUS_RESEARCH_VERSION } from "../src/lib/screener/research.ts";
import { researchHeaders, RESEARCH_SHEET_SUFFIX } from "../src/lib/screener/research-storage.ts";

export { RESEARCH_SHEET_SUFFIX };
function defineQuestions(source, resolve) { return source.filter(q => q.id !== "personalTenure").map(q => ({
  id: q.id, label: q.label, route: q.id.startsWith("personal") ? "personal" : "employer",
  group: q.step.endsWith("context") ? "Situatie" : q.step.endsWith("search") ? "Zoeken" : "Keuzes en ervaringen",
  multiple: q.kind === "multi", text: q.kind === "text",
  hypotheticalLabel: resolve(q, { personalRecentSearch: "no" }).label,
  options: [...new Set([q, resolve(q, { personalRecentSearch: "no" }), resolve(q, { personalRecentSearch: "active", employerChannels: ["network", "linkedin"] })]
    .flatMap(question => question.options?.filter(o => o.value !== "other").map(o => o.label) ?? []))],
})); }
export const definitions = defineQuestions(questions, resolveQuestion);
export const versions = [
  { id: RESEARCH_VERSION, label: "Compacte sectorlijst (30 september 2026)", questions: definitions },
  { id: DETAILED_SECTOR_VERSION, label: "Uitgebreide sectorlijst", questions: defineQuestions(questions.map(q => q.id === "personalSector" || q.id === "employerSector" ? { ...q, options: detailedSectors } : q), resolveQuestion) },
  { id: PREVIOUS_RESEARCH_VERSION, label: "Eerdere vragenlijst", questions: defineQuestions(previousQuestions, resolvePreviousQuestion) },
];

// Alleen onderzoeksantwoorden: geen namen, e-mail, telefoon of inhoudsvingerafdrukken.
export function parseRows(values) {
  if (!values.length || JSON.stringify(values[0]) !== JSON.stringify(researchHeaders)) {
    throw new Error("De kolommen van het onderzoek zijn gewijzigd. Controleer eerst de gegevenskoppeling.");
  }
  const index = new Map(values[0].map((label, i) => [label, i]));
  return values.slice(1).filter(row => row[0]).map((row, i) => {
    const answers = Object.fromEntries(definitions.map(q => {
      const col = values[0].findIndex(h => h.startsWith(`${q.id}:`) && !h.endsWith(": Anders"));
      return [q.id, String(row[col] ?? "")];
    }));
    return {
      reference: `Inzending ${i + 1}`, date: String(row[index.get("Ingezonden op")] ?? ""), version: String(row[index.get("Formulierversie")] ?? ""),
      routes: String(row[index.get("Ingevulde routes")] ?? "").split("; ").filter(r => r === "personal" || r === "employer"),
      context: String(row[index.get("Zoekcontext (ervaring of verwachting)")] ?? ""),
      comment: String(row[index.get("Aanvulling")] ?? ""), answers,
    };
  });
}

export function filterRows(rows, { route = "personal", sector = "", context = "", version = "" } = {}) {
  return rows.filter(row => row.routes.includes(route)
    && (!version || row.version === version)
    && (!sector || row.answers[`${route}Sector`] === sector)
    && (route !== "personal" || !context || row.context === context));
}

export function aggregate(rows, question) {
  const answered = rows.filter(r => r.answers[question.id]?.trim());
  const counts = new Map();
  const other = [];
  for (const row of answered) {
    const value = row.answers[question.id];
    // Split only before known answer labels. Semicolons in free text stay intact.
    const parts = question.multiple ? splitAnswers(value, question.options) : [value];
    const unique = new Set();
    for (let label of parts) {
      if (label.startsWith("Anders:")) { other.push({ reference: row.reference, text: label.slice(7).trim() }); label = "Anders"; }
      unique.add(label);
    }
    for (const label of unique) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  return { answered: answered.length, skipped: rows.length - answered.length, other,
    items: [...counts].map(([label, count]) => ({ label, count, percent: answered.length ? Math.round(count / answered.length * 100) : 0 })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "nl")) };
}

function splitAnswers(value, labels) {
  const starts = [...labels, "Anders:"];
  const parts = [];
  let start = 0;
  for (let i = value.indexOf("; "); i >= 0; i = value.indexOf("; ", i + 2)) {
    const remaining = value.slice(i + 2);
    if (starts.some(label => remaining === label || remaining.startsWith(`${label}; `) || (label === "Anders:" && remaining.startsWith(label)))) {
      parts.push(value.slice(start, i)); start = i + 2;
    }
  }
  parts.push(value.slice(start));
  return parts.filter(Boolean);
}
