"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Edit, Trash2, Eye, User, Users, BookOpen, Camera, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Loader } from "@/components/ui/Loader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

interface Student {
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
  targetExams?: string;
  totalFees?: number;
}

interface StudentDetails extends Student {
  address?: {
    street?: string;
    landmark?: string;
    city?: string;
    pincode?: string;
  };
  academics?: {
    schoolName?: string;
    collegeName?: string;
    marks8th?: string;
    marks9th?: string;
    marks10th?: string;
    marks11th?: string;
  };
  parents?: {
    fatherName?: string;
    motherName?: string;
    occupation?: string;
    fatherMobile?: string;
    motherMobile?: string;
    fatherEmail?: string;
    motherEmail?: string;
    fatherAadhar?: string;
    motherAadhar?: string;
  };
}

const STANDARDS = [
  "9th",
  "9th & 10th",
  "10th",
  "11th",
  "11th & 12th",
  "12th",
];
const SUBJECTS_SCIENCE = ["Physics", "Chemistry", "Mathematics", "IT", "CS", "Biology"];
const SUBJECTS_COMMERCE = ["Accountancy", "Economics", "Business Studies", "Mathematics", "IT", "SP", "English"];
const COURSES = ["Science", "Commerce", "Arts"];
const BOARDS = ["CBSE", "SSC", "ICSE"];
const EXAMS_SCIENCE = ["CET", "JEE", "NEET"];
const EXAMS_COMMERCE = ["CA Foundation", "CS Executive", "CMA", "Banking", "CUET"];

const emptyForm = {
  firstName: "", middleName: "", lastName: "",
  gender: "", dob: "", mobile: "", email: "", aadharNo: "",
  standard: "", subjects: [] as string[], course: "", board: "",
  targetExams: [] as string[],
  photoUrl: "",
  fatherName: "", motherName: "", occupation: "",
  fatherMobile: "", motherMobile: "",
  fatherEmail: "", motherEmail: "",
  fatherAadhar: "", motherAadhar: "",
  street: "", landmark: "", city: "", pincode: "",
  schoolName: "", collegeName: "",
  // Previous class marks/percentage
  marks8th: "", marks9th: "", marks10th: "", marks11th: "",
  // Fees
  totalFees: "",
};

type FormTab = "student" | "parents" | "academic";

