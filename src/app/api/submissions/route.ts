import { createHash } from "node:crypto";
import { google } from "googleapis";
import { NextResponse } from "next/server";

import {
  contactPreferenceOptions,
  employerRoleOptions,
  employerSizeOptions,
  workerDecisionOptions,
  workerSituationOptions,
  type Submission,
} from "@/lib/screener/steps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const recentSubmissionKeys = new Map<string, number>();
const duplicateWindowMs = 60_000;
const sheetHeaders = [
  "Ingezonden op", "Route", "Vestigingsplaats", "Omvang vestiging", "Rol werving",
  "Herhaalde personeelsbehoefte", "Concrete wervingscasus", "Functies", "Werkgever: interview",
  "Woonplaats", "Werkplaats", "Huidige situatie", "Andere situatie",
  "Actief gezocht (3 maanden)", "Open voor ander werk", "Reden ander werk", "Werkkeuzes (2 jaar)",
  "Concrete werkcasus", "Werkende: interview", "Interviewinteresse", "Contacttoestemming",
  "Voornaam", "E-mailadres", "Telefoonnummer", "Contactvoorkeur",
];

const participantLabels = {
  "job-seeker": "Werkende / werkzoekende",
  employer: "Werkgever",
  both: "Beide",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isOneOf(value: unknown, options: readonly string[]): value is string {
  return typeof value === "string" && options.includes(value);
}

function isText(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maxLength;
}

function isOptionalText(value: unknown, maxLength: number): boolean {
  return value === undefined || (typeof value === "string" && value.trim().length <= maxLength);
}

function isInterviewChoice(value: unknown): value is "yes" | "maybe" | "no" {
  return isOneOf(value, ["yes", "maybe", "no"]);
}

function isSubmission(value: unknown): value is Submission {
  if (!isRecord(value)) return false;
  const participantType = value.participantType;
  if (!isOneOf(participantType, ["job-seeker", "employer", "both"])) return false;
  const hasEmployer = participantType === "employer" || participantType === "both";
  const hasWorker = participantType === "job-seeker" || participantType === "both";

  if (hasEmployer) {
    const employer = value.employer;
    if (!isRecord(employer) || !isText(employer.location, 120)) return false;
    if (!isOneOf(employer.size, employerSizeOptions)) return false;
    if (!isOneOf(employer.hiringRole, employerRoleOptions.map((option) => option.value))) return false;
    if (employer.hiringRole !== "no") {
      if (!isOneOf(employer.recurringNeed, ["yes", "no", "unsure"])) return false;
      if (!isInterviewChoice(employer.concreteCase) || !isText(employer.functions, 200)) return false;
      if (!isInterviewChoice(employer.interview)) return false;
    }
  } else if (value.employer !== undefined) return false;

  if (hasWorker) {
    const worker = value.worker;
    if (!isRecord(worker)) return false;
    if (!isOptionalText(worker.homeLocation, 120) || !isOptionalText(worker.workLocation, 120)) return false;
    if (!isOneOf(worker.situation, workerSituationOptions.map((option) => option.value))) return false;
    if (worker.situation === "other" && !isText(worker.situationOther, 200)) return false;
    if (!isOneOf(worker.activeSearch, ["yes", "no"])) return false;
    if (worker.activeSearch === "no") {
      if (!isInterviewChoice(worker.openToWork)) return false;
      if (!isOptionalText(worker.openReason, 200)) return false;
    }
    if (!Array.isArray(worker.decisions) || worker.decisions.length === 0) return false;
    if (!worker.decisions.every((decision) => isOneOf(decision, workerDecisionOptions.map((option) => option.value)))) return false;
    if (new Set(worker.decisions).size !== worker.decisions.length) return false;
    if (worker.decisions.includes("none") && worker.decisions.length > 1) return false;
    if (!isInterviewChoice(worker.concreteCase) || !isInterviewChoice(worker.interview)) return false;
  } else if (value.worker !== undefined) return false;

  const employer = isRecord(value.employer) ? value.employer : undefined;
  const worker = isRecord(value.worker) ? value.worker : undefined;
  const shouldHaveInterest =
    (hasEmployer && employer?.hiringRole !== "no" && isOneOf(employer?.interview, ["yes", "maybe"])) ||
    (hasWorker && isOneOf(worker?.interview, ["yes", "maybe"]));
  if (value.interviewInterest !== shouldHaveInterest || typeof value.consent !== "boolean") return false;
  if (value.consent && !shouldHaveInterest) return false;
  if (!value.consent) return value.contact === undefined;

  const contact = value.contact;
  if (!isRecord(contact) || !isText(contact.name, 120) || !isText(contact.email, 254)) return false;
  if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(contact.email)) return false;
  if (!isOptionalText(contact.phone, 30)) return false;
  if (typeof contact.phone === "string" && contact.phone && !/^\+?[\d\s().-]{6,30}$/.test(contact.phone)) return false;
  if (!isOneOf(contact.preference, contactPreferenceOptions.map((option) => option.value))) return false;
  if ((contact.preference === "whatsapp" || contact.preference === "call") && !contact.phone) return false;
  return true;
}

