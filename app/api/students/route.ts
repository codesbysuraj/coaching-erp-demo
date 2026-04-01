import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET ALL STUDENTS – raw SQL for new totalFees column
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const standard = searchParams.get("standard");

    const students = standard
      ? await prisma.$queryRaw`
          SELECT id, "firstName", "middleName", "lastName", gender, dob, mobile, email,
                 "aadharNo", standard, subjects, course, board, "photoUrl", "totalFees", "targetExams", "createdAt"
          FROM "Student"
          WHERE "deletedAt" IS NULL AND standard = ${standard}
          ORDER BY id DESC
        `
      : await prisma.$queryRaw`
          SELECT id, "firstName", "middleName", "lastName", gender, dob, mobile, email,
                 "aadharNo", standard, subjects, course, board, "photoUrl", "totalFees", "targetExams", "createdAt"
          FROM "Student"
          WHERE "deletedAt" IS NULL
          ORDER BY id DESC
        `;

    return NextResponse.json(students);
  } catch (error) {
    console.error("[GET /api/students]", error);
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

// CREATE STUDENT – fully raw SQL to bypass stale Prisma client
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Insert student
    const result = await prisma.$queryRaw<Array<{
      id: number;
      firstName: string;
      lastName: string;
      standard: string | null;
      totalFees: number | null;
      targetExams: string | null;
    }>>`
      INSERT INTO "Student" (
        "firstName", "middleName", "lastName", gender, dob, mobile, email,
        "aadharNo", standard, subjects, course, board, "photoUrl", "totalFees", "targetExams", "createdAt"
      ) VALUES (
        ${body.firstName},
        ${body.middleName || null},
        ${body.lastName},
        ${body.gender || null},
        ${body.dob ? new Date(body.dob) : null},
        ${body.mobile},
        ${body.email || null},
        ${body.aadharNo || null},
        ${body.standard || null},
        ${body.subjects || null},
        ${body.course || null},
        ${body.board || null},
        ${body.photoUrl || null},
        ${body.totalFees ? parseFloat(String(body.totalFees)) : null},
        ${body.targetExams || null},
        NOW()
      )
      RETURNING id, "firstName", "lastName", standard, "totalFees", "targetExams"
    `;

    const student = result[0];
    const sid = student.id;

    // Insert parents
    await prisma.$executeRaw`
      INSERT INTO "Parents" (
        "studentId", "fatherName", "motherName", occupation,
        "fatherMobile", "motherMobile", "fatherEmail", "motherEmail",
        "fatherAadhar", "motherAadhar"
      ) VALUES (
        ${sid},
        ${body.fatherName || null}, ${body.motherName || null}, ${body.occupation || null},
        ${body.fatherMobile || null}, ${body.motherMobile || null},
        ${body.fatherEmail || null}, ${body.motherEmail || null},
        ${body.fatherAadhar || null}, ${body.motherAadhar || null}
      )
    `;

    // Insert address
    await prisma.$executeRaw`
      INSERT INTO "Address" ("studentId", street, landmark, city, pincode)
      VALUES (${sid}, ${body.street || null}, ${body.landmark || null}, ${body.city || null}, ${body.pincode || null})
    `;

    // Insert academics (includes new marks columns)
    await prisma.$executeRaw`
      INSERT INTO "Academics" (
        "studentId", "schoolName", "collegeName", board,
        "marks8th", "marks9th", "marks10th", "marks11th"
      ) VALUES (
        ${sid},
        ${body.schoolName || null}, ${body.collegeName || null}, ${body.board || null},
        ${body.marks8th || null}, ${body.marks9th || null},
        ${body.marks10th || null}, ${body.marks11th || null}
      )
    `;

    return NextResponse.json(student);
  } catch (error) {
    console.error("[POST /api/students]", error);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
