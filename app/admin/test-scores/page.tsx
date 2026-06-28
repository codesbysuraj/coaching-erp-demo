"use client";

import React, { useEffect, useState } from "react";
import { Plus, Search, Pencil, Trash2, X } from "lucide-react";
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

interface ScoreRow {
  testName: string;
  subject: string;
  maxMarks: string;
  obtainedMarks: string;
  date: string;
}

const ALL_SUBJECTS = [
  "English",
  "Hindi",
  "Marathi",
  "Science 1",
  "Science 2",
  "History",
  "Civics",
  "Geography",
  "SST",
  "Maths 1",
  "Maths 2",
];

const emptyScoreRow = (): ScoreRow => ({
  testName: "",
  subject: "",
  maxMarks: "",
  obtainedMarks: "",
  date: new Date().toISOString().split("T")[0],
});

export default function TestScoresPage() {
  const { showToast } = useToast();
  const [testScores, setTestScores] = useState<TestScore[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSubject, setFilterSubject] = useState("");

  // Add modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [isStudentDropdownOpen, setIsStudentDropdownOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [scoreRows, setScoreRows] = useState<ScoreRow[]>([emptyScoreRow()]);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingScoreId, setEditingScoreId] = useState<number | null>(null);
  const [editStudentName, setEditStudentName] = useState("");
  const [editFormData, setEditFormData] = useState({
    subject: "",
    testName: "",
    maxMarks: "",
    obtainedMarks: "",
    date: "",
  });

  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

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

  // ── ADD MODAL HANDLERS ──

  const handleStudentSelect = (student: Student) => {
    setSelectedStudentId(student.id.toString());
    setStudentSearchTerm(`${student.firstName} ${student.lastName}${student.standard ? ` (${student.standard})` : ""}`);
    setIsStudentDropdownOpen(false);
  };

  const addScoreRow = () => {
    setScoreRows([...scoreRows, emptyScoreRow()]);
  };

  const removeScoreRow = (index: number) => {
    if (scoreRows.length === 1) return;
    setScoreRows(scoreRows.filter((_, i) => i !== index));
  };

  const updateScoreRow = (index: number, field: keyof ScoreRow, value: string) => {
    const updated = [...scoreRows];
    updated[index] = { ...updated[index], [field]: value };
    setScoreRows(updated);
  };

  const resetAddForm = () => {
    setSelectedStudentId("");
    setStudentSearchTerm("");
    setIsStudentDropdownOpen(false);
    setScoreRows([emptyScoreRow()]);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentId) {
      showToast("Please select a student", "warning");
      return;
    }

    // Validate all rows
    for (let i = 0; i < scoreRows.length; i++) {
      const row = scoreRows[i];
      if (!row.testName.trim()) {
        showToast(`Row ${i + 1}: Please enter a test name`, "warning");
        return;
      }
      if (!row.subject) {
        showToast(`Row ${i + 1}: Please select a subject`, "warning");
        return;
      }
      if (!row.maxMarks || !row.obtainedMarks) {
        showToast(`Row ${i + 1}: Please enter marks`, "warning");
        return;
      }
      if (parseFloat(row.obtainedMarks) > parseFloat(row.maxMarks)) {
        showToast(`Row ${i + 1} (${row.subject}): Obtained marks cannot exceed max marks`, "warning");
        return;
      }
      if (!row.date) {
        showToast(`Row ${i + 1}: Please select a date`, "warning");
        return;
      }
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/test-scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: selectedStudentId,
          scores: scoreRows,
        }),
      });

      if (response.ok) {
        fetchTestScores();
        setIsAddModalOpen(false);
        resetAddForm();
        showToast(
          scoreRows.length === 1
            ? "Test score added successfully!"
            : `${scoreRows.length} test scores added successfully!`,
          "success"
        );
      } else {
        showToast("Failed to add test scores", "error");
      }
    } catch (error) {
      showToast("Failed to add test scores", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── EDIT MODAL HANDLERS ──

  const handleEdit = (score: TestScore) => {
    setEditingScoreId(score.id);
    setEditStudentName(`${score.student.firstName} ${score.student.lastName}${score.student.standard ? ` (${score.student.standard})` : ""}`);
    setEditFormData({
      subject: score.subject,
      testName: score.testName,
      maxMarks: score.maxMarks.toString(),
      obtainedMarks: score.obtainedMarks.toString(),
      date: new Date(score.date).toISOString().split("T")[0],
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScoreId) return;

    if (parseFloat(editFormData.obtainedMarks) > parseFloat(editFormData.maxMarks)) {
      showToast("Obtained marks cannot exceed max marks", "warning");
      return;
    }

    try {
      const response = await fetch("/api/test-scores", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingScoreId, ...editFormData }),
      });

      if (response.ok) {
        fetchTestScores();
        setIsEditModalOpen(false);
        setEditingScoreId(null);
        showToast("Test score updated successfully!", "success");
      } else {
        showToast("Failed to update test score", "error");
      }
    } catch (error) {
      showToast("Failed to update test score", "error");
    }
  };

  // ── DELETE ──

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/test-scores?id=${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchTestScores();
        setDeleteConfirmId(null);
        showToast("Test score deleted successfully!", "success");
      } else {
        showToast("Failed to delete test score", "error");
      }
    } catch (error) {
      showToast("Failed to delete test score", "error");
    }
  };

  // ── FILTERS ──

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

  // Which subjects are already used in the score rows (for disabling in dropdowns)
  const usedSubjects = scoreRows.map((r) => r.subject).filter(Boolean);

  // Compute unique test names for autocomplete suggestions
  const uniqueTestNames = Array.from(new Set(testScores.map((score) => score.testName))).filter(Boolean);

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
        <Button onClick={() => { resetAddForm(); setIsAddModalOpen(true); }}>
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
                <TableHead>Actions</TableHead>
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
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEdit(score)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit score"
                          >
                            <Pencil size={15} />
                          </button>
                          {deleteConfirmId === score.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDelete(score.id)}
                                className="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(score.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete score"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No test scores found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── ADD TEST SCORES MODAL (supports multiple) ── */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); resetAddForm(); }}
        title="Add Test Scores"
        size="lg"
      >
        <form onSubmit={handleAddSubmit} className="space-y-5">
          {/* Shared fields: Student */}
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Student *
              </label>
              <div className="relative">
                <Input
                  type="text"
                  value={studentSearchTerm}
                  onChange={(e) => {
                    setStudentSearchTerm(e.target.value);
                    setIsStudentDropdownOpen(true);
                    if (selectedStudentId) setSelectedStudentId("");
                  }}
                  onFocus={() => setIsStudentDropdownOpen(true)}
                  onBlur={() => window.setTimeout(() => setIsStudentDropdownOpen(false), 150)}
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
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-700">
                Subject Scores ({scoreRows.length})
              </h3>
              <button
                type="button"
                onClick={addScoreRow}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
              >
                <Plus size={16} />
                Add Score
              </button>
            </div>

            {/* Score rows */}
            <div className="space-y-3">
              {scoreRows.map((row, index) => (
                <div
                  key={index}
                  className="flex flex-col md:flex-row md:items-end gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Test Name *</label>
                    <input
                      type="text"
                      value={row.testName}
                      onChange={(e) => updateScoreRow(index, "testName", e.target.value)}
                      required
                      placeholder="e.g. Unit Test 1"
                      list="test-names-list"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Subject *</label>
                    <select
                      value={row.subject}
                      onChange={(e) => updateScoreRow(index, "subject", e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    >
                      <option value="">Select Subject</option>
                      {ALL_SUBJECTS.map((sub) => (
                        <option
                          key={sub}
                          value={sub}
                        >
                          {sub}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-full md:w-20">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Max *</label>
                    <input
                      type="number"
                      value={row.maxMarks}
                      onChange={(e) => updateScoreRow(index, "maxMarks", e.target.value)}
                      required
                      placeholder="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    />
                  </div>
                  <div className="w-full md:w-20">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Obtained *</label>
                    <input
                      type="number"
                      value={row.obtainedMarks}
                      onChange={(e) => updateScoreRow(index, "obtainedMarks", e.target.value)}
                      required
                      placeholder="85"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    />
                  </div>
                  <div className="w-full md:w-36">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Date *</label>
                    <input
                      type="date"
                      value={row.date}
                      onChange={(e) => updateScoreRow(index, "date", e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeScoreRow(index)}
                    disabled={scoreRows.length === 1}
                    className={`p-2 rounded-lg transition-colors self-end md:self-auto ${
                      scoreRows.length === 1
                        ? "text-gray-300 cursor-not-allowed"
                        : "text-red-500 hover:bg-red-50 hover:text-red-600"
                    }`}
                    title="Remove this row"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>

            {/* Quick add hint */}
            {scoreRows.length < ALL_SUBJECTS.length && (
              <p className="text-xs text-gray-400 mt-2">
                Click &quot;+ Add Score&quot; to add more subjects with different test names.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setIsAddModalOpen(false); resetAddForm(); }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : scoreRows.length === 1
                  ? "Add Test Score"
                  : `Add ${scoreRows.length} Test Scores`}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ── EDIT TEST SCORE MODAL ── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => { setIsEditModalOpen(false); setEditingScoreId(null); }}
        title="Edit Test Score"
        size="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
              <Input type="text" value={editStudentName} disabled className="bg-gray-50 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                value={editFormData.subject}
                onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
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
              value={editFormData.testName}
              onChange={(e) => setEditFormData({ ...editFormData, testName: e.target.value })}
              required
              placeholder="e.g. Unit Test 1, Mid Term"
              list="test-names-list"
            />
            <Input
              label="Max Marks"
              type="number"
              value={editFormData.maxMarks}
              onChange={(e) => setEditFormData({ ...editFormData, maxMarks: e.target.value })}
              required
              placeholder="e.g. 100"
            />
            <Input
              label="Obtained Marks"
              type="number"
              value={editFormData.obtainedMarks}
              onChange={(e) => setEditFormData({ ...editFormData, obtainedMarks: e.target.value })}
              required
              placeholder="e.g. 85"
            />
            <Input
              label="Date"
              type="date"
              value={editFormData.date}
              onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
              required
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setIsEditModalOpen(false); setEditingScoreId(null); }}
            >
              Cancel
            </Button>
            <Button type="submit">Update Test Score</Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Test Score"
        size="sm"
      >
        <p className="text-gray-600 mb-6">Are you sure you want to delete this test score? This action cannot be undone.</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </Button>
        </div>
      </Modal>
      {/* Datalist for Test Name Suggestions */}
      <datalist id="test-names-list">
        {uniqueTestNames.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </div>
  );
}
