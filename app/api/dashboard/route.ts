import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET DASHBOARD STATISTICS
export async function GET() {
  try {
    const totalStudents = await prisma.student.count();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendanceToday = await prisma.attendance.findMany({
      where: {
        date: today,
      },
    });
    
    const presentCount = attendanceToday.filter(a => a.status === "Present").length;
    const attendancePercentage = attendanceToday.length > 0 
      ? Math.round((presentCount / attendanceToday.length) * 100) 
      : 0;

    // Calculate total pending fees: Sum(student.totalFees) - Sum(fee.amountPaid)
    // Using raw SQL to bypass the Prisma client DLL lock issue on Windows for the new columns
    const sumFeesResult: any = await prisma.$queryRaw`
      SELECT SUM("totalFees") as "totalFeesSum" FROM "Student" WHERE "deletedAt" IS NULL
    `;
    const sumPaidResult: any = await prisma.$queryRaw`
      SELECT SUM("amountPaid") as "amountPaidSum" FROM "Fees"
    `;
    const totalAssigned = sumFeesResult[0]?.totalFeesSum ? Number(sumFeesResult[0].totalFeesSum) : 0;
    const totalCollected = sumPaidResult[0]?.amountPaidSum ? Number(sumPaidResult[0].amountPaidSum) : 0;
    const pendingFees = Math.max(0, totalAssigned - totalCollected);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAdmissions = await prisma.student.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    return NextResponse.json({
      totalStudents,
      attendancePercentage,
      pendingFees,
      recentAdmissions,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
