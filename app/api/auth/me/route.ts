import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { getAdminFromCookies } from "@/lib/auth";

export async function GET() {
  const admin = await getAdminFromCookies();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Raw query to bypass stale client
  const rows = await withRetry(() => prisma.$queryRaw<{ id: number; name: string; email: string; role: string }[]>`
    SELECT id, name, email, role FROM "Admin" WHERE id = ${admin.id} LIMIT 1
  `);

  if (!rows || rows.length === 0) {
    return NextResponse.json({ error: "Admin not found" }, { status: 404 });
  }

  const { id, name, email, role } = rows[0];
  return NextResponse.json({ id, name, email, role });
}
