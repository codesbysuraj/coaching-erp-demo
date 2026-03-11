"use client";

import React, { useEffect, useState } from "react";
import { Search, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Loader } from "@/components/ui/Loader";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
}

interface Academic {
  id: number;
  studentId: number;
  schoolName?: string;
  board?: string;
  std?: string;
  collegeName?: string;
  aggregatePercentage?: string;
  mathsMarks?: string;
  scienceMarks?: string;
  examsQualified?: string;
  student: Student;
}

export default function AcademicsPage() {
  const [academics, setAcademics] = useState<Academic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchAcademics(); }, []);

  const fetchAcademics = async () => {
    try {
      const res = await fetch("/api/academics");
      setAcademics(await res.json());
    } catch (error) {
      console.error("Failed to fetch academics:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = academics.filter(
    (a) =>
      a.student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.schoolName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgPct = academics.length > 0
    ? (academics.reduce((sum, a) => sum + parseFloat(a.aggregatePercentage || "0"), 0) / academics.length).toFixed(1)
    : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-full"><Loader size="lg" /></div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Academic Records</h1>
        <p className="text-gray-500 mt-1">View student academic information. Add or edit via the student profile.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Records</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{academics.length}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Avg Percentage</p>
                <h3 className="text-2xl font-bold text-green-600 mt-2">{avgPct}%</h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <BookOpen className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Exams Qualified</p>
                <h3 className="text-2xl font-bold text-purple-600 mt-2">
                  {academics.filter((a) => a.examsQualified).length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BookOpen className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Student Academic Records ({filtered.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input type="text" placeholder="Search records..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>School / College</TableHead>
                <TableHead>Board</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Aggregate %</TableHead>
                <TableHead>Maths</TableHead>
                <TableHead>Science</TableHead>
                <TableHead>Exams Qualified</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? filtered.map((a) => (
                <TableRow key={a.id}>
                  <TableCell className="font-medium">{a.student.firstName} {a.student.lastName}</TableCell>
                  <TableCell>{a.schoolName || a.collegeName || "—"}</TableCell>
                  <TableCell>{a.board || "—"}</TableCell>
                  <TableCell>{a.std || "—"}</TableCell>
                  <TableCell>{a.aggregatePercentage ? `${a.aggregatePercentage}%` : "—"}</TableCell>
                  <TableCell>{a.mathsMarks || "—"}</TableCell>
                  <TableCell>{a.scienceMarks || "—"}</TableCell>
                  <TableCell>{a.examsQualified || "—"}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No academic records found
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
