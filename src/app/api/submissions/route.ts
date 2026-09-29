import { google } from "googleapis";
import { createSubmissionHandler } from "@/lib/screener/submit-handler";
import { writeToSheets } from "@/lib/screener/sheets-writer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createSubmissionHandler(() => {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!spreadsheetId || !clientEmail || !privateKey) return null;
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const prefix = process.env.GOOGLE_SHEETS_SHEET_NAME || "Submissions";
  return (payload, fingerprint) => writeToSheets(sheets, spreadsheetId, prefix, payload, fingerprint);
});
