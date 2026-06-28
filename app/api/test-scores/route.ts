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

// CREATE TEST SCORE (single or batch)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Batch creation: { studentId, testName, date, scores: [{ subject, testName, maxMarks, obtainedMarks, date }] }
    if (body.scores && Array.isArray(body.scores)) {
      const data = body.scores.map((s: { subject: string; testName?: string; maxMarks: string; obtainedMarks: string; date?: string }) => ({
        studentId: parseInt(body.studentId),
        subject: s.subject,
        testName: s.testName || body.testName || "",
        maxMarks: parseFloat(s.maxMarks),
        obtainedMarks: parseFloat(s.obtainedMarks),
        date: new Date(s.date || body.date || new Date()),
      }));

      const result = await withRetry(() => prisma.testScore.createMany({ data }));
      return NextResponse.json({ count: result.count });
    }

    // Single creation (backward compatible)
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

// UPDATE TEST SCORE
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, subject, testName, maxMarks, obtainedMarks, date } = body;

    if (!id) {
      return NextResponse.json({ error: "Test score ID is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (subject !== undefined) updateData.subject = subject;
    if (testName !== undefined) updateData.testName = testName;
    if (maxMarks !== undefined) updateData.maxMarks = parseFloat(maxMarks);
    if (obtainedMarks !== undefined) updateData.obtainedMarks = parseFloat(obtainedMarks);
    if (date !== undefined) updateData.date = new Date(date);

    const testScore = await withRetry(() => prisma.testScore.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: { student: true },
    }));

    return NextResponse.json(testScore);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update test score" }, { status: 500 });
  }
}

// DELETE TEST SCORE
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Test score ID is required" }, { status: 400 });
    }

    await withRetry(() => prisma.testScore.delete({
      where: { id: parseInt(id) },
    }));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete test score" }, { status: 500 });
  }
}
