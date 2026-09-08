import { createHash } from "node:crypto";
import { google } from "googleapis";
import { NextResponse } from "next/server";

import type { Submission, YesNo } from "@/lib/screener/steps";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const recentSubmissionKeys = new Map<string, number>();
const duplicateWindowMs = 60_000;

const participantLabels = {
  "job-seeker": "Werkzoekende",
  employer: "Werkgever",
  both: "Beide",
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isYesNo(value: unknown): value is YesNo {
  return value === "yes" || value === "no";
}

function isText(value: unknown, maxLength: number): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= maxLength
  );
}

function isSubmission(value: unknown): value is Submission {
  if (!isRecord(value)) return false;
  const participantType = value.participantType;
  if (
    participantType !== "job-seeker" &&
    participantType !== "employer" &&
    participantType !== "both"
  ) {
    return false;
  }

  if (participantType === "job-seeker" || participantType === "both") {
    if (!isRecord(value.jobSeeker)) return false;
    if (!isYesNo(value.jobSeeker.experienceLast12Months)) return false;
    if (!isText(value.jobSeeker.workType, 500)) return false;
  }

  if (participantType === "employer" || participantType === "both") {
    if (!isRecord(value.employer)) return false;
    if (!isYesNo(value.employer.experienceLast12Months)) return false;
    if (!isText(value.employer.role, 500)) return false;
    if (!isText(value.employer.organizationType, 500)) return false;
  }

  if (typeof value.openToInterview !== "boolean") return false;
  if (value.consent !== value.openToInterview) return false;
  if (value.openToInterview) {
    if (!isRecord(value.contact)) return false;
    if (!isText(value.contact.name, 120)) return false;
    if (!isText(value.contact.email, 254)) return false;
    if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(value.contact.email)) {
      return false;
    }
  }

  return true;
}

function yesNoLabel(value: YesNo | undefined): string {
  return value === "yes" ? "Ja" : value === "no" ? "Nee" : "";
}

function toSheetRow(submission: Submission): string[] {
  const jobSeeker = "jobSeeker" in submission ? submission.jobSeeker : undefined;
  const employer = "employer" in submission ? submission.employer : undefined;
  const contact = submission.openToInterview ? submission.contact : undefined;

  return [
    new Date().toISOString(),
    participantLabels[submission.participantType],
    yesNoLabel(jobSeeker?.experienceLast12Months),
    jobSeeker?.workType ?? "",
    yesNoLabel(employer?.experienceLast12Months),
    employer?.role ?? "",
    employer?.organizationType ?? "",
    submission.openToInterview ? "Ja" : "Nee",
    contact?.name ?? "",
    contact?.email ?? "",
    submission.consent ? "Ja" : "Nee",
  ];
}

function getConfiguration() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );

  if (!spreadsheetId || !clientEmail || !privateKey) return null;

  return {
    spreadsheetId,
    clientEmail,
    privateKey,
    sheetName: process.env.GOOGLE_SHEETS_SHEET_NAME || "Submissions",
  };
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Ongeldige aanvraag." },
      { status: 400 },
    );
  }

  if (!isSubmission(payload)) {
    return NextResponse.json(
      { error: "De antwoorden zijn niet geldig." },
      { status: 400 },
    );
  }

  const configuration = getConfiguration();
  if (!configuration) {
    return NextResponse.json(
      { error: "Opslag is nog niet geconfigureerd." },
      { status: 503 },
    );
  }

  const key = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
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
      credentials: {
        client_email: configuration.clientEmail,
        private_key: configuration.privateKey,
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    const sheets = google.sheets({ version: "v4", auth });

    await sheets.spreadsheets.values.append({
      spreadsheetId: configuration.spreadsheetId,
      range: `'${configuration.sheetName.replace(/'/g, "''")}'!A:K`,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [toSheetRow(payload)] },
    });

    return NextResponse.json({ ok: true, deduplicated: false });
  } catch (error) {
    recentSubmissionKeys.delete(key);
    console.error("Google Sheets submission failed", error);
    return NextResponse.json(
      { error: "Opslaan is niet gelukt. Probeer het opnieuw." },
      { status: 502 },
    );
  }
}
