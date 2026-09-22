import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";
import { createStudentRecord } from "@/lib/student-service";
import { getAdminFromCookies, hasSchoolAccess } from "@/lib/auth";

// GET ALL STUDENTS – raw SQL for new totalFees column
export async function GET(req: Request) {
  const admin = await getAdminFromCookies();
  if (!hasSchoolAccess(admin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const standard = searchParams.get("standard");

    const students = standard
      ? await withRetry(() => prisma.$queryRaw`
          SELECT id, "firstName", "middleName", "lastName", gender, dob, mobile, email,
                 "aadharNo", standard, subjects, course, board, "photoUrl", "totalFees", "targetExams", "createdAt"
          FROM "Student"
          WHERE "deletedAt" IS NULL AND standard = ${standard}
          ORDER BY id DESC
        `)
      : await withRetry(() => prisma.$queryRaw`
          SELECT id, "firstName", "middleName", "lastName", gender, dob, mobile, email,
                 "aadharNo", standard, subjects, course, board, "photoUrl", "totalFees", "targetExams", "createdAt"
          FROM "Student"
          WHERE "deletedAt" IS NULL
          ORDER BY id DESC
        `);

    return NextResponse.json(students);
  } catch (error) {
    console.error("[GET /api/students]", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

// CREATE STUDENT – fully raw SQL to bypass stale Prisma client
export async function POST(req: Request) {
  const admin = await getAdminFromCookies();
  if (!hasSchoolAccess(admin)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();

    const student = await withRetry(() => prisma.$transaction(async (tx) => createStudentRecord(tx, body)));
    return NextResponse.json(student);
  } catch (error) {
    console.error("[POST /api/students]", error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
