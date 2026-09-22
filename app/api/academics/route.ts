import { NextResponse } from "next/server";
import { getAdminFromCookies, hasSchoolAccess } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";

// GET ACADEMICS
export async function GET(req: Request) {
  const admin = await getAdminFromCookies();
  if (!hasSchoolAccess(admin)) { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (studentId) {
      const academics = await withRetry(() => prisma.academics.findUnique({
        where: {
          studentId: parseInt(studentId),
        },
        include: {
          student: true,
        },
      }));
      return NextResponse.json(academics);
    }

    const academics = await withRetry(() => prisma.academics.findMany({
      include: {
        student: true,
      },
    }));

    return NextResponse.json(academics);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch academics" }, { status: 500 });
  }
}

// CREATE/UPDATE ACADEMICS
export async function POST(req: Request) {
  const admin = await getAdminFromCookies();
  if (!hasSchoolAccess(admin)) { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  try {
    const body = await req.json();

    const academics = await withRetry(() => prisma.academics.upsert({
      where: {
        studentId: parseInt(body.studentId),
      },
      update: {
        schoolName: body.schoolName || null,
        board: body.board || null,
        std: body.std || null,
        collegeName: body.collegeName || null,
        aggregateMarks: body.aggregateMarks || null,
        aggregatePercentage: body.aggregatePercentage || null,
        mathsMarks: body.mathsMarks || null,
        scienceMarks: body.scienceMarks || null,
        previousInstitute: body.previousInstitute || null,
        examsAppeared: body.examsAppeared || null,
        examsQualified: body.examsQualified || null,
        ltsseScore: body.ltsseScore || null,
      },
      create: {
        studentId: parseInt(body.studentId),
        schoolName: body.schoolName || null,
        board: body.board || null,
        std: body.std || null,
        collegeName: body.collegeName || null,
        aggregateMarks: body.aggregateMarks || null,
        aggregatePercentage: body.aggregatePercentage || null,
        mathsMarks: body.mathsMarks || null,
        scienceMarks: body.scienceMarks || null,
        previousInstitute: body.previousInstitute || null,
        examsAppeared: body.examsAppeared || null,
        examsQualified: body.examsQualified || null,
        ltsseScore: body.ltsseScore || null,
      },
    }));

    return NextResponse.json(academics);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create/update academics" }, { status: 500 });
  }
}
