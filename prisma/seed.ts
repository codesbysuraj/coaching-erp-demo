import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "admin@kmeson.com";
  const existing = await prisma.admin.findUnique({ where: { email } });
  if (existing) {
    await prisma.admin.update({
      where: { email },
      data: { role: "SUPER_ADMIN" },
    });
    console.log("Admin already existed, role updated to SUPER_ADMIN.");
    return;
  }

  const passwordHash = await bcrypt.hash("Admin@1234", 12);
  await prisma.admin.create({
    data: {
      name: "Admin",
      email,
      passwordHash,
      role: "SUPER_ADMIN",
    },
  });

  console.log("✅ Seeded admin: admin@kmeson.com / Admin@1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
