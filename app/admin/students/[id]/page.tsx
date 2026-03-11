"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Phone, Mail, MapPin, GraduationCap,
  Users, Wallet, BookOpen, ClipboardCheck, User, Award, Printer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Loader } from "@/components/ui/Loader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";

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

function printReceipt(fee: any, student: any) {
  const fullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
  const bal = (student.totalFees || 0) - (parseFloat(fee.amountPaid) || 0); // Quick estimate for balance
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
        @page { size: A5 landscape; margin: 10mm; }
      }
    </style></head>
    <body>
      <div class="header">
        <div class="logo-area">
          <h1>K Meson Academy</h1>
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
          <h4>K Meson Academy</h4>
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

const InfoRow = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex justify-between py-2.5 border-b border-gray-100 last:border-0">
    <span className="text-sm text-gray-500 font-medium">{label}</span>
    <span className="text-sm font-semibold text-gray-900 text-right max-w-[55%]">{value || "—"}</span>
  </div>
);

export default function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [student, setStudent] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="flex items-center justify-center h-full"><Loader size="lg" /></div>;
  if (!student) return null;

  const fullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
  const initials = `${student.firstName?.[0] || ""}${student.lastName?.[0] || ""}`.toUpperCase();

  const presentCount = student.attendance.filter((a) => a.status?.toUpperCase() === "PRESENT").length;
  const lateCount = student.attendance.filter((a) => a.status?.toUpperCase() === "LATE").length;
  const totalAttendance = student.attendance.length;
  const attendancePct = totalAttendance > 0 ? Math.round(((presentCount + lateCount) / totalAttendance) * 100) : 0;

  const totalPaid = student.fees.reduce((sum, f) => sum + parseFloat(f.amountPaid || "0"), 0);

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
              <img
                src={student.photoUrl}
                alt={fullName}
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
          </div>

          {/* Quick Stats */}
          <div className="flex md:flex-col gap-3">
            <div className="text-center bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
              <div className={`text-2xl font-bold ${attendancePct >= 75 ? "text-green-300" : "text-red-300"}`}>
                {attendancePct}%
              </div>
              <div className="text-blue-200 text-xs mt-0.5">Attendance</div>
            </div>
            <div className="text-center bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/20">
              <div className="text-2xl font-bold text-white">₹{totalPaid.toLocaleString("en-IN")}</div>
              <div className="text-blue-200 text-xs mt-0.5">Fees Paid</div>
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
      {student.testScores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Award size={18} className="text-yellow-500" /> Test Scores
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Test</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Date</TableHead>
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
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── FEES ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet size={18} className="text-green-600" /> Fee History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Balance Summary */}
          {student.totalFees && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: "Total Fees", value: student.totalFees, color: "blue" },
                { label: "Paid", value: totalPaid, color: "green" },
                { label: "Remaining", value: Math.max(0, student.totalFees - totalPaid), color: student.totalFees - totalPaid > 0 ? "red" : "green" },
              ].map(({ label, value, color }) => (
                <div key={label} className={`text-center p-3 rounded-xl bg-${color}-50 border border-${color}-100`}>
                  <p className={`text-lg font-bold text-${color}-600`}>₹{value.toLocaleString("en-IN")}</p>
                  <p className={`text-xs text-${color}-500 mt-0.5`}>{label}</p>
                </div>
              ))}
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
                        onClick={() => printReceipt(fee, student)}
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
