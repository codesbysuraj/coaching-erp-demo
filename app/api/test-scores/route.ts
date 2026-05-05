import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";

// GET TEST SCORES
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const subject = searchParams.get("subject");

    const where: { studentId?: number; subject?: string } = {};
    if (studentId) {
      where.studentId = parseInt(studentId);
    }
    if (subject) {
      where.subject = subject;
    }

    const testScores = await withRetry(() => prisma.testScore.findMany({
      where,
      include: {
        student: true,
      },
      orderBy: { date: "desc" },
    }));

    return NextResponse.json(testScores);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch test scores" }, { status: 500 });
  }
}

// CREATE TEST SCORE
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const testScore = await withRetry(() => prisma.testScore.create({
      data: {
        studentId: parseInt(body.studentId),
        subject: body.subject,
        testName: body.testName,
        maxMarks: parseFloat(body.maxMarks),
        obtainedMarks: parseFloat(body.obtainedMarks),
        date: new Date(body.date),
      },
    }));

    return NextResponse.json(testScore);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create test score" }, { status: 500 });
  }
}