export default function StudentsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStandard, setFilterStandard] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<FormTab>("student");
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const res = await fetch("/api/students", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) {
        setStudents(data);
      } else {
        setStudents([]);
      }
    } catch {
      showToast("Failed to fetch students", "error");
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubjectToggle = (subject: string) => {
    setFormData((prev) => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject],
    }));
  };

  const handleExamToggle = (exam: string) => {
    setFormData((prev) => ({
      ...prev,
      targetExams: prev.targetExams.includes(exam)
        ? prev.targetExams.filter((e) => e !== exam)
        : [...prev.targetExams, exam],
    }));
  };

  const HIGHER_STANDARDS = ["11th", "11th & 12th", "12th"];

  const handleStandardChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const std = e.target.value;
    const isHigher = HIGHER_STANDARDS.includes(std);
    setFormData((prev) => ({
      ...prev, standard: std,
      subjects: isHigher ? prev.subjects : [],
      course: isHigher ? prev.course : "",
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const tempPayload = {
        ...formData,
        subjects: formData.subjects.length > 0 ? formData.subjects.join(",") : null,
        course: formData.course || null,
        board: formData.board || null,
        photoUrl: formData.photoUrl || null,
        totalFees: formData.totalFees ? parseFloat(formData.totalFees) : null,
        targetExams: formData.targetExams.length > 0 ? formData.targetExams.join(",") : null,
      };

      const url = editingStudent ? `/api/students/${editingStudent.id}` : "/api/students";
      const method = editingStudent ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tempPayload),
      });

      if (!res.ok) { showToast("Failed to save student", "error"); return; }

      fetchStudents();
      setIsModalOpen(false);
      resetForm();
      showToast(editingStudent ? "Student updated!" : "Student added successfully!", "success");
    } catch {
      showToast("Failed to save student", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = async (student: Student) => {
    setEditingStudent(student);
    setActiveTab("student");
    setIsModalOpen(true);

    try {
      const res = await fetch(`/api/students/${student.id}`, { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load student details");

      const details: StudentDetails = await res.json();
      setFormData({
        ...emptyForm,
        firstName: details.firstName,
        middleName: details.middleName || "",
        lastName: details.lastName,
        gender: details.gender || "",
        dob: details.dob ? new Date(details.dob).toISOString().split("T")[0] : "",
        mobile: details.mobile,
        email: details.email || "",
        aadharNo: details.aadharNo || "",
        standard: details.standard || "",
        subjects: details.subjects ? details.subjects.split(",") : [],
        course: details.course || "",
        board: details.board || "",
        photoUrl: details.photoUrl || "",
        targetExams: details.targetExams ? details.targetExams.split(",") : [],
        totalFees: details.totalFees != null ? String(details.totalFees) : "",
        fatherName: details.parents?.fatherName || "",
        motherName: details.parents?.motherName || "",
        occupation: details.parents?.occupation || "",
        fatherMobile: details.parents?.fatherMobile || "",
        motherMobile: details.parents?.motherMobile || "",
        fatherEmail: details.parents?.fatherEmail || "",
        motherEmail: details.parents?.motherEmail || "",
        fatherAadhar: details.parents?.fatherAadhar || "",
        motherAadhar: details.parents?.motherAadhar || "",
        street: details.address?.street || "",
        landmark: details.address?.landmark || "",
        city: details.address?.city || "",
        pincode: details.address?.pincode || "",
        schoolName: details.academics?.schoolName || "",
        collegeName: details.academics?.collegeName || "",
        marks8th: details.academics?.marks8th || "",
        marks9th: details.academics?.marks9th || "",
        marks10th: details.academics?.marks10th || "",
        marks11th: details.academics?.marks11th || "",
      });
    } catch {
      showToast("Failed to load student details for edit", "error");
      setIsModalOpen(false);
      setEditingStudent(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) { fetchStudents(); showToast("Student moved to recycle bin!", "success"); }
      else showToast("Failed to delete student", "error");
    } catch { showToast("Failed to delete student", "error"); }
    finally { setDeleting(false); setDeleteTarget(null); }
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditingStudent(null);
    setActiveTab("student");
  };

  const HIGHER_STDS = ["11th", "11th & 12th", "12th"];
  const isHigherStandard = HIGHER_STDS.includes(formData.standard);
  const isLowerStandard = ["9th", "9th & 10th", "10th"].includes(formData.standard);

  const filteredStudents = (Array.isArray(students) ? students : []).filter((s) => {
    const matchesSearch =
      s.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.mobile?.includes(searchTerm);
    return matchesSearch && (!filterStandard || s.standard === filterStandard);
  });

  if (loading) return <div className="flex items-center justify-center h-full"><Loader size="lg" /></div>;

  const selectClass = "w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const tabBtn = (tab: FormTab, icon: React.ReactNode, label: string) => (
    <button type="button" onClick={() => setActiveTab(tab)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex-1 justify-center ${activeTab === tab ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-100"
        }`}>
      {icon} {label}
    </button>
  );

  const getInitials = (s: Student) =>
    `${s.firstName?.[0] || ""}${s.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
          <p className="text-gray-500 mt-1">Add, edit, and manage student records</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus size={20} className="mr-2" /> Add Student
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>All Students ({filteredStudents.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select value={filterStandard} onChange={(e) => setFilterStandard(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white">
                <option value="">All Classes</option>
                {STANDARDS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <Input type="text" placeholder="Search students..." value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Board</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                <TableRow key={student.id} className="hover:bg-gray-50 cursor-pointer">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {student.photoUrl ? (
                        <img src={student.photoUrl} alt={student.firstName}
                          className="w-9 h-9 rounded-full object-cover border-2 border-gray-200" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white shadow-sm">
                          {getInitials(student)}
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {student.firstName} {student.middleName} {student.lastName}
                        </p>
                        <p className="text-xs text-gray-400">#{student.id}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{student.standard ? <Badge variant="info">{student.standard}</Badge> : "-"}</TableCell>
                  <TableCell>{student.board ? <Badge variant="default">{student.board}</Badge> : "-"}</TableCell>
                  <TableCell>{student.course ? <Badge variant="warning">{student.course}</Badge> : "-"}</TableCell>
                  <TableCell className="text-gray-600">{student.mobile}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" onClick={() => router.push(`/admin/students/${student.id}`)} title="View"><Eye size={16} /></Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEdit(student)} title="Edit"><Edit size={16} /></Button>
                      <Button size="sm" variant="danger" onClick={() => setDeleteTarget(student)} title="Delete"><Trash2 size={16} /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                        <User size={24} className="text-gray-400" />
                      </div>
                      <p className="text-gray-400 font-medium">No students found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title={editingStudent ? "Edit Student" : "Add New Student"}
        size="lg"
      >
        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-gray-100 rounded-xl">
          {tabBtn("student", <User size={15} />, "Student")}
          {tabBtn("parents", <Users size={15} />, "Parents")}
          {tabBtn("academic", <BookOpen size={15} />, "School & Address")}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* TAB 1: STUDENT */}
          {activeTab === "student" && (
            <>
              {/* Photo URL */}
              <div className="pb-4 mb-4 border-b border-gray-100">
                <Input
                  label="Photo URL"
                  name="photoUrl"
                  value={formData.photoUrl}
                  onChange={handleInputChange}
                  placeholder="https://res.cloudinary.com/..."
                />
                {formData.photoUrl && (
                  <div className="mt-3 flex gap-4 items-center">
                    <p className="text-sm font-medium text-gray-700">Preview:</p>
                    <img src={formData.photoUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-gray-200" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="First Name *" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                <Input label="Middle Name" name="middleName" value={formData.middleName} onChange={handleInputChange} />
                <Input label="Last Name *" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                <div>
                  <label className={labelClass}>Gender</label>
                  <select name="gender" value={formData.gender} onChange={handleInputChange} className={selectClass}>
                    <option value="">Select Gender</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
                <Input label="Date of Birth" type="date" name="dob" value={formData.dob} onChange={handleInputChange} />
                <Input label="Mobile *" name="mobile" value={formData.mobile} onChange={handleInputChange} required />
                <Input label="Email" type="email" name="email" value={formData.email} onChange={handleInputChange} />
                <Input label="Aadhar Number" name="aadharNo" value={formData.aadharNo} onChange={handleInputChange} />
                <div>
                  <label className={labelClass}>Class / Standard</label>
                  <select name="standard" value={formData.standard} onChange={handleStandardChange} className={selectClass}>
                    <option value="">Select Class</option>
                    {STANDARDS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                {formData.standard && (
                  <div>
                    <label className={labelClass}>Board</label>
                    <select name="board" value={formData.board} onChange={handleInputChange} className={selectClass}>
                      <option value="">Select Board</option>
                      {isHigherStandard 
                        ? ["CBSE", "HSC", "ICSE"].map((b) => <option key={b} value={b}>{b}</option>)
                        : BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                )}
                {isHigherStandard && (
                  <div>
                    <label className={labelClass}>Course</label>
                    <select name="course" value={formData.course} onChange={handleInputChange} className={selectClass}>
                      <option value="">Select Course</option>
                      {COURSES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                )}
              </div>
              {/* Target Exams */}
              {isHigherStandard && formData.course && (formData.course === "Science" || formData.course === "Commerce") && (
                <div>
                  <label className={labelClass}>Target Exams</label>
                  <div className="flex flex-wrap gap-2">
                    {(formData.course === "Science" ? EXAMS_SCIENCE : EXAMS_COMMERCE).map((exam) => (
                      <label key={exam} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm font-medium ${formData.targetExams.includes(exam) ? "bg-amber-50 border-amber-400 text-amber-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}>
                        <input type="checkbox" checked={formData.targetExams.includes(exam)}
                          onChange={() => handleExamToggle(exam)} className="accent-amber-600" />
                        {exam}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {isHigherStandard && formData.course && (formData.course === "Science" || formData.course === "Commerce") && (
                <div>
                  <label className={labelClass}>Subjects</label>
                  <div className="flex flex-wrap gap-2">
                    {(formData.course === "Science" ? SUBJECTS_SCIENCE : SUBJECTS_COMMERCE).map((subject) => (
                      <label key={subject} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all text-sm font-medium ${formData.subjects.includes(subject) ? "bg-blue-50 border-blue-400 text-blue-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                        }`}>
                        <input type="checkbox" checked={formData.subjects.includes(subject)}
                          onChange={() => handleSubjectToggle(subject)} className="accent-blue-600" />
                        {subject}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {/* Previous Qualification Section */}
              {formData.standard && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                  <h3 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
                    Previous Class Marks / Percentage
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 9th std / 9th & 10th → needs 8th marks */}
                    {(formData.standard === "9th" || formData.standard === "9th & 10th") && (
                      <Input
                        label="8th Class Marks / %"
                        name="marks8th"
                        placeholder="e.g. 85% or 420/500"
                        value={formData.marks8th}
                        onChange={handleInputChange}
                      />
                    )}
                    {/* 10th std → needs 9th marks */}
                    {formData.standard === "10th" && (
                      <Input
                        label="9th Class Marks / %"
                        name="marks9th"
                        placeholder="e.g. 78% or 390/500"
                        value={formData.marks9th}
                        onChange={handleInputChange}
                      />
                    )}
                    {/* 11th / 12th / 11th & 12th → needs 10th marks */}
                    {(formData.standard === "11th" || formData.standard === "12th" || formData.standard === "11th & 12th") && (
                      <Input
                        label="10th (SSC/Board) Marks / %"
                        name="marks10th"
                        placeholder="e.g. 92% or 460/500"
                        value={formData.marks10th}
                        onChange={handleInputChange}
                      />
                    )}
                    {/* 12th std → also needs 11th marks */}
                    {formData.standard === "12th" && (
                      <Input
                        label="11th Class Marks / %"
                        name="marks11th"
                        placeholder="e.g. 88% or 440/500"
                        value={formData.marks11th}
                        onChange={handleInputChange}
                      />
                    )}
                  </div>
                </div>
              )}
              <div className="flex justify-between pt-4">
                <Button type="button" variant="secondary" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancel</Button>
                <Button type="button" onClick={() => setActiveTab("parents")}>Next: Parents →</Button>
              </div>
            </>
          )}

          {/* TAB 2: PARENTS */}
          {activeTab === "parents" && (
            <>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <h3 className="text-sm font-semibold text-blue-800 mb-3">Father&apos;s Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input label="Father's Name" name="fatherName" value={formData.fatherName} onChange={handleInputChange} />
                    <Input label="Father's Mobile" name="fatherMobile" value={formData.fatherMobile} onChange={handleInputChange} />
                    <Input label="Father's Email" type="email" name="fatherEmail" value={formData.fatherEmail} onChange={handleInputChange} />
                    <Input label="Father's Aadhar" name="fatherAadhar" value={formData.fatherAadhar} onChange={handleInputChange} />
                  </div>
                </div>
                <div className="p-4 bg-pink-50 rounded-xl border border-pink-100">
                  <h3 className="text-sm font-semibold text-pink-800 mb-3">Mother&apos;s Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input label="Mother's Name" name="motherName" value={formData.motherName} onChange={handleInputChange} />
                    <Input label="Mother's Mobile" name="motherMobile" value={formData.motherMobile} onChange={handleInputChange} />
                    <Input label="Mother's Email" type="email" name="motherEmail" value={formData.motherEmail} onChange={handleInputChange} />
                    <Input label="Mother's Aadhar" name="motherAadhar" value={formData.motherAadhar} onChange={handleInputChange} />
                  </div>
                </div>
                <Input label="Parent Occupation" name="occupation" value={formData.occupation} onChange={handleInputChange} />
              </div>
              <div className="flex justify-between pt-4">
                <Button type="button" variant="secondary" onClick={() => setActiveTab("student")}>← Back</Button>
                <Button type="button" onClick={() => setActiveTab("academic")}>Next: School & Address →</Button>
              </div>
            </>
          )}

          {/* TAB 3: SCHOOL & ADDRESS */}
          {activeTab === "academic" && (
            <>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <h3 className="text-sm font-semibold text-green-800 mb-3">School / College</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(!formData.standard || isLowerStandard || !isHigherStandard) && (
                      <Input label="School Name" name="schoolName" value={formData.schoolName} onChange={handleInputChange} />
                    )}
                    {(!formData.standard || isHigherStandard || !isLowerStandard) && (
                      <Input label="College / Previous Institute" name="collegeName" value={formData.collegeName} onChange={handleInputChange} />
                    )}
                  </div>
                </div>
                {/* Total Fees */}
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h3 className="text-sm font-semibold text-blue-800 mb-3">Fee Assignment</h3>
                  <Input
                    label="Total Fees for this Student (₹)"
                    type="number"
                    placeholder="e.g. 25000"
                    value={formData.totalFees}
                    onChange={(e) => setFormData(prev => ({ ...prev, totalFees: e.target.value }))}
                  />
                  <p className="text-xs text-blue-600 mt-1.5">This total will be used to calculate the remaining balance in Fee payments.</p>
                </div>
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                  <h3 className="text-sm font-semibold text-yellow-800 mb-3">Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Input label="Street / Area" name="street" value={formData.street} onChange={handleInputChange} />
                    <Input label="Landmark" name="landmark" value={formData.landmark} onChange={handleInputChange} />
                    <Input label="City" name="city" value={formData.city} onChange={handleInputChange} />
                    <Input label="Pincode" name="pincode" value={formData.pincode} onChange={handleInputChange} />
                  </div>
                </div>
              </div>
              <div className="flex justify-between pt-4">
                <Button type="button" variant="secondary" onClick={() => setActiveTab("parents")}>← Back</Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : editingStudent ? "✓ Update Student" : "✓ Add Student"}
                </Button>
              </div>
            </>
          )}
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Student"
        message={`Move ${deleteTarget?.firstName} ${deleteTarget?.lastName} to recycle bin? You can restore them later.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  );
}
