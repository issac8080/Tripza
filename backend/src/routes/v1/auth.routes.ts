import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { PreferredLanguage, UserRole } from "../../domain/enums";
import { asyncHandler } from "../../middleware/asyncHandler";
import { requireAuth } from "../../middleware/requireAuth";
import { getUserById, updateUser } from "../../firestore/users";
import { loginUser, registerUser } from "../../services/authService";
import { HttpError } from "../../utils/httpError";

export const authRouter = Router();

const userRoleZ = z.enum([UserRole.TRAVELER, UserRole.PROVIDER, UserRole.ADMIN]);
const preferredLanguageZ = z.enum([PreferredLanguage.EN, PreferredLanguage.ML]);

const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 40,
  message: { message: "Too many auth attempts, try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const registerSchema = z
  .object({
    email: z.string().email().optional(),
    phone: z.string().min(8).max(20).optional(),
    password: z.string().min(8).max(128),
    name: z.string().min(1).max(120),
    role: userRoleZ.default(UserRole.TRAVELER),
  })
  .refine((d) => d.role !== UserRole.ADMIN, { message: "Invalid role" });

authRouter.post(
  "/register",
  authLimiter,
  asyncHandler(async (req, res) => {
    const body = registerSchema.parse(req.body);
    const result = await registerUser(body);
    res.status(201).json(result);
  }),
);

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().min(8).max(20).optional(),
  password: z.string().min(1).max(128),
});

authRouter.post(
  "/login",
  authLimiter,
  asyncHandler(async (req, res) => {
    const body = loginSchema.parse(req.body);
    const result = await loginUser(body);
    res.json(result);
  }),
);

authRouter.get(
  "/me",
  requireAuth(),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }
    const user = await getUserById(req.auth.userId);
    if (!user) {
      throw new HttpError(404, "User not found");
    }
    res.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      photoUrl: user.photoUrl,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt,
    });
  }),
);

const patchMeSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  preferredLanguage: preferredLanguageZ.optional(),
});

authRouter.patch(
  "/me",
  requireAuth(),
  asyncHandler(async (req, res) => {
    if (!req.auth) {
      throw new HttpError(401, "Unauthorized");
    }
    const body = patchMeSchema.parse(req.body);
    const user = await updateUser(req.auth.userId, {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.preferredLanguage !== undefined ? { preferredLanguage: body.preferredLanguage } : {}),
    });
    res.json({
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      photoUrl: user.photoUrl,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt,
    });
  }),
);

authRouter.post(
  "/otp/request",
  authLimiter,
  asyncHandler(async (_req, res) => {
    res.status(501).json({ message: "OTP login is planned; use email/phone + password for now." });
  }),
);
