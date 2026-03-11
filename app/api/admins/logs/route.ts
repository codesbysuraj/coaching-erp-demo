import { NextRequest, NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { getAdminFromCookies, isSuperAdmin } from "@/lib/auth";

// GET /api/admins/logs?adminId=X — login logs (super admin only)
export async function GET(req: NextRequest) {
  const me = await getAdminFromCookies();
  if (!me || !isSuperAdmin(me)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminIdParam = req.nextUrl.searchParams.get("adminId");
  const adminId = adminIdParam ? Number(adminIdParam) : null;

  type LogRow = { id: number; email: string; name: string; ipAddress: string; userAgent: string; loggedInAt: Date };

  const logs = adminId
    ? await withRetry(() =>
        prisma.$queryRaw<LogRow[]>`
          SELECT id, email, name, "ipAddress", "userAgent", "loggedInAt"
          FROM "AdminLoginLog"
          WHERE "adminId" = ${adminId}
          ORDER BY "loggedInAt" DESC
          LIMIT 100
        `
      )
    : await withRetry(() =>
        prisma.$queryRaw<LogRow[]>`
          SELECT id, email, name, "ipAddress", "userAgent", "loggedInAt"
          FROM "AdminLoginLog"
          ORDER BY "loggedInAt" DESC
          LIMIT 100
        `
      );

  return NextResponse.json(logs);
}
