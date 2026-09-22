import { NextResponse } from "next/server";
import { getAdminFromCookies, hasCommerceAccess } from "@/lib/auth";
import { prisma, withRetry } from "@/lib/prisma";

// GET DASHBOARD STATISTICS
export async function GET() {
  const admin = await getAdminFromCookies();
  if (!hasCommerceAccess(admin)) { return NextResponse.json({ error: "Forbidden" }, { status: 403 }); }

  try {
    const totalStudents = await withRetry(() => prisma.commerceStudent.count());
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendanceToday = (await withRetry(() => prisma.commerceAttendance.findMany({
      where: {
        date: today,
      },
    }))) as Array<{ status: string }>;

    const presentCount = attendanceToday.filter((a) => a.status?.toUpperCase() === "PRESENT").length;
    const absentCount = attendanceToday.filter((a) => a.status?.toUpperCase() === "ABSENT").length;
    const lateCount = attendanceToday.filter((a) => a.status?.toUpperCase() === "LATE").length;
    const attendancePercentage = attendanceToday.length > 0 
      ? Math.round((presentCount / attendanceToday.length) * 100) 
      : 0;

    // Calculate total pending fees: Sum(student.totalFees) - Sum(fee.amountPaid)
    // Using raw SQL to bypass the Prisma client DLL lock issue on Windows for the new columns
    const sumFeesResult = (await withRetry(() => prisma.$queryRaw<Array<{ totalFeesSum: number | null }>>`
      SELECT SUM("totalFees") as "totalFeesSum" FROM "CommerceStudent" WHERE "deletedAt" IS NULL
    `)) as Array<{ totalFeesSum: number | null }>;
    const sumPaidResult = (await withRetry(() => prisma.$queryRaw<Array<{ amountPaidSum: number | null }>>`
      SELECT SUM("amountPaid") as "amountPaidSum" FROM "CommerceFees"
    `)) as Array<{ amountPaidSum: number | null }>;
    const pendingResult = (await withRetry(() => prisma.$queryRaw<Array<{ pendingSum: number | null }>>`
      SELECT SUM(remaining) as "pendingSum" FROM (
        SELECT GREATEST(0, COALESCE(s."totalFees", 0) - COALESCE(SUM(f."amountPaid"), 0)) as remaining
        FROM "CommerceStudent" s
        LEFT JOIN "CommerceFees" f ON s.id = f."studentId"
        WHERE s."deletedAt" IS NULL
        GROUP BY s.id, s."totalFees"
      ) as subquery
    `)) as Array<{ pendingSum: number | null }>;
    
    const totalAssigned = sumFeesResult[0]?.totalFeesSum ? Number(sumFeesResult[0].totalFeesSum) : 0;
    const totalCollected = sumPaidResult[0]?.amountPaidSum ? Number(sumPaidResult[0].amountPaidSum) : 0;
    const pendingFees = pendingResult[0]?.pendingSum ? Number(pendingResult[0].pendingSum) : 0;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentAdmissions = await withRetry(() => prisma.commerceStudent.findMany({
      where: {
        deletedAt: null,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }));

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const recentSevenDayAdmissions = (await withRetry(() => prisma.commerceStudent.findMany({
      where: {
        deletedAt: null,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      select: {
        createdAt: true,
      },
    }))) as Array<{ createdAt: Date }>;

    const admissionsByDate = new Map<string, number>();
    for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
      const day = new Date(sevenDaysAgo);
      day.setDate(sevenDaysAgo.getDate() + dayOffset);
      const key = day.toISOString().slice(0, 10);
      admissionsByDate.set(key, 0);
    }

    for (const student of recentSevenDayAdmissions) {
      const key = new Date(student.createdAt).toISOString().slice(0, 10);
      admissionsByDate.set(key, (admissionsByDate.get(key) || 0) + 1);
    }

    const classCounts = (await withRetry(() => prisma.$queryRaw<Array<{ standard: string | null; count: bigint | number }>>`
      SELECT standard, COUNT(*) as count
      FROM "CommerceStudent"
      WHERE "deletedAt" IS NULL AND standard IS NOT NULL
      GROUP BY standard
      ORDER BY standard ASC
    `)) as Array<{ standard: string | null; count: bigint | number }>;

    const standardDistribution = classCounts
      .filter((entry) => Boolean(entry.standard))
      .map((entry) => ({
        standard: entry.standard as string,
        count: Number(entry.count),
      }));

    return NextResponse.json({
      totalStudents,
      attendancePercentage,
      pendingFees,
      recentAdmissions,
      attendanceBreakdown: {
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        total: attendanceToday.length,
      },
      feeBreakdown: {
        assigned: Number(totalAssigned.toFixed(2)),
        collected: Number(totalCollected.toFixed(2)),
        pending: Number(pendingFees.toFixed(2)),
      },
      admissionsTrend: Array.from(admissionsByDate.entries()).map(([date, count]) => ({
        date,
        count,
      })),
      standardDistribution,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
