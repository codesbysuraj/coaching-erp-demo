import { NextResponse } from "next/server";
import { getAdminFromCookies, hasCommerceAccess } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";

// GET SINGLE STUDENT – uses raw SQL for new columns (totalFees) to bypass stale Prisma client
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookies();
  if (!hasCommerceAccess(admin)) { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  try {
    const { id } = await params;
    const studentId = parseInt(id);

    // Fetch student with all new columns via raw SQL
    const students = await withRetry(() => prisma.$queryRaw<Array<{
      id: number;
      firstName: string;
      middleName: string | null;
      lastName: string;
      gender: string | null;
      dob: Date | null;
      mobile: string;
      email: string | null;
      aadharNo: string | null;
      standard: string | null;
      subjects: string | null;
      course: string | null;
      board: string | null;
      photoUrl: string | null;
      totalFees: number | null;
      targetExams: string | null;
      createdAt: Date;
      deletedAt: Date | null;
    }>>`
      SELECT id, "firstName", "middleName", "lastName", gender, dob, mobile, email,
             "aadharNo", standard, subjects, course, board, "photoUrl",
             "totalFees", "targetExams", "createdAt", "deletedAt"
      FROM "CommerceStudent"
      WHERE id = ${studentId}
      LIMIT 1
    `);

    if (!students || students.length === 0) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const student = students[0];

    // Fetch related data via Prisma (these tables haven't changed)
    const [address, academics, parents, fees, attendance, testScores] = await Promise.all([
      withRetry(() => prisma.address.findUnique({ where: { studentId } })),
      withRetry(() => prisma.commerceAcademics.findUnique({ where: { studentId } })),
      withRetry(() => prisma.commerceParents.findUnique({ where: { studentId } })),
      withRetry(() => prisma.$queryRaw`
        SELECT id, "studentId", "amountPaid", "paymentDate", "paymentMode",
               "transactionId", "bankName", "chequeNo", "receiptNo", "installmentNo",
               "grossFees", concession, "totalPayable"
        FROM "CommerceFees"
        WHERE "studentId" = ${studentId}
        ORDER BY id DESC
      `),
      withRetry(() => prisma.commerceAttendance.findMany({ where: { studentId }, orderBy: { date: "desc" } })),
      withRetry(() => prisma.commerceTestScore.findMany({ where: { studentId }, orderBy: { date: "desc" } })),
    ]);

    return NextResponse.json({
      ...student,
      address: address || null,
      academics: academics || null,
      parents: parents || null,
      fees: fees || [],
      attendance: attendance || [],
      testScores: testScores || [],
    });
  } catch (error) {
    console.error("[GET /api/students/id]", error);
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  }
}

// UPDATE STUDENT
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookies();
  if (!hasCommerceAccess(admin)) { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  try {
    const { id } = await params;
    const body = await req.json();

    // Update student core fields including new totalFees
    await withRetry(() => prisma.$executeRaw`
      UPDATE "CommerceStudent"
      SET
        "firstName" = ${body.firstName},
        "middleName" = ${body.middleName || null},
        "lastName" = ${body.lastName},
        gender = ${body.gender || null},
        dob = ${body.dob ? new Date(body.dob) : null},
        mobile = ${body.mobile},
        email = ${body.email || null},
        "aadharNo" = ${body.aadharNo || null},
        standard = ${body.standard || null},
        subjects = ${body.subjects || null},
        course = ${body.course || null},
        board = ${body.board || null},
        "photoUrl" = ${body.photoUrl || null},
        "totalFees" = ${body.totalFees ? parseFloat(String(body.totalFees)) : null},
        "targetExams" = ${body.targetExams || null}
      WHERE id = ${parseInt(id)}
    `);

    // Upsert parents
    const existingParents = await withRetry(() => prisma.commerceParents.findUnique({ where: { studentId: parseInt(id) } }));
    const parentsData = {
      fatherName: body.fatherName || null,
      motherName: body.motherName || null,
      occupation: body.occupation || null,
      fatherMobile: body.fatherMobile || null,
      motherMobile: body.motherMobile || null,
      fatherEmail: body.fatherEmail || null,
      motherEmail: body.motherEmail || null,
      fatherAadhar: body.fatherAadhar || null,
      motherAadhar: body.motherAadhar || null,
    };
    if (existingParents) {
      await withRetry(() => prisma.commerceParents.update({ where: { studentId: parseInt(id) }, data: parentsData }));
    } else {
      await withRetry(() => prisma.commerceParents.create({ data: { studentId: parseInt(id), ...parentsData } }));
    }

    // Upsert address
    const existingAddr = await withRetry(() => prisma.address.findUnique({ where: { studentId: parseInt(id) } }));
    const addrData = {
      street: body.street || null, landmark: body.landmark || null,
      city: body.city || null, pincode: body.pincode || null,
    };
    if (existingAddr) {
      await withRetry(() => prisma.address.update({ where: { studentId: parseInt(id) }, data: addrData }));
    } else {
      await withRetry(() => prisma.address.create({ data: { studentId: parseInt(id), ...addrData } }));
    }

    // Upsert academics
    const existingAcad = await withRetry(() => prisma.commerceAcademics.findUnique({ where: { studentId: parseInt(id) } }));
    const acadData = {
      schoolName: body.schoolName || null,
      collegeName: body.collegeName || null,
      board: body.board || null,
      marks8th: body.marks8th || null,
      marks9th: body.marks9th || null,
      marks10th: body.marks10th || null,
      marks11th: body.marks11th || null,
    };
    if (existingAcad) {
      await withRetry(() => prisma.commerceAcademics.update({ where: { studentId: parseInt(id) }, data: acadData }));
    } else {
      await withRetry(() => prisma.commerceAcademics.create({ data: { studentId: parseInt(id), ...acadData } }));
    }

    return NextResponse.json({ id: parseInt(id), ...body });
  } catch (error) {
    console.error("[PUT /api/students/id]", error);
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

// SOFT DELETE STUDENT
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getAdminFromCookies();
  if (!hasCommerceAccess(admin)) { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  try {
    const { id } = await params;
    await withRetry(() => prisma.$executeRaw`
      UPDATE "CommerceStudent" SET "deletedAt" = NOW() WHERE id = ${parseInt(id)}
    `);
    return NextResponse.json({ message: "Student moved to recycle bin" });
  } catch (error) {
    console.error("[DELETE /api/students/id]", error);
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
