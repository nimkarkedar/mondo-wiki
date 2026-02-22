import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET() {
  const checks: Record<string, string> = {};

  // Check env vars
  checks.GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID ? "✅ set" : "❌ missing";
  checks.GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    ? `✅ ${process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL}`
    : "❌ missing";
  checks.GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY
    ? `✅ length=${process.env.GOOGLE_PRIVATE_KEY.length}, starts_with="${process.env.GOOGLE_PRIVATE_KEY.slice(0, 30)}"`
    : "❌ missing";

  const rawKey = process.env.GOOGLE_PRIVATE_KEY ?? "";
  const parsedKey = rawKey.replace(/\\n/g, "\n");
  checks.key_has_newlines = parsedKey.includes("\n") ? "✅ yes" : "❌ no (newlines not parsed — key may be malformed)";
  checks.key_has_begin = parsedKey.includes("BEGIN RSA PRIVATE KEY") || parsedKey.includes("BEGIN PRIVATE KEY")
    ? "✅ yes"
    : "❌ no (key doesn't contain expected PEM header)";

  try {
    const auth = new google.auth.JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: parsedKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    // Attempt to get a token (this will fail if credentials are wrong)
    await auth.getAccessToken();
    checks.auth = "✅ token obtained";

    // Try to append a test row
    const sheets = google.sheets({ version: "v4", auth });
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: "Sheet1!A:C",
      valueInputOption: "RAW",
      requestBody: {
        values: [["TEST ROW — DELETE ME", "diagnostic test", new Date().toISOString()]],
      },
    });
    checks.sheet_write = "✅ row written successfully";
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err);
    checks.error = `❌ ${msg}`;
  }

  return NextResponse.json(checks);
}
