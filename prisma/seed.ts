import { PrismaClient } from "../generated/prisma";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 12);

  const founder = await db.user.upsert({
    where: { email: "admin@thevault.com" },
    update: {},
    create: {
      email: "admin@thevault.com",
      name: "Vault Founder",
      password,
      memberNumber: "0001",
    },
  });

  console.log(`Founder user: ${founder.id} (${founder.email})`);

  const codes = ["VAULT001", "VAULT002", "VAULT003", "VAULT004", "VAULT005"];

  for (const code of codes) {
    await db.inviteCode.upsert({
      where: { code },
      update: {},
      create: {
        code,
        createdById: founder.id,
      },
    });
  }

  console.log(`Created invite codes: ${codes.join(", ")}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
