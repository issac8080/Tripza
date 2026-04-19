/**
 * Map common Firestore / gRPC failures from @google-cloud/firestore into HTTP-friendly payloads.
 */
export function tryFormatFirestoreGrpcError(err: unknown): { status: number; body: Record<string, unknown> } | null {
  const chain: unknown[] = [];
  let cur: unknown = err;
  while (cur && chain.length < 5) {
    chain.push(cur);
    if (typeof cur === "object" && cur !== null && "cause" in cur) {
      cur = (cur as { cause: unknown }).cause;
    } else {
      break;
    }
  }

  for (const e of chain) {
    const formatted = formatOne(e);
    if (formatted) {
      return formatted;
    }
  }
  return null;
}

function extractIndexCreateUrl(text: string): string | undefined {
  const m = text.match(/https:\/\/console\.firebase\.google\.com[^\s]+/);
  return m?.[0];
}

function formatOne(err: unknown): { status: number; body: Record<string, unknown> } | null {
  if (!err || typeof err !== "object") {
    return null;
  }
  const o = err as Record<string, unknown>;
  const details = typeof o.details === "string" ? o.details : "";
  const reason = typeof o.reason === "string" ? o.reason : "";
  const code = o.code;
  const msg = err instanceof Error ? err.message : "";

  const indexRequired =
    (code === 9 || msg.includes("FAILED_PRECONDITION")) &&
    (details.includes("requires an index") || msg.includes("requires an index"));
  if (indexRequired) {
    const indexCreateUrl = extractIndexCreateUrl(details) ?? extractIndexCreateUrl(msg);
    return {
      status: 503,
      body: {
        code: "FIRESTORE_INDEX_REQUIRED",
        message:
          "This query needs a Firestore composite index. Open the link below (or run `firebase deploy --only firestore:indexes` from the Travels repo). Indexes usually finish building in 1–5 minutes.",
        indexCreateUrl:
          indexCreateUrl ??
          "https://console.firebase.google.com/project/travel-942ac/firestore/indexes",
      },
    };
  }

  const mentionsFirestoreDisabled =
    details.includes("Cloud Firestore API has not been used") ||
    details.includes("firestore.googleapis.com") ||
    msg.includes("Cloud Firestore API has not been used");

  const serviceDisabled = reason === "SERVICE_DISABLED" && mentionsFirestoreDisabled;
  const permissionWithFirestoreHint = code === 7 && mentionsFirestoreDisabled;

  if (!serviceDisabled && !permissionWithFirestoreHint) {
    return null;
  }

  const meta = o.errorInfoMetadata as Record<string, string> | undefined;
  const activateUrl =
    meta?.activationUrl ??
    "https://console.firebase.google.com/project/_/firestore";

  return {
    status: 503,
    body: {
      code: "FIRESTORE_API_DISABLED",
      message:
        "Cloud Firestore is not enabled for this Firebase / Google Cloud project. Enable the Cloud Firestore API, open Firebase Console → Build → Firestore Database, and create the database. After enabling, wait 2–5 minutes and retry.",
      activateUrl,
    },
  };
}
