import { Prisma, PrismaClient } from "@prisma/client";

export type StudentPayload = {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  gender?: string | null;
  dob?: string | null;
  mobile: string;
  email?: string | null;
  aadharNo?: string | null;
  standard?: string | null;
  subjects?: string | null;
  course?: string | null;
  board?: string | null;
  photoUrl?: string | null;
  totalFees?: number | string | null;
  targetExams?: string | null;
  fatherName?: string | null;
  motherName?: string | null;
  occupation?: string | null;
  fatherMobile?: string | null;
  motherMobile?: string | null;
  fatherEmail?: string | null;
  motherEmail?: string | null;
  fatherAadhar?: string | null;
  motherAadhar?: string | null;
  street?: string | null;
  landmark?: string | null;
  city?: string | null;
  pincode?: string | null;
  schoolName?: string | null;
  collegeName?: string | null;
  marks8th?: string | null;
  marks9th?: string | null;
  marks10th?: string | null;
  marks11th?: string | null;
};

type StudentDb = Prisma.TransactionClient | PrismaClient;

export async function createStudentRecord(db: StudentDb, body: StudentPayload) {
  const result = await db.$queryRaw<Array<{
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
  const studentId = student.id;

  await db.$executeRaw`
    INSERT INTO "Parents" (
      "studentId", "fatherName", "motherName", occupation,
      "fatherMobile", "motherMobile", "fatherEmail", "motherEmail",
      "fatherAadhar", "motherAadhar"
    ) VALUES (
      ${studentId},
      ${body.fatherName || null}, ${body.motherName || null}, ${body.occupation || null},
      ${body.fatherMobile || null}, ${body.motherMobile || null},
      ${body.fatherEmail || null}, ${body.motherEmail || null},
      ${body.fatherAadhar || null}, ${body.motherAadhar || null}
    )
  `;

  await db.$executeRaw`
    INSERT INTO "Address" ("studentId", street, landmark, city, pincode)
    VALUES (${studentId}, ${body.street || null}, ${body.landmark || null}, ${body.city || null}, ${body.pincode || null})
  `;

  await db.$executeRaw`
    INSERT INTO "Academics" (
      "studentId", "schoolName", "collegeName", board,
      "marks8th", "marks9th", "marks10th", "marks11th"
    ) VALUES (
      ${studentId},
      ${body.schoolName || null}, ${body.collegeName || null}, ${body.board || null},
      ${body.marks8th || null}, ${body.marks9th || null},
      ${body.marks10th || null}, ${body.marks11th || null}
    )
  `;

  return student;
}

export function normalizeStudentCsvValue(value: string | undefined | null) {
  const trimmed = (value || "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = "";
  let inQuotes = false;

  const pushField = () => {
    currentRow.push(currentField);
    currentField = "";
  };

  const pushRow = () => {
    if (currentRow.length > 0 || currentField.length > 0) {
      pushField();
      rows.push(currentRow);
      currentRow = [];
    }
  };

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && char === ',') {
      pushField();
      continue;
    }

    if (!inQuotes && char === '\n') {
      pushRow();
      continue;
    }

    if (!inQuotes && char === '\r') {
      continue;
    }

    currentField += char;
  }

  pushRow();
  return rows.filter((row) => row.some((cell) => cell.trim().length > 0));
}

export function mapCsvRow(headers: string[], row: string[]) {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "");

  const headerMap: Record<string, string> = {
    firstname: "firstName",
    studentfirstname: "firstName",
    studentname: "firstName",
    fname: "firstName",
    middlename: "middleName",
    studentmiddlename: "middleName",
    lastname: "lastName",
    studentlastname: "lastName",
    gender: "gender",
    dob: "dob",
    dateofbirth: "dob",
    birthdate: "dob",
    mobile: "mobile",
    mobilenumber: "mobile",
    mobileno: "mobile",
    phonenumber: "mobile",
    contactnumber: "mobile",
    contact: "mobile",
    email: "email",
    emailaddress: "email",
    mail: "email",
    aadharno: "aadharNo",
    aadharnumber: "aadharNo",
    aadharcardno: "aadharNo",
    standard: "standard",
    class: "standard",
    grade: "standard",
    subjects: "subjects",
    subject: "subjects",
    course: "course",
    board: "board",
    photourl: "photoUrl",
    photo: "photoUrl",
    imageurl: "photoUrl",
    totalfees: "totalFees",
    fees: "totalFees",
    targetexams: "targetExams",
    targetexam: "targetExams",
    targettest: "targetExams",
    fathername: "fatherName",
    fatherfullname: "fatherName",
    mothername: "motherName",
    motherfullname: "motherName",
    occupation: "occupation",
    parentoccupation: "occupation",
    fathermobile: "fatherMobile",
    fathermobileno: "fatherMobile",
    mothermobile: "motherMobile",
    mothermobileno: "motherMobile",
    fatheremail: "fatherEmail",
    fathermail: "fatherEmail",
    motheremail: "motherEmail",
    mothermail: "motherEmail",
    fatheraadhar: "fatherAadhar",
    motheraadhar: "motherAadhar",
    street: "street",
    landmark: "landmark",
    city: "city",
    district: "city",
    pincode: "pincode",
    zipcode: "pincode",
    schoolname: "schoolName",
    school: "schoolName",
    collegename: "collegeName",
    college: "collegeName",
    marks8th: "marks8th",
    marks9th: "marks9th",
    marks10th: "marks10th",
    marks11th: "marks11th",
    class8marks: "marks8th",
    class9marks: "marks9th",
    class10marks: "marks10th",
    class11marks: "marks11th",
  };

  const mapped: Record<string, string> = {};

  headers.forEach((header, index) => {
    const key = headerMap[normalize(header.replace(/^\uFEFF/, ""))];
    if (key) {
      mapped[key] = row[index] ?? "";
    }
  });

  return mapped;
}