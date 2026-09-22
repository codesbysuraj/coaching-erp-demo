import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma, withRetry } from "@/lib/prisma";
import { getAdminFromCookies, isSuperAdmin } from "@/lib/auth";

// GET /api/admins — list all admins with their login logs (super admin only)
export async function GET() {
  const me = await getAdminFromCookies();
  if (!me || !isSuperAdmin(me)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admins = await withRetry(() =>
    prisma.$queryRaw<
      {
        id: number;
        name: string;
        email: string;
        role: string;
        modules: string[];
        createdAt: Date;
        lastLogin: Date | null;
        loginCount: number;
      }[]
    >`
      SELECT
        a.id,
        a.name,
        a.email,
        a.role,
        a.modules,
        a."createdAt",
        MAX(l."loggedInAt") AS "lastLogin",
        COUNT(l.id)::int AS "loginCount"
      FROM "Admin" a
      LEFT JOIN "AdminLoginLog" l ON l."adminId" = a.id
      GROUP BY a.id, a.name, a.email, a.role, a.modules, a."createdAt"
      ORDER BY a."createdAt" ASC
    `
  );

  return NextResponse.json(admins);
}

// POST /api/admins — create a new admin (super admin only)
export async function POST(req: NextRequest) {
  const me = await getAdminFromCookies();
  if (!me || !isSuperAdmin(me)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, password, role, modules = ["SCHOOL"] } = await req.json();

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const adminRole = role === "SUPER_ADMIN" ? "SUPER_ADMIN" : "ADMIN";
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await withRetry(() =>
      prisma.$executeRaw`
        INSERT INTO "Admin" (name, email, "passwordHash", role, modules, "createdAt")
        VALUES (${name}, ${email}, ${passwordHash}, ${adminRole}, ${modules}, NOW())
      `
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    const msg = String(e);
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 });
    }
    console.error("[admins POST]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/admins?id=X — delete an admin (super admin only, cannot delete self)
export async function DELETE(req: NextRequest) {
  const me = await getAdminFromCookies();
  if (!me || !isSuperAdmin(me)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const id = Number(req.nextUrl.searchParams.get("id"));
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  if (id === me.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  await withRetry(() => prisma.$executeRaw`DELETE FROM "Admin" WHERE id = ${id}`);
  return NextResponse.json({ success: true });
}
