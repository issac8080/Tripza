import type { RequestHandler } from "express";
import type { UserRole } from "../domain/enums";
import { verifyToken } from "../utils/jwt";
import { HttpError } from "../utils/httpError";

export type AuthedRequest = {
  userId: string;
  role: UserRole;
};

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      auth?: AuthedRequest;
    }
  }
}

/** Sets `req.auth` when a valid Bearer token is present; otherwise continues without auth. */
export const optionalAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return next();
  }
  const token = header.slice("Bearer ".length).trim();
  try {
    const payload = verifyToken(token);
    req.auth = { userId: payload.sub, role: payload.role };
  } catch {
    /* treat as anonymous */
  }
  return next();
};

export function requireAuth(...allowedRoles: UserRole[]): RequestHandler {
  return (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
      return next(new HttpError(401, "Missing bearer token"));
    }
    const token = header.slice("Bearer ".length).trim();
    try {
      const payload = verifyToken(token);
      if (allowedRoles.length > 0 && !allowedRoles.includes(payload.role)) {
        return next(new HttpError(403, "Insufficient permissions"));
      }
      req.auth = { userId: payload.sub, role: payload.role };
      return next();
    } catch {
      return next(new HttpError(401, "Invalid token"));
    }
  };
}
