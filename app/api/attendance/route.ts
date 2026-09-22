import { NextResponse } from "next/server";
import { getAdminFromCookies, hasSchoolAccess } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";

// GET ALL ATTENDANCE RECORDS
export async function GET(req: Request) {
  const admin = await getAdminFromCookies();
  if (!hasSchoolAccess(admin)) { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const subject = searchParams.get("subject");
    
    const where: {
      date?: { gte: Date; lt: Date };
      subject?: string;
    } = {};
    if (date) {
      // Use a day-range query so timezone offsets never cause a miss
      const startOfDay = new Date(`${date}T00:00:00.000Z`);
      const nextDay = new Date(startOfDay);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      where.date = { gte: startOfDay, lt: nextDay };
    }
    if (subject) {
      where.subject = subject;
    }

    const attendance = await withRetry(() => prisma.attendance.findMany({
      where,
      include: {
        student: true,
      },
      orderBy: { date: "desc" },
    }));

    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// CREATE/UPDATE/DELETE ATTENDANCE
export async function POST(req: Request) {
  const admin = await getAdminFromCookies();
  if (!hasSchoolAccess(admin)) { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  try {
    const body = await req.json();
    const { studentId, date, status, subject } = body;
    const subjectValue = subject || "General";
    const trimmedStatus = typeof status === "string" ? status.trim() : "";

    if (!trimmedStatus) {
      await withRetry(() => prisma.attendance.deleteMany({
        where: {
          studentId: parseInt(studentId),
          date: new Date(date),
          subject: subjectValue,
        },
      }));

      return NextResponse.json({ message: "Attendance cleared" });
    }

    const attendance = await withRetry(() => prisma.attendance.upsert({
      where: {
        studentId_date_subject: {
          studentId: parseInt(studentId),
          date: new Date(date),
          subject: subjectValue,
        },
      },
      update: {
        status: trimmedStatus,
      },
      create: {
        studentId: parseInt(studentId),
        date: new Date(date),
        subject: subjectValue,
        status: trimmedStatus,
      },
    }));

    return NextResponse.json(attendance);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create attendance" }, { status: 500 });
  }
}
