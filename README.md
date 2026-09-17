# Crispy recruitment screener

Standalone Next.js screener for selecting interview participants in the Crispy graduation research. The form is for screening and contact only, not for conducting the interview itself.

## Run locally

Use Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Run `npm run build` followed by `npm start` for a production-like local run.

## Routes and consent

- Employers answer questions about their location, establishment size, hiring role, recurring needs, a concrete case, functions and interview interest. Someone without a hiring role finishes early on this route.
- Workers and job seekers can enter home and work towns on one optional screen, followed by their current situation, recent active search, openness when not actively searching, recent work decisions, a concrete case and interview interest. Current employment status alone does not exclude anyone.
- Participants selecting both complete the employer route first, see a short transition, then complete the worker route. They provide contact details only once.
- A `yes` or `maybe` to either relevant interview question opens the contact route. Name and email are required; phone is optional unless WhatsApp or calling is preferred. Contact consent is asked explicitly. If consent is `no`, the submission has no contact object even if details were entered earlier.
- The fortune cookie appears on every thank-you screen. Fortunes are selected from the participant's audience pool and stay fixed in the browser session.

Navigation and validation live in `src/lib/screener/steps.ts`. Form state and rendering live in `src/components/screener/screener.tsx`. Fortune messages are editable in `src/lib/screener/fortunes.ts`.

## Google Sheets storage

The server-only route `src/app/api/submissions/route.ts` validates the submission and appends it to Google Sheets. Configure `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` and, optionally, `GOOGLE_SHEETS_SHEET_NAME`. Give the service account editor access and enable the Google Sheets API. Do not expose credentials through `NEXT_PUBLIC_*`.

The new questionnaire uses 25 columns and writes to a separate tab named `<GOOGLE_SHEETS_SHEET_NAME> v4` (or `Submissions v4` when the variable is absent). The tab and its header row are created automatically if missing. Earlier tabs remain untouched. Submissions without consent keep the contact columns empty. Text is written as raw values to avoid interpreting participant answers as spreadsheet formulas.

The server suppresses identical retries for one minute per running instance. A failed Sheets write returns an error and allows a retry.

The optional location screen asks for home and work town names without showing a map or sending them to a map provider.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

The tests cover route order, conditional questions, early exits, consent, contact omission, optional fields and multi-select validation. Browser checks should use a mocked `/api/submissions` response to avoid adding test rows to the real Sheet.

## Deploy

This directory is the Vercel project root. Deploying the code requires the same server-side Sheets environment variables in Vercel. The repository is connected to Vercel; pushes to the production branch normally trigger deployment. Do not assume a local edit is live until it is committed, pushed and the Vercel deployment is ready.
