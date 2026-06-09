"use client";

import React, { useEffect, useState } from "react";
import { Calendar, Check, X, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Loader } from "@/components/ui/Loader";
import { useToast } from "@/components/ui/Toast";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  mobile: string;
  standard?: string;
  subjects?: string;
}

interface AttendanceRecord {
  studentId: number;
  status: string;
}

const STANDARDS = ["9th", "10th", "11th", "12th"];
const ALL_SUBJECTS = ["General", "Physics", "Chemistry", "Mathematics", "IT", "CS", "Biology"];

export default function AttendancePage() {
  const { showToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedSubject, setSelectedSubject] = useState("General");
  const [filterStandard, setFilterStandard] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [selectedDate, selectedSubject]);

  const fetchStudents = async () => {
    try {
      const response = await fetch("/api/students");
      const data = await response.json();
      setStudents(data);
    } catch (error) {
      showToast("Failed to fetch students", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await fetch(`/api/attendance?date=${selectedDate}&subject=${selectedSubject}`);
      const data = await response.json();
      
      const attendanceMap: Record<number, string> = {};
      data.forEach((record: AttendanceRecord & { student: Student }) => {
        attendanceMap[record.studentId] = record.status;
      });
      
      setAttendance(attendanceMap);
    } catch (error) {
      console.error("Failed to fetch attendance:", error);
    }
  };

  const toggleAttendance = (studentId: number, status: string) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: prev[studentId] === status ? "" : status,
    }));
  };

  const markAllPresent = () => {
    const newAttendance: Record<number, string> = {};
    filteredStudents.forEach((student) => {
      newAttendance[student.id] = "Present";
    });
    setAttendance({ ...attendance, ...newAttendance });
    showToast("All students marked as Present", "info");
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    try {
      const promises = Object.entries(attendance).map(([studentId, status]) =>
        fetch("/api/attendance", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: parseInt(studentId),
            date: selectedDate,
            subject: selectedSubject,
            status,
          }),
        })
      );

      await Promise.all(promises);
      showToast("Attendance saved successfully!", "success");
    } catch (error) {
      showToast("Failed to save attendance", "error");
    } finally {
      setSaving(false);
    }
  };

  // Filter students by standard and subject
  const filteredStudents = students.filter((student) => {
    // Filter by standard
    if (filterStandard && student.standard !== filterStandard) {
      return false;
    }
    
    // Filter by subject enrollment
    if (selectedSubject && selectedSubject !== "General") {
      // Check if student has this subject
      if (!student.subjects) return false;
      const studentSubjects = student.subjects.split(",").map((s) => s.trim());
      return studentSubjects.includes(selectedSubject);
    }
    
    return true;
  });

  const attendanceValues = Object.values(attendance).filter(Boolean);
  const presentCount = attendanceValues.filter((status) => status === "Present").length;
  const absentCount = attendanceValues.filter((status) => status === "Absent").length;
  const lateCount = attendanceValues.filter((status) => status === "Late").length;
  const totalMarked = attendanceValues.length;
  const attendancePercentage = totalMarked > 0 
    ? (((presentCount + lateCount) / totalMarked) * 100).toFixed(1) 
    : "0";

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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
        <p className="text-gray-500 mt-1">Mark daily attendance for students by subject</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</p>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">{filteredStudents.length}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Present</p>
            <h3 className="text-2xl font-bold text-emerald-600 mt-1">{presentCount}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Late</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-1">{lateCount}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</p>
            <h3 className="text-2xl font-bold text-red-600 mt-1">{absentCount}</h3>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance %</p>
            <h3 className="text-2xl font-bold text-blue-600 mt-1">{attendancePercentage}%</h3>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <CardTitle>Mark Attendance</CardTitle>
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" onClick={markAllPresent}>
                  Mark All Present
                </Button>
                <Button onClick={handleSaveAttendance} disabled={saving}>
                  {saving ? "Saving..." : "Save Attendance"}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-gray-500" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-auto"
                />
              </div>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {ALL_SUBJECTS.map((sub) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
              <select
                value={filterStandard}
                onChange={(e) => setFilterStandard(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="">All Classes</option>
                {STANDARDS.map((std) => (
                  <option key={std} value={std}>{std}</option>
                ))}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => {
                  const status = attendance[student.id];
                  return (
                    <TableRow key={student.id}>
                      <TableCell>{student.id}</TableCell>
                      <TableCell>
                        {student.firstName} {student.lastName}
                      </TableCell>
                      <TableCell>
                        {student.standard ? (
                          <Badge variant="info">{student.standard}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {status === "Present" && (
                          <Badge variant="success">Present</Badge>
                        )}
                        {status === "Late" && (
                          <Badge variant="warning">Late</Badge>
                        )}
                        {status === "Absent" && (
                          <Badge variant="danger">Absent</Badge>
                        )}
                        {!status && (
                          <Badge variant="default">Not Marked</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={status === "Present" ? "success" : "secondary"}
                            onClick={() => toggleAttendance(student.id, "Present")}
                            title="Present"
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant={status === "Late" ? "primary" : "secondary"}
                            onClick={() => toggleAttendance(student.id, "Late")}
                            title="Late"
                            className={status === "Late" ? "!bg-amber-500 hover:!bg-amber-600" : ""}
                          >
                            <Clock size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant={status === "Absent" ? "danger" : "secondary"}
                            onClick={() => toggleAttendance(student.id, "Absent")}
                            title="Absent"
                          >
                            <X size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No students found for this filter
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
