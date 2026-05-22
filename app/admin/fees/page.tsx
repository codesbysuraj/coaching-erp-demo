"use client";

import React, { useEffect, useState } from "react";
import {
  Plus, Search, IndianRupee, Download, Printer, CheckCircle2,
  AlertCircle, TrendingUp, Users, Receipt
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Loader } from "@/components/ui/Loader";
import { useToast } from "@/components/ui/Toast";

interface Student {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  mobile: string;
  standard?: string;
  totalFees?: number;
  parents?: { fatherMobile?: string; motherMobile?: string; fatherEmail?: string; motherEmail?: string };
}

interface Fee {
  id: number;
  studentId: number;
  amountPaid?: number;
  paymentDate?: string;
  paymentMode?: string;
  transactionId?: string;
  bankName?: string;
  receiptNo?: string;
  installmentNo?: number;
  student: Student;
}

const PAYMENT_MODES = ["Cash", "UPI", "NEFT", "IMPS", "Cheque", "Card"];

function generateReceiptNo() {
  return `RCP${Date.now().toString().slice(-8)}`; // Fallback, primarily handled by backend now
}

function calculateReceiptBalance(fee: Fee, feeHistory: Fee[]) {
  const totalPaidThroughReceipt = feeHistory
    .filter((entry) => entry.studentId === fee.studentId && entry.id <= fee.id)
    .reduce((sum, entry) => sum + (entry.amountPaid || 0), 0);

  return Math.max(0, (fee.student.totalFees || 0) - totalPaidThroughReceipt);
}

