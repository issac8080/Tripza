import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { ZodError } from "zod";
import { v1Router } from "./routes/v1";
import { tryFormatFirestoreGrpcError } from "./utils/firestoreGrpcError";
import { HttpError } from "./utils/httpError";
import { env, getCorsOrigins } from "./config/env";

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "production" ? 400 : 2000,
  standardHeaders: true,
  legacyHeaders: false,
});

export function createApp() {
  const app = express();

  if (env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.disable("x-powered-by");
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  const allowedOrigins = getCorsOrigins();
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          return callback(null, true);
        }
        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    }),
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use("/api/v1", apiLimiter);

  app.get("/", (_req, res) => {
    res.json({ service: "kerala-travels-api", version: "0.1.0" });
  });

  app.use("/api/v1", v1Router);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (err instanceof Error && err.message === "Not allowed by CORS") {
      return res.status(403).json({ message: "Origin not allowed" });
    }
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message, details: err.details });
    }
    if (err instanceof ZodError) {
      return res.status(400).json({ message: "Validation failed", details: err.flatten() });
    }
    if (err instanceof Error) {
      const m = err.message;
      if (
        m.includes("Service account") ||
        m.includes("Firebase Admin") ||
        m.includes("FIREBASE_SERVICE_ACCOUNT_JSON")
      ) {
        return res.status(503).json({
          code: "FIREBASE_MISCONFIGURED",
          message: m,
        });
      }
    }
    const firestoreErr = tryFormatFirestoreGrpcError(err);
    if (firestoreErr) {
      return res.status(firestoreErr.status).json(firestoreErr.body);
    }
    // eslint-disable-next-line no-console
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
  });

  return app;
}
