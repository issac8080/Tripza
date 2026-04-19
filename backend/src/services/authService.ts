import { UserRole } from "../domain/enums";
import {
  createUserWithProfile,
  emailTaken,
  findUserByEmail,
  findUserByPhone,
  phoneTaken,
} from "../firestore/users";
import { hashPassword, verifyPassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { HttpError } from "../utils/httpError";

export async function registerUser(input: {
  email?: string | null;
  phone?: string | null;
  password: string;
  name: string;
  role: UserRole;
}) {
  if (!input.email && !input.phone) {
    throw new HttpError(400, "Email or phone is required");
  }

  if (input.role === UserRole.ADMIN) {
    throw new HttpError(403, "Cannot self-register as admin");
  }

  if (input.email && (await emailTaken(input.email))) {
    throw new HttpError(409, "Email or phone already registered");
  }
  if (input.phone && (await phoneTaken(input.phone))) {
    throw new HttpError(409, "Email or phone already registered");
  }

  const passwordHash = await hashPassword(input.password);

  const user = await createUserWithProfile({
    email: input.email ?? null,
    phone: input.phone ?? null,
    passwordHash,
    name: input.name,
    role: input.role,
  });

  const token = signToken({ sub: user.id, role: user.role });

  return {
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
      createdAt: user.createdAt,
    },
    token,
  };
}

export async function loginUser(input: { email?: string | null; phone?: string | null; password: string }) {
  if (!input.email && !input.phone) {
    throw new HttpError(400, "Email or phone is required");
  }

  const user = input.email ? await findUserByEmail(input.email) : await findUserByPhone(input.phone!);

  if (!user?.passwordHash) {
    throw new HttpError(401, "Invalid credentials");
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    throw new HttpError(401, "Invalid credentials");
  }

  const token = signToken({ sub: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      preferredLanguage: user.preferredLanguage,
    },
  };
}
