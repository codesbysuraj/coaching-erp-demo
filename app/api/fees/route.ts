import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";

type FeeRow = {
  id: number;
  studentId: number;
  amountPaid: number | null;
  paymentDate: Date | null;
  paymentMode: string | null;
  transactionId: string | null;
  bankName: string | null;
  chequeNo: string | null;
  receiptNo: string | null;
  installmentNo: number | null;
  grossFees: string | null;
  concession: string | null;
  totalPayable: string | null;
  s_id: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  mobile: string;
  standard: string | null;
  totalFees: number | null;
};

// GET ALL FEES
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    const fees = studentId
      ? await withRetry(() => prisma.$queryRaw<FeeRow[]>`
          SELECT f.id, f."studentId", f."amountPaid", f."paymentDate", f."paymentMode",
                 f."transactionId", f."bankName", f."chequeNo", f."receiptNo", f."installmentNo",
                 f."grossFees", f.concession, f."totalPayable",
                 s.id as "s_id", s."firstName", s."middleName", s."lastName",
                 s.mobile, s.standard, s."totalFees"
          FROM "Fees" f
          JOIN "Student" s ON s.id = f."studentId"
          WHERE f."studentId" = ${parseInt(studentId)}
          ORDER BY f.id DESC
        `)
      : await withRetry(() => prisma.$queryRaw<FeeRow[]>`
          SELECT f.id, f."studentId", f."amountPaid", f."paymentDate", f."paymentMode",
                 f."transactionId", f."bankName", f."chequeNo", f."receiptNo", f."installmentNo",
                 f."grossFees", f.concession, f."totalPayable",
                 s.id as "s_id", s."firstName", s."middleName", s."lastName",
                 s.mobile, s.standard, s."totalFees"
          FROM "Fees" f
          JOIN "Student" s ON s.id = f."studentId"
          ORDER BY f.id DESC
        `);

    // Reshape flat rows into nested {student: {...}} structure
    const shaped = (fees as Array<Record<string, unknown>>).map(row => ({
      id: row.id,
      studentId: row.studentId,
      amountPaid: row.amountPaid,
      paymentDate: row.paymentDate,
      paymentMode: row.paymentMode,
      transactionId: row.transactionId,
      bankName: row.bankName,
      chequeNo: row.chequeNo,
      receiptNo: row.receiptNo,
      installmentNo: row.installmentNo,
      grossFees: row.grossFees,
      concession: row.concession,
      totalPayable: row.totalPayable,
      student: {
        id: row.s_id,
        firstName: row.firstName,
        middleName: row.middleName,
        lastName: row.lastName,
        mobile: row.mobile,
        standard: row.standard,
        totalFees: row.totalFees,
      },
    }));

    return NextResponse.json(shaped);
  } catch (error) {
    console.error("[fees GET]", error);
    return NextResponse.json({ error: "Failed to fetch fees" }, { status: 500 });
  }
}

// RECORD A PAYMENT – raw SQL for new columns
export async function POST(req: Request) {
  try {
    const body = await req.json();

    let finalReceiptNo = body.receiptNo;
    if (!finalReceiptNo) {
      const yearStr = new Date().getFullYear().toString().slice(-2);
      // Get count of fees created this year to generate sequential number
      const countResult = await withRetry(() => prisma.$queryRaw<Array<{ count: bigint | number | string }>>`
        SELECT COUNT(*) as count FROM "Fees"
        WHERE EXTRACT(YEAR FROM COALESCE("paymentDate", CURRENT_DATE)) = EXTRACT(YEAR FROM CURRENT_DATE)
      `);
      const count = countResult[0]?.count ? Number(countResult[0].count) : 0;
      finalReceiptNo = `RCP-${yearStr}-${String(count + 1).padStart(4, "0")}`;
    }

    const result = await withRetry(() => prisma.$queryRaw<Array<{
      id: number;
      studentId: number;
      amountPaid: number | null;
      paymentDate: Date | null;
      paymentMode: string | null;
      transactionId: string | null;
      bankName: string | null;
      receiptNo: string | null;
      installmentNo: number | null;
    }>>`
      INSERT INTO "Fees" (
        "studentId", "amountPaid", "paymentDate", "paymentMode",
        "transactionId", "bankName", "chequeNo", "installmentNo", "receiptNo",
        "grossFees", concession, "totalPayable"
      ) VALUES (
        ${parseInt(body.studentId)},
        ${body.amountPaid ? parseFloat(body.amountPaid) : null},
        ${body.paymentDate ? new Date(body.paymentDate) : new Date()},
        ${body.paymentMode || "Cash"},
        ${body.transactionId || null},
        ${body.bankName || null},
        ${body.chequeNo || null},
        ${body.installmentNo ? parseInt(body.installmentNo) : null},
        ${finalReceiptNo},
        ${body.grossFees || null},
        ${body.concession || null},
        ${body.totalPayable || null}
      )
      RETURNING id, "studentId", "amountPaid", "paymentDate", "paymentMode",
                "transactionId", "bankName", "receiptNo", "installmentNo"
    `);

    const fee = result[0];

    // Fetch student for receipt printing
    const students = await withRetry(() => prisma.$queryRaw<Array<{
      id: number;
      firstName: string;
      middleName: string | null;
      lastName: string;
      mobile: string;
      standard: string | null;
      totalFees: number | null;
    }>>`
      SELECT id, "firstName", "middleName", "lastName", mobile, standard, "totalFees"
      FROM "Student" WHERE id = ${parseInt(body.studentId)} LIMIT 1
    `);

    return NextResponse.json({ ...fee, student: students[0] || null });
  } catch (error) {
    console.error("[fees POST]", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
