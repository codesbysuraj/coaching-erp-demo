"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Phone, Mail, MapPin, GraduationCap,
  Users, Wallet, BookOpen, ClipboardCheck, User, Award, Printer, Download, Pencil, Trash2, Save, X
} from "lucide-react";
import html2pdf from "html2pdf.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader } from "@/components/ui/Loader";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";

interface StudentDetails {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: string;
  dob?: string;
  mobile: string;
  email?: string;
  aadharNo?: string;
  standard?: string;
  subjects?: string;
  course?: string;
  board?: string;
  photoUrl?: string;
  totalFees?: number;
  targetExams?: string;
  createdAt: string;
  address?: {
    street?: string; landmark?: string; city?: string;
    pincode?: string; railwayStation?: string; telNo?: string;
  };
  academics?: {
    schoolName?: string; collegeName?: string; board?: string;
    aggregatePercentage?: string; mathsMarks?: string; scienceMarks?: string;
    marks8th?: string; marks9th?: string; marks10th?: string; marks11th?: string;
  };
  parents?: {
    fatherName?: string; motherName?: string; occupation?: string;
    fatherMobile?: string; motherMobile?: string;
    fatherEmail?: string; motherEmail?: string;
  };
  fees: Array<{
    id: number; grossFees?: string; concession?: string;
    totalPayable?: string; installmentNo?: number;
    amountPaid?: string; paymentDate?: string; transactionId?: string;
    paymentMode?: string; bankName?: string; receiptNo?: string;
  }>;
  attendance: Array<{
    id: number; date: string; status: string; subject?: string;
  }>;
  testScores: Array<{
    id: number; subject: string; testName: string;
    maxMarks: number; obtainedMarks: number; date: string;
  }>;
}

