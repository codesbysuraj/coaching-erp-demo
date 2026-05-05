import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";

// GET PARENTS
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (studentId) {
      const parents = await withRetry(() => prisma.parents.findUnique({
        where: {
          studentId: parseInt(studentId),
        },
        include: {
          student: true,
        },
      }));
      return NextResponse.json(parents);
    }

    const parents = await withRetry(() => prisma.parents.findMany({
      include: {
        student: true,
      },
    }));

    return NextResponse.json(parents);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch parents" }, { status: 500 });
  }
}

// CREATE/UPDATE PARENTS
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const parents = await withRetry(() => prisma.parents.upsert({
      where: {
        studentId: parseInt(body.studentId),
      },
      update: {
        fatherName: body.fatherName || null,
        motherName: body.motherName || null,
        occupation: body.occupation || null,
        fatherMobile: body.fatherMobile || null,
        motherMobile: body.motherMobile || null,
        fatherEmail: body.fatherEmail || null,
        motherEmail: body.motherEmail || null,
        fatherPan: body.fatherPan || null,
        motherPan: body.motherPan || null,
        fatherAadhar: body.fatherAadhar || null,
        motherAadhar: body.motherAadhar || null,
      },
      create: {
        studentId: parseInt(body.studentId),
        fatherName: body.fatherName || null,
        motherName: body.motherName || null,
        occupation: body.occupation || null,
        fatherMobile: body.fatherMobile || null,
        motherMobile: body.motherMobile || null,
        fatherEmail: body.fatherEmail || null,
        motherEmail: body.motherEmail || null,
        fatherPan: body.fatherPan || null,
        motherPan: body.motherPan || null,
        fatherAadhar: body.fatherAadhar || null,
        motherAadhar: body.motherAadhar || null,
      },
    }));

    return NextResponse.json(parents);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create/update parents" }, { status: 500 });
  }
}
