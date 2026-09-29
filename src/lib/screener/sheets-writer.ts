import type { sheets_v4 } from "googleapis";
import { isResearchSubmission, storageSchema, storageHeaderUpdate, storageRow, type AnySubmission } from "./research-storage.ts";
import { SubmissionConflict } from "./submit-handler.ts";

type SheetsClient = Pick<sheets_v4.Sheets, "spreadsheets">;
export async function writeToSheets(sheets: SheetsClient, spreadsheetId: string, prefix: string, payload: AnySubmission, fingerprint: string) {
  const { suffix, headers, lastColumn } = storageSchema(payload);
  const sheetName = `${prefix} ${suffix}`;
  const sheetRange = `'${sheetName.replace(/'/g, "''")}'`;
  const metadata = () => sheets.spreadsheets.get({ spreadsheetId, fields: "sheets.properties" });
  let properties = (await metadata()).data.sheets?.find((sheet) => sheet.properties?.title === sheetName)?.properties;
  if (!properties) {
    try {
      await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title: sheetName, gridProperties: { columnCount: Math.max(26, headers.length), rowCount: 1000 } } } }] } });
    } catch (error) {
      // Another instance may create the same tab first. No other failure is hidden.
      properties = (await metadata()).data.sheets?.find((sheet) => sheet.properties?.title === sheetName)?.properties;
      if (!properties) throw error;
    }
  }
  if (properties?.sheetId !== undefined && properties?.sheetId !== null && (properties.gridProperties?.columnCount ?? 0) < headers.length) {
    await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ updateSheetProperties: { properties: { sheetId: properties.sheetId, gridProperties: { columnCount: headers.length } }, fields: "gridProperties.columnCount" } }] } });
  }
  const existingHeader = (await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetRange}!1:1` })).data.values?.[0] ?? [];
  const headerUpdate = storageHeaderUpdate(payload, existingHeader);
  if (headerUpdate) await sheets.spreadsheets.values.update({ spreadsheetId, range: `${sheetRange}!${headerUpdate.range}`, valueInputOption: "RAW", requestBody: { values: headerUpdate.values } });
  if (isResearchSubmission(payload)) {
    const ids = (await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetRange}!A2:B` })).data.values ?? [];
    const existing = ids.find((row) => row[0] === payload.submissionId);
    if (existing) {
      if (existing[1] !== fingerprint) throw new SubmissionConflict();
      return;
    }
  }
  await sheets.spreadsheets.values.append({ spreadsheetId, range: `${sheetRange}!A:${lastColumn}`, valueInputOption: "RAW", insertDataOption: "INSERT_ROWS",
    requestBody: { values: [storageRow(payload, new Date().toISOString(), fingerprint)] },
  });
}
