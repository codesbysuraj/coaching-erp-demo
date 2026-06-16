"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search } from "lucide-react";
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
  lastName: string;
  standard?: string;
  subjects?: string;
}

interface TestScore {
  id: number;
  studentId: number;
  subject: string;
  testName: string;
  maxMarks: number;
  obtainedMarks: number;
  date: string;
  student: Student;
}

const ALL_SUBJECTS = ["Physics", "Chemistry", "Mathematics", "IT", "CS", "Biology"];

export default function TestScoresPage() {
  const { showToast } = useToast();
  const [testScores, setTestScores] = useState<TestScore[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [formData, setFormData] = useState({
    studentId: "",
    subject: "",
    testName: "",
    maxMarks: "",
    obtainedMarks: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchTestScores();
    fetchStudents();
  }, []);

  const fetchTestScores = async () => {
    try {
      const response = await fetch("/api/test-scores");
      const data = await response.json();
      setTestScores(data);
    } catch (error) {
      showToast("Failed to fetch test scores", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students");
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      console.error("Failed to fetch students:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleStudentSelect = (student: Student) => {
    setFormData({ ...formData, studentId: student.id.toString() });
    setStudentSearchTerm(`${student.firstName} ${student.lastName}${student.standard ? ` (${student.standard})` : ""}`);
    setIsStudentDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.studentId) {
      showToast("Please select a student", "warning");
      return;
    }

    if (parseFloat(formData.obtainedMarks) > parseFloat(formData.maxMarks)) {
      showToast("Obtained marks cannot exceed max marks", "warning");
      return;
    }

    try {
      const response = await fetch("/api/test-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchTestScores();
        setIsModalOpen(false);
        resetForm();
        showToast("Test score added successfully!", "success");
      } else {
        showToast("Failed to add test score", "error");
      }
    } catch (error) {
      showToast("Failed to add test score", "error");
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: "",
      subject: "",
      testName: "",
      maxMarks: "",
      obtainedMarks: "",
      date: new Date().toISOString().split("T")[0],
    });
    setStudentSearchTerm("");
    setIsStudentDropdownOpen(false);
  };

  const filteredStudents = students.filter((student) => {
    const query = studentSearchTerm.trim().toLowerCase();
    if (!query) return true;

    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const standard = (student.standard || "").toLowerCase();
    const studentId = student.id.toString();

    return fullName.includes(query) || standard.includes(query) || studentId.includes(query);
  });

  const filteredScores = testScores.filter((score) => {
    const matchesSearch =
      score.student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      score.student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      score.testName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = !filterSubject || score.subject === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const getPercentageColor = (pct: number) => {
    if (pct >= 80) return "text-emerald-600";
    if (pct >= 60) return "text-blue-600";
    if (pct >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const getPercentageBadge = (pct: number) => {
    if (pct >= 80) return "success";
    if (pct >= 60) return "info";
    if (pct >= 40) return "warning";
    return "danger";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Test Scores</h1>
          <p className="text-gray-500 mt-1">Track and manage student test results</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
          <Plus size={20} className="mr-2" />
          Add Test Score
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500">Total Tests Recorded</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-2">{testScores.length}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500">Average Score</p>
            <h3 className={`text-2xl font-bold mt-2 ${getPercentageColor(
              testScores.length > 0
                ? testScores.reduce((sum, s) => sum + (s.obtainedMarks / s.maxMarks) * 100, 0) / testScores.length
                : 0
            )}`}>
              {testScores.length > 0
                ? (testScores.reduce((sum, s) => sum + (s.obtainedMarks / s.maxMarks) * 100, 0) / testScores.length).toFixed(1)
                : "0"}%
            </h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500">Students Tested</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-2">
              {new Set(testScores.map((s) => s.studentId)).size}
            </h3>
          </CardContent>
        </Card>
      </div>

      {/* Test Scores Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>All Test Results ({filteredScores.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <select
                value={filterSubject}
                onChange={(e) => setFilterSubject(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Subjects</option>
                {ALL_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <Input
                  type="text"
                  placeholder="Search by name or test..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
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
                <TableHead>Subject</TableHead>
                <TableHead>Test Name</TableHead>
                <TableHead>Marks</TableHead>
                <TableHead>Percentage</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredScores.length > 0 ? (
                filteredScores.map((score) => {
                  const pct = (score.obtainedMarks / score.maxMarks) * 100;
                  return (
                    <TableRow key={score.id}>
                      <TableCell className="font-medium">
                        {score.student.firstName} {score.student.lastName}
                      </TableCell>
                      <TableCell>
                        {score.student.standard ? (
                          <Badge variant="info">{score.student.standard}</Badge>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{score.subject}</TableCell>
                      <TableCell>{score.testName}</TableCell>
                      <TableCell>
                        {score.obtainedMarks}/{score.maxMarks}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getPercentageBadge(pct) as any}>
                          {pct.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(score.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No test scores found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Test Score Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); resetForm(); }}
        title="Add Test Score"
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Student
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={studentSearchTerm}
                  onChange={(e) => {
                    setStudentSearchTerm(e.target.value);
                    setIsStudentDropdownOpen(true);
                    if (formData.studentId) {
                      setFormData({ ...formData, studentId: "" });
                    }
                  }}
                  onFocus={() => setIsStudentDropdownOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => setIsStudentDropdownOpen(false), 150);
                  }}
                  placeholder="Search by name, class, or ID"
                  required
                />
                {isStudentDropdownOpen && filteredStudents.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full max-h-60 overflow-y-auto overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
                    {filteredStudents.map((student) => {
                      const label = `${student.firstName} ${student.lastName}${student.standard ? ` (${student.standard})` : ""}`;
                      return (
                        <button
                          key={student.id}
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => handleStudentSelect(student)}
                          className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                        >
                          <div className="font-medium text-gray-900">{label}</div>
                          <div className="text-xs text-gray-500">ID: {student.id}</div>
                        </button>
                      );
                    })}
                  </div>
                )}
                {isStudentDropdownOpen && studentSearchTerm.trim() && filteredStudents.length === 0 && (
                  <div className="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-500 shadow-lg">
                    No students found
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
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
              name="testName"
              value={formData.testName}
              onChange={handleInputChange}
              required
              placeholder="e.g. Unit Test 1, Mid Term"
            />
            <Input
              label="Max Marks"
              type="number"
              name="maxMarks"
              value={formData.maxMarks}
              onChange={handleInputChange}
              required
              placeholder="e.g. 100"
            />
            <Input
              label="Obtained Marks"
              type="number"
              name="obtainedMarks"
              value={formData.obtainedMarks}
              onChange={handleInputChange}
              required
              placeholder="e.g. 85"
            />
            <Input
              label="Date"
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setIsModalOpen(false); resetForm(); }}
            >
              Cancel
            </Button>
            <Button type="submit">Add Test Score</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
