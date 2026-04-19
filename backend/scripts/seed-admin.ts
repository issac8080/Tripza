import bcrypt from "bcryptjs";
import { UserRole } from "../src/domain/enums";
import { createUserWithProfile, emailTaken } from "../src/firestore/users";

async function main() {
  const email = "admin@keralatravels.local";
  if (await emailTaken(email)) {
    // eslint-disable-next-line no-console
    console.log("Admin already exists, skipping seed.");
    return;
  }

  const passwordHash = await bcrypt.hash("Adminchange!1", 11);
  await createUserWithProfile({
    email,
    phone: null,
    passwordHash,
    name: "Platform Admin",
    role: UserRole.ADMIN,
  });

  // eslint-disable-next-line no-console
  console.log("Seeded admin:", email, "(password: Adminchange!1) — change immediately in production.");
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
