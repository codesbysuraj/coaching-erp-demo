import { NextResponse } from "next/server";
import { prisma, withRetry } from "@/lib/prisma";

// GET ALL DELETED STUDENTS (Recycle Bin)
export async function GET() {
  try {
    const deletedStudents = await withRetry(() => prisma.student.findMany({
      where: {
        deletedAt: { not: null },
      },
      orderBy: { deletedAt: "desc" },
    }));

    return NextResponse.json(deletedStudents);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch deleted students" }, { status: 500 });
  }
}

// RESTORE A STUDENT
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { studentId } = body;

    const student = await withRetry(() => prisma.student.update({
      where: { id: parseInt(studentId) },
      data: { deletedAt: null },
    }));

    return NextResponse.json(student);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to restore student" }, { status: 500 });
  }
}

// HARD DELETE (Permanent)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({ error: "Student ID required" }, { status: 400 });
    }

    await withRetry(() => prisma.student.delete({
      where: { id: parseInt(studentId) },
    }));

    return NextResponse.json({ message: "Student permanently deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to permanently delete student" }, { status: 500 });
  }
}
