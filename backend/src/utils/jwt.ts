import jwt, { type SignOptions } from "jsonwebtoken";
import type { UserRole } from "../domain/enums";
import { env } from "../config/env";

export type JwtPayload = {
  sub: string;
  role: UserRole;
};

export function signToken(payload: JwtPayload, expiresIn: SignOptions["expiresIn"] = "7d"): string {
  const options: SignOptions = { expiresIn };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

export function verifyToken(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded !== "object" || decoded === null) {
    throw new Error("Invalid token");
  }
  const sub = (decoded as jwt.JwtPayload).sub;
  const role = (decoded as jwt.JwtPayload & { role?: UserRole }).role;
  if (!sub || !role) {
    throw new Error("Invalid token");
  }
  return { sub, role };
}
