import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const demoStudents = [
  ["Aarav", "Sharma", "Male", "2008-04-12", "9000000001", "10th", "Science"],
  ["Ananya", "Patel", "Female", "2007-09-25", "9000000002", "11th", "Science"],
  ["Vihaan", "Mehta", "Male", "2009-01-18", "9000000003", "9th", "Mathematics"],
  ["Diya", "Joshi", "Female", "2008-12-03", "9000000004", "10th", "Commerce"],
  ["Arjun", "Desai", "Male", "2007-06-29", "9000000005", "12th", "Science"],
  ["Ishita", "Kulkarni", "Female", "2008-02-14", "9000000006", "10th", "Science"],
  ["Kabir", "Nair", "Male", "2009-08-07", "9000000007", "9th", "Mathematics"],
  ["Myra", "Singh", "Female", "2007-11-21", "9000000008", "11th", "Commerce"],
  ["Reyansh", "Rao", "Male", "2008-05-30", "9000000009", "10th", "Science"],
  ["Saanvi", "Iyer", "Female", "2007-03-16", "9000000010", "12th", "Science"],
] as const;

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL || "admin@brightfuture.example";
  const existingAdmin = await prisma.admin.findUnique({ where: { email } });

  if (existingAdmin) {
    await prisma.admin.update({
      where: { email },
      data: { role: "SUPER_ADMIN" },
    });
    console.log(`Admin ${email} already existed, role updated to SUPER_ADMIN.`);
  } else {
    const passwordHash = await bcrypt.hash("Admin@1234", 12);
    await prisma.admin.create({
      data: {
        name: "Admin",
        email,
        passwordHash,
        role: "SUPER_ADMIN",
      },
    });
    console.log(`Seeded admin: ${email} / Admin@1234`);
  }

  for (const [firstName, lastName, gender, dob, mobile, standard, subjects] of demoStudents) {
    const studentEmail = `demo.${mobile}@brightfuture.example`;
    const studentData = {
      firstName,
      lastName,
      gender,
      dob: new Date(dob),
      mobile,
      email: studentEmail,
      standard,
      subjects,
      course: "Regular Coaching",
      board: "CBSE",
      totalFees: 45000,
      targetExams: standard === "12th" ? "JEE / NEET" : "School Exams",
    };

    const existingStudent = await prisma.student.findFirst({
      where: { email: studentEmail },
    });

    if (existingStudent) {
      await prisma.student.update({
        where: { id: existingStudent.id },
        data: { ...studentData, deletedAt: null },
      });
      continue;
    }

    await prisma.student.create({
      data: {
        ...studentData,
        address: {
          create: {
            flatNo: `10${mobile.slice(-1)}`,
            building: "Bright Future Residency",
            street: "Academy Road",
            city: "Mumbai",
            pincode: "400001",
          },
        },
        academics: {
          create: {
            schoolName: "Bright Future Public School",
            board: "CBSE",
            std: standard,
            aggregatePercentage: "78",
          },
        },
        parents: {
          create: {
            fatherName: `${lastName} Parent`,
            motherName: `${firstName} Mother`,
            occupation: "Professional",
            fatherMobile: mobile,
          },
        },
        admission: {
          create: {
            center: "Main Center",
            stream: subjects === "Commerce" ? "Commerce" : "Science",
            subjectGroup: subjects,
            formNumber: `DEMO-${mobile.slice(-4)}`,
            admissionDate: new Date("2026-04-01"),
          },
        },
      },
    });
  }

  console.log(`Seeded ${demoStudents.length} demo students.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
