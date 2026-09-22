import { NextResponse } from "next/server";
import { getAdminFromCookies, hasCommerceAccess } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";
import { createCommerceStudentRecord, mapCsvRow, normalizeStudentCsvValue, parseCsv, type StudentPayload } from "@/lib/commerce-service";

function parseDateValue(value: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoCandidate = new Date(trimmed);
  if (!Number.isNaN(isoCandidate.getTime())) {
    return isoCandidate.toISOString().slice(0, 10);
  }

  const parts = trimmed.split(/[/-]/).map((part) => part.trim());
  if (parts.length === 3) {
    const [first, second, third] = parts;
    const dayFirst = first.length <= 2 && second.length <= 2 && third.length === 4;
    if (dayFirst) {
      const day = Number(first);
      const month = Number(second);
      const year = Number(third);
      if (Number.isFinite(day) && Number.isFinite(month) && Number.isFinite(year)) {
        const parsed = new Date(Date.UTC(year, month - 1, day));
        if (!Number.isNaN(parsed.getTime())) {
          return parsed.toISOString().slice(0, 10);
        }
      }
    }
  }

  return trimmed;
}

export async function POST(req: Request) {
  const admin = await getAdminFromCookies();
  if (!hasCommerceAccess(admin)) { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please upload a CSV file" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    const allowedTypes = ["text/csv", "application/vnd.ms-excel", "text/plain"];
    if (!allowedTypes.includes(file.type) && !fileName.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are allowed" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length < 2) {
      return NextResponse.json({ error: "CSV must contain a header row and at least one data row" }, { status: 400 });
    }

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const issues: Array<{ row: number; message: string }> = [];
    let imported = 0;

    for (let index = 0; index < dataRows.length; index += 1) {
      const row = dataRows[index];
      const mapped = mapCsvRow(headers, row);

      const payload: StudentPayload = {
        firstName: normalizeStudentCsvValue(mapped.firstName) || "",
        middleName: normalizeStudentCsvValue(mapped.middleName),
        lastName: normalizeStudentCsvValue(mapped.lastName) || "",
        gender: normalizeStudentCsvValue(mapped.gender),
        dob: parseDateValue(normalizeStudentCsvValue(mapped.dob)),
        mobile: normalizeStudentCsvValue(mapped.mobile) || "",
        email: normalizeStudentCsvValue(mapped.email),
        aadharNo: normalizeStudentCsvValue(mapped.aadharNo),
        standard: normalizeStudentCsvValue(mapped.standard),
        subjects: normalizeStudentCsvValue(mapped.subjects),
        course: normalizeStudentCsvValue(mapped.course),
        board: normalizeStudentCsvValue(mapped.board),
        photoUrl: normalizeStudentCsvValue(mapped.photoUrl),
        totalFees: normalizeStudentCsvValue(mapped.totalFees),
        targetExams: normalizeStudentCsvValue(mapped.targetExams),
        fatherName: normalizeStudentCsvValue(mapped.fatherName),
        motherName: normalizeStudentCsvValue(mapped.motherName),
        occupation: normalizeStudentCsvValue(mapped.occupation),
        fatherMobile: normalizeStudentCsvValue(mapped.fatherMobile),
        motherMobile: normalizeStudentCsvValue(mapped.motherMobile),
        fatherEmail: normalizeStudentCsvValue(mapped.fatherEmail),
        motherEmail: normalizeStudentCsvValue(mapped.motherEmail),
        fatherAadhar: normalizeStudentCsvValue(mapped.fatherAadhar),
        motherAadhar: normalizeStudentCsvValue(mapped.motherAadhar),
        street: normalizeStudentCsvValue(mapped.street),
        landmark: normalizeStudentCsvValue(mapped.landmark),
        city: normalizeStudentCsvValue(mapped.city),
        pincode: normalizeStudentCsvValue(mapped.pincode),
        schoolName: normalizeStudentCsvValue(mapped.schoolName),
        collegeName: normalizeStudentCsvValue(mapped.collegeName),
        marks8th: normalizeStudentCsvValue(mapped.marks8th),
        marks9th: normalizeStudentCsvValue(mapped.marks9th),
        marks10th: normalizeStudentCsvValue(mapped.marks10th),
        marks11th: normalizeStudentCsvValue(mapped.marks11th),
      };

      if (!payload.firstName || !payload.lastName || !payload.mobile) {
        issues.push({ row: index + 2, message: "Missing required firstName, lastName, or mobile" });
        continue;
      }

      try {
        await withRetry(() => prisma.$transaction(async (tx) => createCommerceStudentRecord(tx, payload)));
        imported += 1;
      } catch (error) {
        issues.push({
          row: index + 2,
          message: error instanceof Error ? error.message : "Failed to import row",
        });
      }
    }

    return NextResponse.json({
      imported,
      skipped: issues.length,
      issues: issues.slice(0, 20),
    });
  } catch (error) {
    console.error("[POST /api/students/import]", error);
    return NextResponse.json({ error: "Failed to import CSV" }, { status: 500 });
  }
}