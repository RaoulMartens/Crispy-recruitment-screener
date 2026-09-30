import { filterRows, aggregate } from "/model.mjs";
const $ = id => document.getElementById(id);
let data;
let route = "personal";
let view = "participants";
let selectedParticipant = null;
const fragment = location.hash.slice(1);
if (fragment) { sessionStorage.setItem("crispy-dashboard-token", fragment); history.replaceState(null, "", "/"); }
const token = sessionStorage.getItem("crispy-dashboard-token") ?? "";
function node(tag, text, className) { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; if (className) el.className = className; return el; }
function participantName(row) { return row.name || `${row.reference} (zonder naam)`; }
function participantDate(row) {
  const date = new Date(row.date);
  return Number.isNaN(date.getTime()) ? "Datum onbekend" : date.toLocaleString("nl-NL", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function reviewSection(title, entries) {
  const section = node("section", undefined, "review-section");
  const list = node("dl");
  section.append(node("h3", title), list);
  for (const entry of entries) {
    const pair = node("div");
    pair.append(node("dt", entry.label), node("dd", entry.value));
    list.append(pair);
  }
  return section;
}
function renderParticipants(rows) {
  const participant = rows.find(row => row.id === selectedParticipant);
  if (!participant) selectedParticipant = null;
  $("participants-view").setAttribute("aria-pressed", String(view === "participants"));
  $("patterns-view").setAttribute("aria-pressed", String(view === "patterns"));
  $("question-field").hidden = view !== "patterns";
  $("patterns-panel").hidden = view !== "patterns";
  $("participants-panel").hidden = view !== "participants" || Boolean(participant);
  $("participant-detail").hidden = view !== "participants" || !participant;
  $("participants-title").textContent = `Deelnemers (${rows.length})`;
  $("participants-list").replaceChildren();
  if (!rows.length) {
    const empty = node("div", undefined, "empty");
    empty.append(node("h3", data.rows.length ? "Geen deelnemers in deze selectie" : "Nog geen inzendingen"), node("p", data.rows.length ? "Kies een andere vragenlijstversie of wis de filters." : "Nieuwe inzendingen verschijnen hier zodra iemand het formulier verstuurt."));
    $("participants-list").append(empty);
  }
  for (const row of rows.slice().sort((a, b) => b.date.localeCompare(a.date, "nl"))) {
    const button = node("button", undefined, "participant-row");
    button.type = "button";
    button.dataset.participantId = row.id;
    const text = node("span", undefined, "participant-label");
    text.append(node("strong", participantName(row)), node("small", `${participantDate(row)} · ${row.routes.map(r => r === "personal" ? "Eigen werk of studie" : "De organisatie").join(" en ")}`));
    button.append(text, node("span", "Bekijk antwoorden", "participant-action"));
    button.addEventListener("click", () => {
      selectedParticipant = row.id; render();
      $("participant-title").focus();
      $("participant-detail").scrollIntoView({ block: "start" });
    });
    $("participants-list").append(button);
  }
  $("participant-answers").replaceChildren();
  if (!participant) return;
  $("participant-title").textContent = participantName(participant);
  $("participant-meta").textContent = `${participant.reference} · ${participantDate(participant)}`;
  const routes = participant.routes.map(r => r === "personal" ? "Eigen werk of studie" : "De organisatie").join(" en ");
  const closing = [
    ...(participant.comment.trim() ? [{ label: "Wil je nog iets meegeven?", value: participant.comment }] : []),
    { label: "Mag Raoul contact met je opnemen voor een gesprek over je antwoorden?", value: participant.interviewConsent || "Niet ingevuld" },
    ...(participant.name ? [{ label: "Naam", value: participant.name }] : []),
  ];
  $("participant-answers").append(
    reviewSection("Ingevulde onderdelen", [{ label: "Waarover heb je verteld?", value: routes }]),
    ...participant.sections.map(section => reviewSection(section.title, section.entries)),
    reviewSection("Tot slot", closing),
  );
}
function quotes(target, items, empty) {
  $(target).replaceChildren();
  if (!items.length) { $(target).append(node("p", empty, "note")); return; }
  for (const item of items) { const entry = node("article", undefined, "quote"); entry.append(node("small", item.reference), node("p", item.text)); $(target).append(entry); }
}
function configure() {
  const selectedVersion = $("version").value;
  $("version").replaceChildren(...data.versions.map(v => new Option(v.label, v.id)));
  if (data.versions.some(v => v.id === selectedVersion)) $("version").value = selectedVersion;
  const questions = data.versions.find(v => v.id === $("version").value).questions;
  const previous = $("question").value;
  $("question").replaceChildren();
  for (const group of ["Situatie", "Zoeken", "Keuzes en ervaringen"]) {
    const el = node("optgroup"); el.label = group;
    for (const q of questions.filter(q => q.route === route && q.group === group)) { const option = node("option", q.label); option.value = q.id; el.append(option); }
    $("question").append(el);
  }
  $("question").value = questions.some(q => q.id === previous && q.route === route) ? previous : `${route}Priorities`;
  const selected = $("sector").value;
  $("sector").replaceChildren(new Option("Alle sectoren", ""));
  for (const value of [...new Set(filterRows(data.rows, { route, version: $("version").value }).map(r => r.answers[`${route}Sector`]).filter(Boolean))].sort()) $("sector").append(new Option(value, value));
  if ([...$("sector").options].some(o => o.value === selected)) $("sector").value = selected;
}
function render() {
  if (!data) return;
  const version = $("version").value;
  const versionRows = data.rows.filter(r => r.version === version);
  const rows = filterRows(data.rows, { route, sector: $("sector").value, context: $("context").value, version });
  const q = data.versions.find(v => v.id === version).questions.find(q => q.id === $("question").value);
  if (!q) return;
  const result = aggregate(rows, q);
  const personal = versionRows.filter(r => r.routes.includes("personal")).length;
  const employer = versionRows.filter(r => r.routes.includes("employer")).length;
  $("sample").replaceChildren();
  for (const [count, label] of [[versionRows.length,"inzendingen in deze versie"],[personal,"personen"],[employer,"organisaties"],[rows.length,"binnen je selectie"]]) { const el = node("span"); el.append(node("strong", String(count)), document.createTextNode(` ${label}`)); $("sample").append(el); }
  $("context-field").hidden = route !== "personal";
  for (const id of ["personal", "employer"]) $(id).setAttribute("aria-pressed", String(route === id));
  renderParticipants(rows);
  const contextual = ["personalChannels","personalBarriers","personalChecks"].includes(q.id);
  const mixed = contextual && new Set(rows.map(r => r.context).filter(Boolean)).size > 1;
  const hypothetical = contextual && rows.length && rows.every(r => r.context.startsWith("Verwachting"));
  $("question-title").textContent = mixed ? ({personalChannels:"Zoekkanalen: ervaring en verwachting",personalBarriers:"Afhaakredenen: ervaring en verwachting",personalChecks:"Werkgeversinformatie: ervaring en verwachting"})[q.id] : hypothetical ? q.hypotheticalLabel : q.label;
  $("base").textContent = `${result.answered} beantwoord · ${result.skipped} niet gevraagd of niet ingevuld`;
  $("mixed").hidden = !mixed;
  $("mixed").textContent = "Deze selectie combineert ervaringen met hypothetische antwoorden. Kies een zoekcontext om ze apart te bekijken.";
  $("chart").replaceChildren();
  if (!result.answered) {
    const box = node("div", undefined, "empty");
    box.append(node("h3", data.rows.length ? "Nog geen antwoorden in deze selectie" : "Klaar voor de eerste inzending"), node("p", data.rows.length ? "Probeer een andere vraag of wis de filters. Sommige vragen zijn alleen gesteld na een specifiek antwoord." : "Nieuwe antwoorden uit de huidige vragenlijst verschijnen hier automatisch. Je hoeft niets uit Google Sheets over te nemen."));
    $("chart").append(box);
  } else if (q.text) {
    for (const item of result.items) { const el = node("div", undefined, "answer"); el.append(node("span", item.label), node("span", `${item.count} antwoorden`, "number")); $("chart").append(el); }
  } else {
    for (const item of result.items) { const el = node("div", undefined, "answer"); const bar = node("progress"); bar.max = result.answered; bar.value = item.count; bar.setAttribute("aria-label", `${item.label}: ${item.count} van ${result.answered}`); el.append(node("span", item.label), bar, node("span", `${item.count} · ${item.percent}%`, "number")); $("chart").append(el); }
  }
  $("chart-note").textContent = q.multiple ? "Percentage van deelnemers die deze vraag beantwoordden. Meerdere antwoorden mogelijk; percentages tellen niet op tot 100%." : "Percentages zijn gebaseerd op de deelnemers die deze vraag beantwoordden.";
  quotes("other", result.other, "Geen extra toelichtingen bij deze vraag.");
  quotes("comments", rows.filter(r => r.comment.trim()).slice().reverse().map(r => ({reference:r.reference,text:r.comment})), "Nog geen aanvullingen in deze selectie.");
}
async function load() {
  $("refresh").disabled = true; $("refresh").textContent = "Laden…"; $("error").hidden = true;
  try {
    const response = await fetch("/api/results", { headers: { Authorization: `Bearer ${token}` }, cache:"no-store" });
    const next = await response.json(); if (!response.ok) throw new Error(next.error);
    data = next; configure(); render();
    $("status").textContent = `Google Sheets · ${data.source} · bijgewerkt ${new Date(data.updatedAt).toLocaleTimeString("nl-NL", {hour:"2-digit",minute:"2-digit"})} · automatisch elke minuut`;
  } catch (error) {
    $("error").hidden = false; $("error").textContent = error.message || "Laden mislukt. Probeer opnieuw.";
    $("status").textContent = data ? "Verbinding onderbroken. Je ziet de laatst geladen antwoorden." : "Nog geen gegevens geladen.";
  } finally { $("refresh").disabled = false; $("refresh").textContent = "Verversen"; }
}
for (const id of ["personal","employer"]) $(id).addEventListener("click", () => { route=id; $("sector").value=""; $("context").value=""; if(data) { configure(); render(); } });
for (const id of ["sector","context","question"]) $(id).addEventListener("change", render);
$("version").addEventListener("change", () => { $("sector").value=""; $("context").value=""; configure(); render(); });
$("reset").addEventListener("click", () => { $("sector").value=""; $("context").value=""; render(); });
$("refresh").addEventListener("click", load);
for (const [id, nextView] of [["participants-view", "participants"], ["patterns-view", "patterns"]]) $(id).addEventListener("click", () => { view = nextView; render(); });
$("back-to-participants").addEventListener("click", () => {
  const previous = selectedParticipant;
  selectedParticipant = null; render();
  const button = [...$("participants-list").children].find(el => el.dataset.participantId === previous);
  button?.focus();
});
await load(); setInterval(() => { if (!document.hidden) load(); }, 60_000);
