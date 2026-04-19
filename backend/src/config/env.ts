import path from "path";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import dotenv from "dotenv";
import { z } from "zod";

/** `backend/` directory (this file lives in `backend/src/config/`). */
const backendRoot = path.resolve(__dirname, "..", "..");

function loadEnvFiles(): void {
  const cwdEnv = path.join(process.cwd(), ".env");
  const backendEnv = path.join(backendRoot, ".env");
  const cwdBackendEnv = path.join(process.cwd(), "backend", ".env");

  // Later calls with override: true win so anchored backend/.env is authoritative.
  if (existsSync(cwdEnv)) {
    dotenv.config({ path: cwdEnv });
  }
  if (existsSync(cwdBackendEnv)) {
    dotenv.config({ path: cwdBackendEnv, override: true });
  }
  if (existsSync(backendEnv)) {
    dotenv.config({ path: backendEnv, override: true });
  }
}

loadEnvFiles();

function stripQuotes(s: string | undefined): string | undefined {
  if (!s) {
    return undefined;
  }
  const t = s.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1).trim();
  }
  return t;
}

/** Non-empty JSON that looks like a Firebase service account (skip 0-byte placeholder files). */
function isUsableServiceAccountFile(filePath: string): boolean {
  try {
    if (!existsSync(filePath)) {
      return false;
    }
    const raw = readFileSync(filePath, "utf8").trim();
    if (raw.length < 80) {
      return false;
    }
    return raw.includes('"type"') && raw.includes("service_account");
  } catch {
    return false;
  }
}

/** If no env-based credentials, use a key file dropped in `backend/` (easiest on Windows / OneDrive paths). */
function applyDefaultServiceAccountFile(): void {
  const hasExplicit =
    Boolean(stripQuotes(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) ||
    Boolean(stripQuotes(process.env.GOOGLE_APPLICATION_CREDENTIALS)) ||
    Boolean(stripQuotes(process.env.FIREBASE_SERVICE_ACCOUNT_PATH));
  if (hasExplicit) {
    return;
  }
  const candidates = [
    path.join(backendRoot, "firebase-service-account.local.json"),
    path.join(backendRoot, "serviceAccount.json"),
  ];
  for (const p of candidates) {
    if (isUsableServiceAccountFile(p)) {
      process.env.GOOGLE_APPLICATION_CREDENTIALS = p;
      return;
    }
  }
  try {
    const files = readdirSync(backendRoot);
    const sdk = files.find(
      (f) => f.endsWith(".json") && f.includes("firebase-adminsdk") && !f.toLowerCase().includes(".example"),
    );
    if (sdk) {
      const full = path.join(backendRoot, sdk);
      if (isUsableServiceAccountFile(full)) {
        process.env.GOOGLE_APPLICATION_CREDENTIALS = full;
      }
    }
  } catch {
    /* ignore */
  }
}

applyDefaultServiceAccountFile();

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().default(4000),
    JWT_SECRET: z.string().min(8),
    /** Comma-separated browser origins allowed for CORS (first is default for Socket.IO if multiple). */
    CORS_ORIGIN: z.string().default("http://localhost:3000"),
    /** Full JSON of the Firebase service account (from Console → Project settings → Service accounts). */
    FIREBASE_SERVICE_ACCOUNT_JSON: z.string().optional(),
    /** Absolute path to the service account JSON file (standard Google env name). */
    GOOGLE_APPLICATION_CREDENTIALS: z.string().optional(),
    /** Same as GOOGLE_APPLICATION_CREDENTIALS — use if you prefer this name in .env. */
    FIREBASE_SERVICE_ACCOUNT_PATH: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    const hasJson = Boolean(stripQuotes(data.FIREBASE_SERVICE_ACCOUNT_JSON));
    const credPath =
      stripQuotes(data.GOOGLE_APPLICATION_CREDENTIALS) ||
      stripQuotes(data.FIREBASE_SERVICE_ACCOUNT_PATH);
    const hasPath = Boolean(credPath);
    if (!hasJson && !hasPath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: [
          "Missing Firebase Admin credentials for Firestore.",
          `Fastest fix: Firebase Console → Project settings → Service accounts → Generate new private key,`,
          `save the downloaded file as: ${path.join(backendRoot, "firebase-service-account.local.json")}`,
          `(or ${path.join(backendRoot, "serviceAccount.json")}) — no .env path needed.`,
          `Alternatively set in ${path.join(backendRoot, ".env")}: GOOGLE_APPLICATION_CREDENTIALS=<full path> OR FIREBASE_SERVICE_ACCOUNT_JSON=<one-line JSON>.`,
          "NEXT_PUBLIC_FIREBASE_* (web client keys) cannot be used on the server.",
        ].join(" "),
        path: [],
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

const parsed = envSchema.parse(process.env);

const googleApplicationCredentialsPath =
  stripQuotes(parsed.GOOGLE_APPLICATION_CREDENTIALS) ||
  stripQuotes(parsed.FIREBASE_SERVICE_ACCOUNT_PATH);

export const env: Env = {
  ...parsed,
  FIREBASE_SERVICE_ACCOUNT_JSON: stripQuotes(parsed.FIREBASE_SERVICE_ACCOUNT_JSON),
  GOOGLE_APPLICATION_CREDENTIALS: googleApplicationCredentialsPath,
};

export function getCorsOrigins(): string[] {
  return env.CORS_ORIGIN.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
