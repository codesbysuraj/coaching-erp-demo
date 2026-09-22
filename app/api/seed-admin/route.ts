import { NextResponse } from "next/server";
import { getAdminFromCookies, hasSchoolAccess } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { prisma, withRetry } from "@/lib/prisma";

// Force-reseed: deletes and recreates admin as SUPER_ADMIN
export async function GET() {
  const admin = await getAdminFromCookies();
  if (!hasSchoolAccess(admin)) { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  try {
    const passwordHash = await bcrypt.hash("Admin@1234", 12);

    await withRetry(() => prisma.$executeRaw`DELETE FROM "Admin" WHERE email = 'admin@kmeson.com'`);
    await withRetry(() => prisma.$executeRaw`
      INSERT INTO "Admin" (name, email, "passwordHash", role, "createdAt")
      VALUES ('Admin', 'admin@kmeson.com', ${passwordHash}, 'SUPER_ADMIN', NOW())
    `);

    return NextResponse.json({
      success: true,
      message: "Super Admin reseeded. Email: admin@kmeson.com, Password: Admin@1234, Role: SUPER_ADMIN",
    });
  } catch (e) {
    console.error("[seed-admin]", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