function choiceLabel(value: string | undefined): string {
  return value === "yes" ? "Ja" : value === "maybe" ? "Misschien" : value === "no" ? "Nee" : value === "unsure" ? "Niet zeker" : value ?? "";
}

function toSheetRow(submission: Submission): string[] {
  const employer = submission.employer;
  const worker = submission.worker;
  const contact = submission.contact;
  return [
    new Date().toISOString(),
    participantLabels[submission.participantType],
    employer?.location ?? "", employer?.size ?? "", employer?.hiringRole ?? "",
    choiceLabel(employer?.recurringNeed), choiceLabel(employer?.concreteCase), employer?.functions ?? "",
    choiceLabel(employer?.interview), worker?.homeLocation ?? "", worker?.workLocation ?? "",
    worker?.situation ?? "", worker?.situationOther ?? "", choiceLabel(worker?.activeSearch),
    choiceLabel(worker?.openToWork), worker?.openReason ?? "", worker?.decisions.join("; ") ?? "",
    choiceLabel(worker?.concreteCase), choiceLabel(worker?.interview),
    submission.interviewInterest ? "Ja" : "Nee", submission.consent ? "Ja" : "Nee",
    contact?.name ?? "", contact?.email ?? "", contact?.phone ?? "", contact?.preference ?? "",
  ];
}

function getConfiguration() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!spreadsheetId || !clientEmail || !privateKey) return null;
  return {
    spreadsheetId,
    clientEmail,
    privateKey,
    sheetName: `${process.env.GOOGLE_SHEETS_SHEET_NAME || "Submissions"} v4`,
  };
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 });
  }
  if (!isSubmission(payload)) {
    return NextResponse.json({ error: "De antwoorden zijn niet geldig." }, { status: 400 });
  }
  const configuration = getConfiguration();
  if (!configuration) {
    return NextResponse.json({ error: "Opslag is nog niet geconfigureerd." }, { status: 503 });
  }

  const key = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const now = Date.now();
  for (const [cachedKey, cachedAt] of recentSubmissionKeys) {
    if (now - cachedAt >= duplicateWindowMs) recentSubmissionKeys.delete(cachedKey);
  }
  const previous = recentSubmissionKeys.get(key);
  if (previous && now - previous < duplicateWindowMs) {
    return NextResponse.json({ ok: true, deduplicated: true });
  }
  recentSubmissionKeys.set(key, now);

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: { client_email: configuration.clientEmail, private_key: configuration.privateKey },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });
    const sheetRange = `'${configuration.sheetName.replace(/'/g, "''")}'`;
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: configuration.spreadsheetId,
      fields: "sheets.properties.title",
    });
    if (!metadata.data.sheets?.some((sheet) => sheet.properties?.title === configuration.sheetName)) {
      try {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: configuration.spreadsheetId,
          requestBody: { requests: [{ addSheet: { properties: { title: configuration.sheetName } } }] },
        });
      } catch (error) {
        const latest = await sheets.spreadsheets.get({
          spreadsheetId: configuration.spreadsheetId,
          fields: "sheets.properties.title",
        });
        if (!latest.data.sheets?.some((sheet) => sheet.properties?.title === configuration.sheetName)) {
          throw error;
        }
      }
    }
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: configuration.spreadsheetId,
      range: `${sheetRange}!A1:Y1`,
    });
    const existingHeader = headerResponse.data.values?.[0] ?? [];
    if (existingHeader.length && JSON.stringify(existingHeader) !== JSON.stringify(sheetHeaders)) {
      throw new Error(`Onverwachte kolomkoppen in ${configuration.sheetName}; inzending niet opgeslagen.`);
    }
    if (!existingHeader.length) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: configuration.spreadsheetId,
        range: `${sheetRange}!A1:Y1`,
        valueInputOption: "RAW",
        requestBody: { values: [sheetHeaders] },
      });
    }
    await sheets.spreadsheets.values.append({
      spreadsheetId: configuration.spreadsheetId,
      range: `${sheetRange}!A:Y`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [toSheetRow(payload)] },
    });
    return NextResponse.json({ ok: true, deduplicated: false });
  } catch (error) {
    recentSubmissionKeys.delete(key);
    console.error("Google Sheets submission failed", error);
    return NextResponse.json({ error: "Opslaan is niet gelukt. Probeer het opnieuw." }, { status: 502 });
  }
}
