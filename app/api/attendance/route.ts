import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";

// GET ALL ATTENDANCE RECORDS
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const subject = searchParams.get("subject");
    
    const where: { date?: Date; subject?: string } = {};
    if (date) {
      where.date = new Date(date);
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
