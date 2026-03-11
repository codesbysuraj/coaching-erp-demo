import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET ALL ATTENDANCE RECORDS
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const subject = searchParams.get("subject");
    
    const where: any = {};
    if (date) {
      where.date = new Date(date);
    }
    if (subject) {
      where.subject = subject;
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: true,
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch attendance" }, { status: 500 });
  }
}

// CREATE/UPDATE ATTENDANCE
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId, date, status, subject } = body;
    const subjectValue = subject || "General";

    const attendance = await prisma.attendance.upsert({
      where: {
        studentId_date_subject: {
          studentId: parseInt(studentId),
          date: new Date(date),
          subject: subjectValue,
        },
      },
      update: {
        status,
      },
      create: {
        studentId: parseInt(studentId),
        date: new Date(date),
        subject: subjectValue,
        status,
      },
    });

    return NextResponse.json(attendance);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create attendance" }, { status: 500 });
  }
}