function printReceipt(fee: Fee, feeHistory: Fee[]) {
  const student = fee.student;
  const fullName = [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ");
  const bal = calculateReceiptBalance(fee, feeHistory);
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
          <h1>K Meson Academy</h1>
          <p>Official Payment Receipt</p>
        </div>
        <div style="text-align:right">
          <span class="receipt-badge">RECEIPT</span>
          <div class="receipt-no">No: ${fee.receiptNo || generateReceiptNo()}</div>
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
        <div class="amt">₹${(fee.amountPaid || 0).toLocaleString("en-IN")}</div>
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

export default function FeesPage() {
  const { showToast } = useToast();
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    amountPaid: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMode: "Cash",
    transactionId: "",
    bankName: "",
    chequeNo: "",
    installmentNo: "",
  });

  useEffect(() => { fetchFees(); fetchStudents(); }, []);

  const fetchFees = async () => {
    try {
      const res = await fetch("/api/fees");
      setFees(await res.json());
    } catch { showToast("Failed to fetch fees", "error"); }
    finally { setLoading(false); }
  };

  const fetchStudents = async () => {
    const res = await fetch("/api/students");
    if (res.ok) setStudents(await res.json());
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setFormData(p => ({ ...p, studentId: String(student.id) }));
    setStudentSearch(`${student.firstName} ${student.lastName} (${student.standard || "—"})`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amountPaid || Number(formData.amountPaid) <= 0) {
      showToast("Enter a valid amount", "error"); return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/fees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // The backend will generate a sequential receiptNo automatically
        body: JSON.stringify({ ...formData }),
      });
      if (!res.ok) { showToast("Failed to record payment", "error"); return; }
      const newFee = await res.json();
      showToast("Payment recorded!", "success");
      // Auto-print receipt using the server-generated receiptNo
      printReceipt({ ...newFee, student: selectedStudent! }, [...fees, { ...newFee, student: selectedStudent! }]);
      setIsModalOpen(false);
      resetForm();
      fetchFees();
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setFormData({ studentId: "", amountPaid: "", paymentDate: new Date().toISOString().split("T")[0], paymentMode: "Cash", transactionId: "", bankName: "", chequeNo: "", installmentNo: "" });
    setSelectedStudent(null);
    setStudentSearch("");
  };

  // Per-student fee summary: totalFees from Student, sum amountPaid from Fees records
  const studentBalances = students.map(s => {
    const paid = fees.filter(f => f.studentId === s.id).reduce((sum, f) => sum + (f.amountPaid || 0), 0);
    const total = s.totalFees || 0;
    return { ...s, paid, remaining: Math.max(0, total - paid) };
  }).filter(s => s.totalFees && s.totalFees > 0);

  const totalAssigned = studentBalances.reduce((s, x) => s + (x.totalFees || 0), 0);
  const totalCollected = studentBalances.reduce((s, x) => s + x.paid, 0);
  const totalPending = totalAssigned - totalCollected;

  const filteredFees = fees.filter(f =>
    `${f.student.firstName} ${f.student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (f.transactionId || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredStudents = students.filter(s =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(studentSearch.toLowerCase()) &&
    studentSearch !== `${s.firstName} ${s.lastName} (${s.standard || "—"})`
  ).slice(0, 8);

  const selectClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white";

  if (loading) return <div className="flex items-center justify-center h-full"><Loader size="lg" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fees Management</h1>
          <p className="text-gray-500 mt-1">Record payments, track balances, and issue receipts</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus size={18} className="mr-2" /> Add Payment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Assigned", value: totalAssigned, color: "blue", Icon: IndianRupee },
          { label: "Total Collected", value: totalCollected, color: "green", Icon: CheckCircle2 },
          { label: "Total Pending", value: totalPending, color: "red", Icon: AlertCircle },
        ].map(({ label, value, color, Icon }) => (
          <Card key={label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{label}</p>
                  <p className={`text-2xl font-bold text-${color}-600 mt-1`}>₹{value.toLocaleString("en-IN")}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-${color}-100 flex items-center justify-center`}>
                  <Icon size={22} className={`text-${color}-600`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Student Balance Summary */}
      {studentBalances.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users size={17} className="text-blue-600" /> Student Fee Balances
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Total Fees</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Remaining</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {studentBalances.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
                    <TableCell>{s.standard ? <Badge variant="info">{s.standard}</Badge> : "—"}</TableCell>
                    <TableCell>₹{(s.totalFees || 0).toLocaleString("en-IN")}</TableCell>
                    <TableCell className="text-green-600 font-semibold">₹{s.paid.toLocaleString("en-IN")}</TableCell>
                    <TableCell className={`font-semibold ${s.remaining > 0 ? "text-red-600" : "text-green-600"}`}>
                      ₹{s.remaining.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell>
                      {s.remaining === 0
                        ? <Badge variant="success">Fully Paid</Badge>
                        : s.paid > 0
                          ? <Badge variant="warning">Partial</Badge>
                          : <Badge variant="danger">Unpaid</Badge>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp size={17} className="text-gray-600" /> Payment History
            </CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input placeholder="Search payments..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Receipt</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Mode</TableHead>
                <TableHead>Transaction ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFees.length > 0 ? filteredFees.map(fee => (
                <TableRow key={fee.id}>
                  <TableCell className="text-xs font-mono text-gray-500">{fee.receiptNo || "—"}</TableCell>
                  <TableCell className="font-medium">
                    {fee.student.firstName} {fee.student.lastName}
                    {fee.student.standard && <span className="ml-2 text-xs text-gray-400">({fee.student.standard})</span>}
                  </TableCell>
                  <TableCell className="font-bold text-green-600">₹{(fee.amountPaid || 0).toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge variant={fee.paymentMode === "Cash" ? "default" : "info"}>{fee.paymentMode || "—"}</Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-gray-600">{fee.transactionId || "—"}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {fee.paymentDate ? new Date(fee.paymentDate).toLocaleDateString("en-IN") : "—"}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => printReceipt(fee, fees)}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      title="Print / Download Receipt"
                    >
                      <Printer size={13} /> Receipt
                    </button>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-400">No payment records found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Payment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForm(); }} title="Record Payment" size="md">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Student selector with search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student <span className="text-red-500">*</span></label>
            <div className="relative">
              <input
                type="text"
                placeholder="Type student name to search..."
                value={studentSearch}
                onChange={e => { setStudentSearch(e.target.value); setSelectedStudent(null); }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {studentSearch && !selectedStudent && filteredStudents.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {filteredStudents.map(s => (
                    <button key={s.id} type="button" onClick={() => handleStudentSelect(s)}
                      className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm border-b border-gray-50 last:border-0">
                      <span className="font-medium">{s.firstName} {s.lastName}</span>
                      <span className="text-gray-400 ml-2 text-xs">{s.standard || "No class"}</span>
                      {s.totalFees && <span className="text-gray-500 ml-2 text-xs">· Fees: ₹{s.totalFees.toLocaleString("en-IN")}</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Selected student fee summary */}
            {selectedStudent && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Fees:</span>
                  <span className="font-semibold">₹{(selectedStudent.totalFees || 0).toLocaleString("en-IN")}</span>
                </div>
                {selectedStudent.totalFees && (() => {
                  const paid = fees.filter(f => f.studentId === selectedStudent.id).reduce((s, f) => s + (f.amountPaid || 0), 0);
                  const bal = Math.max(0, selectedStudent.totalFees - paid);
                  return (
                    <>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-600">Already Paid:</span>
                        <span className="font-semibold text-green-600">₹{paid.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-gray-600">Balance Due:</span>
                        <span className={`font-bold ${bal > 0 ? "text-red-600" : "text-green-600"}`}>₹{bal.toLocaleString("en-IN")}</span>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input label="Amount Paid (₹) *" type="number" name="amountPaid" value={formData.amountPaid}
              onChange={e => setFormData(p => ({ ...p, amountPaid: e.target.value }))} required />
            <Input label="Payment Date" type="date" name="paymentDate" value={formData.paymentDate}
              onChange={e => setFormData(p => ({ ...p, paymentDate: e.target.value }))} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
            <select value={formData.paymentMode} onChange={e => setFormData(p => ({ ...p, paymentMode: e.target.value }))} className={selectClass}>
              {PAYMENT_MODES.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>

          {formData.paymentMode !== "Cash" && (
            <div className="grid grid-cols-2 gap-4">
              <Input label="Transaction ID / UPI Ref" name="transactionId" value={formData.transactionId}
                onChange={e => setFormData(p => ({ ...p, transactionId: e.target.value }))} />
              {(formData.paymentMode === "Cheque" || formData.paymentMode === "NEFT") && (
                <Input label="Bank Name" name="bankName" value={formData.bankName}
                  onChange={e => setFormData(p => ({ ...p, bankName: e.target.value }))} />
              )}
              {formData.paymentMode === "Cheque" && (
                <Input label="Cheque No" name="chequeNo" value={formData.chequeNo}
                  onChange={e => setFormData(p => ({ ...p, chequeNo: e.target.value }))} />
              )}
            </div>
          )}

          <Input label="Installment # (optional)" type="number" name="installmentNo" value={formData.installmentNo}
            onChange={e => setFormData(p => ({ ...p, installmentNo: e.target.value }))} />

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={!selectedStudent || submitting} className="flex-1">
              <Receipt size={16} className="mr-2" />
              {submitting ? "Saving..." : "Record & Print Receipt"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