function printReceipt(fee: any, student: any, feeHistory: Array<{ id: number; studentId?: number; amountPaid?: string | number }>) {
  const fullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
  const totalPaidThroughReceipt = feeHistory
    .filter((entry) => entry.studentId === student.id && entry.id <= fee.id)
    .reduce((sum, entry) => sum + (parseFloat(String(entry.amountPaid || 0)) || 0), 0);
  const bal = Math.max(0, (student.totalFees || 0) - totalPaidThroughReceipt);
  const html = `
    <!DOCTYPE html><html><head><title>Payment Receipt</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; font-family: Arial, sans-serif; }
      body { padding: 24px; color: #1a1a1a; max-width: 800px; margin: 0 auto; height: 100vh; display: flex; flex-direction: column; }
      .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid #1d4ed8; padding-bottom:12px; margin-bottom:16px; }
      .logo-area h1 { font-size: 20px; font-weight:800; color:#1d4ed8; }
      .logo-area p { font-size:11px; color:#6b7280; margin-top:2px; }
      .receipt-badge { background:#1d4ed8; color:#fff; padding:4px 12px; border-radius:6px; font-size:11px; font-weight:700; }
      .receipt-no { font-size:11px; color:#6b7280; text-align:right; margin-top:4px; }
      .section-title { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.05em; color:#6b7280; margin-bottom:6px; }
      .grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
      .info-col p { font-size:12px; margin-bottom:4px; }
      .label { color:#6b7280; margin-right:6px; }
      .value { font-weight:600; }
      .amount-box { background:#f0fdf4; border:2px solid #16a34a; border-radius:10px; padding:12px; margin:16px 0; text-align:center; }
      .amount-box .amt { font-size:28px; font-weight:800; color:#16a34a; line-height:1; }
      .amount-box .lbl { font-size:11px; color:#6b7280; margin-top:4px; }
      .balance-row { display:flex; justify-content:space-between; background:#fef9c3; border-radius:8px; padding:10px 14px; font-size:12px; margin-bottom:16px; }
      .balance-row .label { font-weight:600; }
      .balance-row .val { font-weight:800; color:#b45309; }
      .footer { border-top:1px solid #e5e7eb; padding-top:12px; margin-top:auto; display:flex; justify-content:space-between; align-items:flex-end; }
      .stamp { border:2px dashed #16a34a; color:#16a34a; padding:6px 16px; border-radius:8px; font-weight:800; font-size:12px; }
      .sign-area { text-align:center; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; }
      .sign-area h4 { font-size: 14px; color: #1a1a1a; margin-bottom: 4px; font-family: "Brush Script MT", cursive; font-style: italic; }
      .sign-area .line { border-top:1px solid #9ca3af; width:120px; }
      .sign-area p { font-size:10px; color:#6b7280; margin-top:4px; font-weight: bold; }
      @media print { 
        body { padding:0; width: 100%; max-width: 100%; height: auto; }
        .footer { margin-top: 32px; }
        @page { size: A5 portrait; margin: 10mm; }
      }
    </style></head>
    <body>
      <div class="header">
        <div class="logo-area">
          <h1>Bright Future Academy</h1>
          <p>Official Payment Receipt</p>
        </div>
        <div style="text-align:right">
          <span class="receipt-badge">RECEIPT</span>
          <div class="receipt-no">No: ${fee.receiptNo || `RCP${Date.now().toString().slice(-8)}`}</div>
          <div class="receipt-no">Date: ${fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString("en-IN", { dateStyle: "long" }) : new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</div>
        </div>
      </div>

      <div class="grid">
        <div class="info-col">
          <div class="section-title">Student Details</div>
          <p><span class="label">Name:</span><span class="value">${fullName}</span></p>
          <p><span class="label">Class:</span><span class="value">${student.standard || "—"}</span></p>
          <p><span class="label">Mobile:</span><span class="value">${student.mobile}</span></p>
        </div>
        <div class="info-col">
          <div class="section-title">Payment Details</div>
          <p><span class="label">Mode:</span><span class="value">${fee.paymentMode || "—"}</span></p>
          <p><span class="label">Transaction ID:</span><span class="value">${fee.transactionId || "—"}</span></p>
          <p><span class="label">Bank:</span><span class="value">${fee.bankName || "—"}</span></p>
          ${fee.installmentNo ? `<p><span class="label">Installment:</span><span class="value">#${fee.installmentNo}</span></p>` : ""}
        </div>
      </div>

      <div class="amount-box">
        <div class="amt">₹${parseFloat(fee.amountPaid || "0").toLocaleString("en-IN")}</div>
        <div class="lbl">Amount Received</div>
      </div>

      <div class="balance-row">
        <div>
          <span class="label">Total Fees Assigned:</span>
          <span>₹${(student.totalFees || 0).toLocaleString("en-IN")}</span>
        </div>
        <div>
          <span class="label">Balance Due:</span>
          <span class="val">₹${Math.max(0, bal).toLocaleString("en-IN")}</span>
        </div>
      </div>

      <div class="footer">
        <div class="stamp">✓ PAYMENT RECEIVED</div>
        <div class="sign-area">
          <h4>Bright Future Academy</h4>
          <div class="line"></div>
          <p>Authorised Signatory</p>
        </div>
      </div>
    </body></html>
  `;
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    setTimeout(() => win.print(), 400);
  }
}

function formatCurrency(value?: number | string | null) {
  const amount = typeof value === "number" ? value : parseFloat(String(value || 0));
  return `₹${(Number.isFinite(amount) ? amount : 0).toLocaleString("en-IN")}`;
}

function createReportData(student: StudentDetails) {
  const fullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
  const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase();
  const presentCount = student.attendance.filter((a) => a.status?.toUpperCase() === "PRESENT").length;
  const lateCount = student.attendance.filter((a) => a.status?.toUpperCase() === "LATE").length;
  const absentCount = Math.max(0, student.attendance.length - presentCount - lateCount);
  const totalAttendance = student.attendance.length;
  const attendancePct = totalAttendance > 0 ? Math.round(((presentCount + lateCount) / totalAttendance) * 100) : 0;
  const totalPaid = student.fees.reduce((sum, fee) => sum + parseFloat(fee.amountPaid || "0"), 0);
  const remainingFees = Math.max(0, (student.totalFees || 0) - totalPaid);
  const subjectList = student.subjects ? student.subjects.split(",").map((subject) => subject.trim()).filter(Boolean) : [];
  const examList = student.targetExams ? student.targetExams.split(",").map((exam) => exam.trim()).filter(Boolean) : [];

  return {
    fullName,
    initials,
    presentCount,
    lateCount,
    absentCount,
    totalAttendance,
    attendancePct,
    totalPaid,
    remainingFees,
    subjectList,
    examList,
  };
}

function renderStudentReport(student: StudentDetails) {
  const data = createReportData(student);
  const reportDate = new Date().toLocaleDateString("en-IN", { dateStyle: "long" });
  const latestAttendance = [...student.attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestTestScores = [...student.testScores].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestFees = [...student.fees].sort((a, b) => {
    const aTime = a.paymentDate ? new Date(a.paymentDate).getTime() : 0;
    const bTime = b.paymentDate ? new Date(b.paymentDate).getTime() : 0;
    return bTime - aTime;
  });

  return `
    <div class="report-page">
      <style>
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #0f172a; background: #f8fafc; }
        .report-page { width: 100%; background: #fff; }
        .report-shell { max-width: 1100px; margin: 0 auto; background: #fff; }
        .hero { padding: 28px; background: linear-gradient(135deg, #0f172a 0%, #1d4ed8 55%, #2563eb 100%); color: #fff; display: flex; justify-content: space-between; gap: 20px; flex-wrap: wrap; }
        .identity { display: flex; gap: 18px; align-items: center; }
        .avatar { width: 92px; height: 92px; border-radius: 22px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; font-size: 34px; font-weight: 800; }
        .hero h1 { margin: 0; font-size: 30px; line-height: 1.1; }
        .meta { margin-top: 10px; color: rgba(255,255,255,0.86); font-size: 14px; display: flex; flex-wrap: wrap; gap: 14px; }
        .hero-note { text-align: right; font-size: 12px; color: rgba(255,255,255,0.82); }
        .content { padding: 26px; }
        .summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; margin-bottom: 22px; }
        .stat { border: 1px solid #e2e8f0; border-radius: 16px; padding: 16px; background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); }
        .stat .label { color: #64748b; font-size: 12px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.06em; }
        .stat .value { font-size: 22px; font-weight: 800; color: #0f172a; }
        .section { border: 1px solid #e2e8f0; border-radius: 18px; margin-bottom: 18px; overflow: hidden; }
        .section h2 { margin: 0; padding: 16px 20px; font-size: 15px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
        .section-body { padding: 18px 20px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 18px; }
        .info { display: flex; justify-content: space-between; gap: 12px; padding-bottom: 10px; border-bottom: 1px dashed #e2e8f0; }
        .info:last-child { border-bottom: 0; padding-bottom: 0; }
        .info span:first-child { color: #64748b; font-size: 13px; }
        .info span:last-child { font-weight: 700; text-align: right; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip { border-radius: 999px; padding: 7px 12px; font-size: 12px; font-weight: 700; background: #eff6ff; color: #1d4ed8; }
        .chip.soft { background: #f8fafc; color: #334155; }
        .table-wrap { overflow: hidden; border-radius: 14px; border: 1px solid #e2e8f0; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; text-align: left; vertical-align: top; font-size: 12px; }
        th { background: #f8fafc; color: #334155; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em; }
        tr:last-child td { border-bottom: 0; }
        .badge { display: inline-block; padding: 4px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; background: #e2e8f0; color: #0f172a; }
        .badge.success { background: #dcfce7; color: #166534; }
        .badge.warning { background: #fef3c7; color: #92400e; }
        .badge.danger { background: #fee2e2; color: #991b1b; }
        .badge.info { background: #dbeafe; color: #1d4ed8; }
        .footer { padding: 16px 26px 26px; color: #64748b; font-size: 12px; }
        .page-break { page-break-before: always; }
        @media print { body { background: #fff; } .report-shell { box-shadow: none; } .section, .stat, .table-wrap { break-inside: avoid; } @page { size: A4 portrait; margin: 12mm; } }
        @media (max-width: 900px) { .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .info-grid { grid-template-columns: 1fr; } .hero { align-items: flex-start; } .hero-note { text-align: left; } }
        @media (max-width: 640px) { .content { padding: 18px; } .hero { padding: 20px; } .summary-grid { grid-template-columns: 1fr; } .identity { align-items: flex-start; } .hero h1 { font-size: 24px; } }
      </style>

      <div class="report-shell">
        <div class="hero">
          <div class="identity">
            <div class="avatar">${data.initials || "S"}</div>
            <div>
              <h1>${data.fullName}</h1>
              <div class="meta">
                <span>Student ID #${student.id}</span>
                <span>Class ${student.standard || "—"}</span>
                <span>Generated ${reportDate}</span>
              </div>
            </div>
          </div>
          <div class="hero-note">
            <div><strong>Bright Future Academy</strong></div>
            <div>Official Student Report</div>
          </div>
        </div>

        <div class="content">
          <div class="summary-grid">
            <div class="stat"><div class="label">Remaining</div><div class="value">${formatCurrency(data.remainingFees)}</div></div>
            <div class="stat"><div class="label">Attendance</div><div class="value">${data.attendancePct}%</div></div>
          </div>

          <div class="section">
            <h2>Student Details</h2>
            <div class="section-body">
              <div class="info-grid">
                <div class="info"><span>Full Name</span><span>${data.fullName}</span></div>
                <div class="info"><span>Mobile</span><span>${student.mobile || "—"}</span></div>
                <div class="info"><span>Email</span><span>${student.email || "—"}</span></div>
                <div class="info"><span>Date of Birth</span><span>${student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : "—"}</span></div>
                <div class="info"><span>Gender</span><span>${student.gender || "—"}</span></div>
                <div class="info"><span>Aadhar No</span><span>${student.aadharNo || "—"}</span></div>
                <div class="info"><span>Course</span><span>${student.course || "—"}</span></div>
                <div class="info"><span>Board</span><span>${student.board || "—"}</span></div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Academic Information</h2>
            <div class="section-body">
              <div class="info-grid">
                <div class="info"><span>School / Institute</span><span>${student.academics?.schoolName || student.academics?.collegeName || "—"}</span></div>
                <div class="info"><span>Board</span><span>${student.academics?.board || student.board || "—"}</span></div>
                <div class="info"><span>Aggregate %</span><span>${student.academics?.aggregatePercentage || "—"}</span></div>
                <div class="info"><span>Target Exams</span><span>${data.examList.length > 0 ? data.examList.join(", ") : "—"}</span></div>
              </div>
              <div style="margin-top: 14px;">
                <div style="color:#64748b; font-size:13px; margin-bottom:8px;">Subjects</div>
                <div class="chips">
                  ${data.subjectList.length > 0 ? data.subjectList.map((subject) => `<span class="chip">${subject}</span>`).join("") : `<span class="chip soft">No subjects listed</span>`}
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>Parent Details</h2>
            <div class="section-body">
              ${student.parents ? `
                <div class="info-grid">
                  <div class="info"><span>Father's Name</span><span>${student.parents.fatherName || "—"}</span></div>
                  <div class="info"><span>Father's Mobile</span><span>${student.parents.fatherMobile || "—"}</span></div>
                  <div class="info"><span>Mother's Name</span><span>${student.parents.motherName || "—"}</span></div>
                  <div class="info"><span>Mother's Mobile</span><span>${student.parents.motherMobile || "—"}</span></div>
                  <div class="info"><span>Occupation</span><span>${student.parents.occupation || "—"}</span></div>
                </div>
              ` : `<div style="color:#64748b;">No parent details added.</div>`}
            </div>
          </div>

          <div class="section">
            <h2>Address</h2>
            <div class="section-body">
              ${student.address ? `
                <div class="info-grid">
                  <div class="info"><span>Street</span><span>${student.address.street || "—"}</span></div>
                  <div class="info"><span>Landmark</span><span>${student.address.landmark || "—"}</span></div>
                  <div class="info"><span>City</span><span>${student.address.city || "—"}</span></div>
                  <div class="info"><span>Pincode</span><span>${student.address.pincode || "—"}</span></div>
                </div>
              ` : `<div style="color:#64748b;">No address details added.</div>`}
            </div>
          </div>

          <div class="section">
            <h2>Performance Snapshot</h2>
            <div class="section-body">
              <div class="info-grid">
                <div class="info"><span>Attendance Records</span><span>${data.totalAttendance}</span></div>
                <div class="info"><span>Present / Late / Absent</span><span>${data.presentCount} / ${data.lateCount} / ${data.absentCount}</span></div>
                <div class="info"><span>Test Scores</span><span>${student.testScores.length}</span></div>
              </div>
            </div>
          </div>

          <div class="section">
            <h2>All Test Scores</h2>
            <div class="section-body">
              ${student.testScores.length > 0 ? `
                <div class="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Test</th>
                        <th>Subject</th>
                        <th>Score</th>
                        <th>Percentage</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${latestTestScores.map((score) => {
                        const pct = score.maxMarks > 0 ? Math.round((score.obtainedMarks / score.maxMarks) * 100) : 0;
                        const badgeClass = pct >= 75 ? "success" : pct >= 50 ? "warning" : "danger";
                        return `<tr>
                          <td>${new Date(score.date).toLocaleDateString("en-IN")}</td>
                          <td>${score.testName}</td>
                          <td>${score.subject}</td>
                          <td>${score.obtainedMarks}/${score.maxMarks}</td>
                          <td><span class="badge ${badgeClass}">${pct}%</span></td>
                        </tr>`;
                      }).join("")}
                    </tbody>
                  </table>
                </div>
              ` : `<div style="color:#64748b;">No test score records yet.</div>`}
            </div>
          </div>



          <div class="section">
            <h2>Recent Activity</h2>
            <div class="section-body">
              <div class="info-grid">
                <div class="info"><span>Latest Test Score</span><span>${latestTestScores[0] ? `${latestTestScores[0].testName} (${latestTestScores[0].obtainedMarks}/${latestTestScores[0].maxMarks})` : "—"}</span></div>
                <div class="info"><span>Report Balance</span><span>${formatCurrency(data.remainingFees)}</span></div>
              </div>
            </div>
          </div>
        </div>

        <div class="footer">Generated by Bright Future Academy student record system.</div>
      </div>
    </div>
  `;
}
function openStudentReport(student: StudentDetails, autoPrint = true) {
  const reportRoot = document.createElement("div");
  reportRoot.innerHTML = renderStudentReport(student);
  const styles = reportRoot.querySelector("style")?.outerHTML || "";
  const content = reportRoot.innerHTML;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument;
  const win = iframe.contentWindow;
  if (!doc || !win) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(`<!DOCTYPE html><html><head><title>${student.firstName} ${student.lastName} - Report</title>${styles}</head><body>${content}</body></html>`);
  doc.close();

  const cleanup = () => {
    iframe.remove();
  };

  if (autoPrint) {
    const triggerPrint = () => {
      win.focus();
      win.print();
      setTimeout(cleanup, 1000);
    };
    if (doc.readyState === "complete") {
      setTimeout(triggerPrint, 250);
    } else {
      iframe.onload = () => setTimeout(triggerPrint, 250);
    }
  } else {
    setTimeout(cleanup, 2000);
  }
}

async function downloadStudentReport(student: StudentDetails) {
  const reportRoot = document.createElement("div");
  reportRoot.innerHTML = renderStudentReport(student);
  const reportElement = reportRoot.firstElementChild as HTMLElement | null;
  if (!reportElement) return;

  document.body.appendChild(reportElement);

  const fullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
  const fileName = `${fullName.replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_\-]/g, "") || "student"}_report.pdf`;

  try {
    const options = {
      margin: 10,
      filename: fileName,
      image: { type: "jpeg" as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
      jsPDF: { unit: "mm" as const, format: "a4" as const, orientation: "portrait" as const },
      pagebreak: { mode: ["css", "legacy"] },
    };

    await html2pdf().set(options).from(reportElement).save();
  } finally {
    reportElement.remove();
  }
}

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex justify-between py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500 font-medium">{label}</span>
    <span className="text-sm font-semibold text-gray-900 text-right max-w-[55%]">{value || "—"}</span>
  </div>
);

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);

  // Test score editing state
  const [editingTestScore, setEditingTestScore] = useState<number | null>(null);
  const [isTestEditModalOpen, setIsTestEditModalOpen] = useState(false);
  const [deleteConfirmTestId, setDeleteConfirmTestId] = useState<number | null>(null);
  const [editTestForm, setEditTestForm] = useState({
    subject: "",
    testName: "",
    maxMarks: "",
    obtainedMarks: "",
    date: "",
  });

  const ALL_SUBJECTS = [
    "English", "Hindi", "Marathi", "Science 1", "Science 2",
    "History", "Civics", "Geography", "SST", "Maths 1", "Maths 2",
    "Physics", "Chemistry", "Mathematics", "Biology", "CS", "IT",
  ];

  const reloadStudent = async () => {
    const { id } = await params;
    try {
      const res = await fetch(`/api/students/${id}`);
      if (res.ok) setStudent(await res.json());
    } catch {}
  };

  useEffect(() => {
    const load = async () => {
      const { id } = await params;
      try {
        const res = await fetch(`/api/students/${id}`);
        if (!res.ok) throw new Error("Not found");
        setStudent(await res.json());
      } catch {
        router.push("/admin/students");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params, router]);

  const handleEditTestScore = (ts: { id: number; subject: string; testName: string; maxMarks: number; obtainedMarks: number; date: string }) => {
    setEditingTestScore(ts.id);
    setEditTestForm({
      subject: ts.subject,
      testName: ts.testName,
      maxMarks: ts.maxMarks.toString(),
      obtainedMarks: ts.obtainedMarks.toString(),
      date: new Date(ts.date).toISOString().split("T")[0],
    });
    setIsTestEditModalOpen(true);
  };

  const handleUpdateTestScore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestScore) return;

    if (parseFloat(editTestForm.obtainedMarks) > parseFloat(editTestForm.maxMarks)) {
      showToast("Obtained marks cannot exceed max marks", "warning");
      return;
    }

    try {
      const response = await fetch("/api/test-scores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTestScore,
          ...editTestForm,
        }),
      });

      if (response.ok) {
        await reloadStudent();
        setIsTestEditModalOpen(false);
        setEditingTestScore(null);
        showToast("Test score updated successfully!", "success");
      } else {
        showToast("Failed to update test score", "error");
      }
    } catch {
      showToast("Failed to update test score", "error");
    }
  };

  const handleDeleteTestScore = async (id: number) => {
    try {
      const response = await fetch(`/api/test-scores?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        await reloadStudent();
        setDeleteConfirmTestId(null);
        showToast("Test score deleted successfully!", "success");
      } else {
        showToast("Failed to delete test score", "error");
      }
    } catch {
      showToast("Failed to delete test score", "error");
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><Loader size="lg" /></div>;
  if (!student) return null;

  const fullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
  const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase();

  const presentCount = student.attendance.filter((a) => a.status?.toUpperCase() === "PRESENT").length;
  const lateCount = student.attendance.filter((a) => a.status?.toUpperCase() === "LATE").length;
  const totalAttendance = student.attendance.length;
  const attendancePct = totalAttendance > 0 ? Math.round(((presentCount + lateCount) / totalAttendance) * 100) : 0;

  const totalPaid = student.fees.reduce((sum, f) => sum + parseFloat(f.amountPaid || "0"), 0);
  const totalFees = student.totalFees || 0;
  const remainingFees = Math.max(0, totalFees - totalPaid);

  const subjectList = student.subjects ? student.subjects.split(",") : [];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-2">
        <ArrowLeft size={18} className="mr-2" /> Back
      </Button>

      {/* ── HERO PROFILE CARD ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-xl">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white transform translate-x-20 -translate-y-20" />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-white transform -translate-x-16 translate-y-16" />
        </div>

        <div className="relative p-6 md:p-8 flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            {student.photoUrl ? (
              <Image
                src={student.photoUrl}
                alt={fullName}
                width={128}
                height={128}
                loading="lazy"
                decoding="async"
                fetchPriority="low"
                quality={45}
                sizes="(max-width: 768px) 112px, 128px"
                className="w-28 h-28 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-white/30 shadow-2xl"
              />
            ) : (
              <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-white/20 backdrop-blur-sm border-4 border-white/30 flex items-center justify-center shadow-2xl">
                <span className="text-4xl md:text-5xl font-bold text-white">{initials}</span>
              </div>
            )}
          </div>

          {/* Main Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-2 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold text-white">{fullName}</h1>
              <span className="text-blue-200 text-sm">• #{student.id}</span>
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-4">
              {student.standard && (
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-sm">
                  Class {student.standard}
                </span>
              )}
              {student.board && (
                <span className="px-3 py-1 rounded-full bg-white/20 text-white text-sm font-medium backdrop-blur-sm">
                  {student.board}
                </span>
              )}
              {student.course && (
                <span className="px-3 py-1 rounded-full bg-yellow-400/90 text-yellow-900 text-sm font-bold">
                  {student.course}
                </span>
              )}
              {student.targetExams && student.targetExams.split(",").map((exam) => (
                <span key={exam} className="px-3 py-1 rounded-full bg-orange-400/90 text-orange-950 text-sm font-bold">
                  {exam.trim()}
                </span>
              ))}
              {student.gender && (
                <span className="px-3 py-1 rounded-full bg-white/10 text-blue-100 text-sm">
                  {student.gender}
                </span>
              )}
            </div>

            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-blue-100 text-sm">
              <span className="flex items-center gap-1.5"><Phone size={14} /> {student.mobile}</span>
              {student.email && <span className="flex items-center gap-1.5"><Mail size={14} /> {student.email}</span>}
              {student.address?.city && <span className="flex items-center gap-1.5"><MapPin size={14} /> {student.address.city}</span>}
            </div>

            <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-2">
              <Button
                variant="secondary"
                onClick={() => openStudentReport(student, true)}
                className="bg-white text-blue-700 hover:bg-blue-50"
              >
                <Printer size={16} className="mr-2" /> Print Report
              </Button>
              <Button
                variant="secondary"
                onClick={() => downloadStudentReport(student)}
                className="bg-white/15 text-white border border-white/20 hover:bg-white/20"
              >
                <Download size={16} className="mr-2" /> Download Report
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex md:flex-col gap-3">
            <div className="text-center bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
              <div className="text-2xl font-bold text-white">
                ₹{totalFees.toLocaleString("en-IN")}
              </div>
              <div className="text-blue-200 text-xs mt-0.5">Total Fees</div>
            </div>
            <div className="text-center bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
              <div className={`text-2xl font-bold ${remainingFees > 0 ? "text-amber-200" : "text-green-300"}`}>
                ₹{remainingFees.toLocaleString("en-IN")}
              </div>
              <div className="text-blue-200 text-xs mt-0.5">Remaining Fees</div>
            </div>
          </div>
        </div>

        {/* Subject chips */}
        {subjectList.length > 0 && (
          <div className="relative px-6 md:px-8 pb-5 flex flex-wrap gap-2">
            <span className="text-blue-200 text-xs mr-1 self-center">Subjects:</span>
            {subjectList.map((s) => (
              <span key={s} className="px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-medium border border-white/20">
                {s.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── INFO GRID ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User size={18} className="text-blue-600" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Full Name" value={fullName} />
            <InfoRow label="Date of Birth" value={student.dob ? new Date(student.dob).toLocaleDateString("en-IN") : null} />
            <InfoRow label="Gender" value={student.gender} />
            <InfoRow label="Aadhar No" value={student.aadharNo} />
            <InfoRow label="Joined" value={new Date(student.createdAt).toLocaleDateString("en-IN")} />
          </CardContent>
        </Card>

        {/* Parents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users size={18} className="text-purple-600" /> Parent Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {student.parents ? (
              <>
                <InfoRow label="Father's Name" value={student.parents.fatherName} />
                <InfoRow label="Father's Mobile" value={student.parents.fatherMobile} />
                <InfoRow label="Mother's Name" value={student.parents.motherName} />
                <InfoRow label="Mother's Mobile" value={student.parents.motherMobile} />
                <InfoRow label="Occupation" value={student.parents.occupation} />
              </>
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">No parent details added</p>
            )}
          </CardContent>
        </Card>

        {/* Address */}
        {student.address && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin size={18} className="text-red-500" /> Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Street" value={student.address.street} />
              <InfoRow label="Landmark" value={student.address.landmark} />
              <InfoRow label="City" value={student.address.city} />
              <InfoRow label="Pincode" value={student.address.pincode} />
            </CardContent>
          </Card>
        )}

        {/* Academics */}
        {student.academics && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <GraduationCap size={18} className="text-green-600" /> School / Academic
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="School Name" value={student.academics.schoolName} />
              <InfoRow label="College / Institute" value={student.academics.collegeName} />
              <InfoRow label="Board" value={student.academics.board || student.board} />
              <InfoRow label="Aggregate %" value={student.academics.aggregatePercentage} />
              {/* Previous class marks — shown based on standard */}
              {student.academics.marks8th && (
                <InfoRow label="8th Class Marks / %" value={student.academics.marks8th} />
              )}
              {student.academics.marks9th && (
                <InfoRow label="9th Class Marks / %" value={student.academics.marks9th} />
              )}
              {student.academics.marks10th && (
                <InfoRow label="10th (SSC/Board) Marks / %" value={student.academics.marks10th} />
              )}
              {student.academics.marks11th && (
                <InfoRow label="11th Class Marks / %" value={student.academics.marks11th} />
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── ATTENDANCE ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck size={18} className="text-blue-600" /> Attendance Summary
            </CardTitle>
            <div className="flex gap-3 text-xs font-medium">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />{presentCount} Present</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" />{lateCount} Late</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />{totalAttendance - presentCount - lateCount} Absent</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {student.attendance.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.attendance.slice(0, 10).map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">{new Date(a.date).toLocaleDateString("en-IN")}</TableCell>
                    <TableCell className="text-sm text-gray-500">{a.subject || "General"}</TableCell>
                    <TableCell>
                      <Badge variant={a.status?.toUpperCase() === "PRESENT" ? "success" : a.status?.toUpperCase() === "LATE" ? "warning" : "danger"}>
                        {a.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">No attendance records yet</p>
          )}
        </CardContent>
      </Card>

      {/* ── TEST SCORES ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award size={18} className="text-yellow-500" /> Test Scores
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {student.testScores.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.testScores.map((ts) => {
                  const pct = Math.round((ts.obtainedMarks / ts.maxMarks) * 100);
                  return (
                    <TableRow key={ts.id}>
                      <TableCell className="font-medium text-sm">{ts.testName}</TableCell>
                      <TableCell><Badge variant="info">{ts.subject}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{ts.obtainedMarks}/{ts.maxMarks}</span>
                          <Badge variant={pct >= 75 ? "success" : pct >= 50 ? "warning" : "danger"}>{pct}%</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{new Date(ts.date).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditTestScore(ts)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit score"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmTestId(ts.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete score"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-400 text-sm text-center py-6">No test score records yet</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Test Score Modal */}
      <Modal
        isOpen={isTestEditModalOpen}
        onClose={() => { setIsTestEditModalOpen(false); setEditingTestScore(null); }}
        title="Edit Test Score"
        size="md"
      >
        <form onSubmit={handleUpdateTestScore} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                value={editTestForm.subject}
                onChange={(e) => setEditTestForm({ ...editTestForm, subject: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Subject</option>
                {ALL_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
            <Input
              label="Test Name"
              value={editTestForm.testName}
              onChange={(e) => setEditTestForm({ ...editTestForm, testName: e.target.value })}
              required
              placeholder="e.g. Unit Test 1, Mid Term"
            />
            <Input
              label="Max Marks"
              type="number"
              value={editTestForm.maxMarks}
              onChange={(e) => setEditTestForm({ ...editTestForm, maxMarks: e.target.value })}
              required
              placeholder="e.g. 100"
            />
            <Input
              label="Obtained Marks"
              type="number"
              value={editTestForm.obtainedMarks}
              onChange={(e) => setEditTestForm({ ...editTestForm, obtainedMarks: e.target.value })}
              required
              placeholder="e.g. 85"
            />
            <Input
              label="Date"
              type="date"
              value={editTestForm.date}
              onChange={(e) => setEditTestForm({ ...editTestForm, date: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setIsTestEditModalOpen(false); setEditingTestScore(null); }}
            >
              Cancel
            </Button>
            <Button type="submit">Update Test Score</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Test Score Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmTestId !== null}
        onClose={() => setDeleteConfirmTestId(null)}
        title="Delete Test Score"
        size="sm"
      >
        <p className="text-gray-600 mb-6">Are you sure you want to delete this test score? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirmTestId(null)}>Cancel</Button>
          <Button
            onClick={() => deleteConfirmTestId && handleDeleteTestScore(deleteConfirmTestId)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </Button>
        </div>
      </Modal>

      {/* ── FEES ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet size={18} className="text-green-600" /> Fee History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Balance Summary */}
          {student.totalFees != null && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="text-center p-3 rounded-xl bg-blue-50 border border-blue-100">
                <p className="text-lg font-bold text-blue-600">₹{(student.totalFees || 0).toLocaleString("en-IN")}</p>
                <p className="text-xs text-blue-500 mt-0.5">Total Fees</p>
              </div>

              <div className="text-center p-3 rounded-xl bg-green-50 border border-green-100">
                <p className="text-lg font-bold text-green-600">₹{totalPaid.toLocaleString("en-IN")}</p>
                <p className="text-xs text-green-500 mt-0.5">Paid</p>
              </div>

              <div className={`text-center p-3 rounded-xl ${student.totalFees - totalPaid > 0 ? "bg-red-50 border-red-100" : "bg-green-50 border-green-100"}`}>
                <p className={`${student.totalFees - totalPaid > 0 ? "text-red-600" : "text-green-600"} text-lg font-bold`}>₹{Math.max(0, student.totalFees - totalPaid).toLocaleString("en-IN")}</p>
                <p className={`${student.totalFees - totalPaid > 0 ? "text-red-500" : "text-green-500"} text-xs mt-0.5`}>Remaining</p>
              </div>
            </div>
          )}
          {student.fees.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Installment</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Mode</TableHead>
                  <TableHead>Transaction</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Receipt</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.fees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="text-sm font-medium">#{fee.installmentNo || 1}</TableCell>
                    <TableCell>
                      <span className="text-sm font-semibold text-green-600">₹{(fee.amountPaid || 0).toLocaleString("en-IN")}</span>
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">{(fee as unknown as Record<string, string>).paymentMode || "—"}</TableCell>
                    <TableCell className="text-xs font-mono text-gray-500">{fee.transactionId || "—"}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString("en-IN") : "—"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => printReceipt(fee, student, student.fees)}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
                      >
                        <Printer size={12} /> Print
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No fee payments recorded yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
