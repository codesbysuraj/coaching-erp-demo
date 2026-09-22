"use client";

import React, { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Loader } from "@/components/ui/Loader";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  mobile: string;
}

interface Parent {
  id: number;
  studentId: number;
  fatherName?: string;
  motherName?: string;
  occupation?: string;
  fatherMobile?: string;
  motherMobile?: string;
  fatherEmail?: string;
  motherEmail?: string;
  fatherAadhar?: string;
  motherAadhar?: string;
  student: Student;
}

export default function ParentsPage() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { fetchParents(); }, []);

  const fetchParents = async () => {
    try {
      const res = await fetch("/api/commerce/parents");
      setParents(await res.json());
    } catch (error) {
      console.error("Failed to fetch parents:", error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = parents.filter(
    (p) =>
      p.student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.fatherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.motherName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-full"><Loader size="lg" /></div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Parent Information</h1>
        <p className="text-gray-500 mt-1">View parent and guardian details. Add or edit via the student profile.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Records</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-2">{parents.length}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Complete Profiles</p>
                <h3 className="text-2xl font-bold text-green-600 mt-2">
                  {parents.filter((p) => p.fatherName && p.motherName && p.fatherMobile).length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">With Contact</p>
                <h3 className="text-2xl font-bold text-purple-600 mt-2">
                  {parents.filter((p) => p.fatherMobile || p.motherMobile).length}
                </h3>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Parent Details ({filtered.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <Input type="text" placeholder="Search parents..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Father Name</TableHead>
                <TableHead>Mother Name</TableHead>
                <TableHead>Father Mobile</TableHead>
                <TableHead>Mother Mobile</TableHead>
                <TableHead>Occupation</TableHead>
                <TableHead>Father Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? filtered.map((parent) => (
                <TableRow key={parent.id}>
                  <TableCell className="font-medium">{parent.student.firstName} {parent.student.lastName}</TableCell>
                  <TableCell>{parent.fatherName || "—"}</TableCell>
                  <TableCell>{parent.motherName || "—"}</TableCell>
                  <TableCell>{parent.fatherMobile || "—"}</TableCell>
                  <TableCell>{parent.motherMobile || "—"}</TableCell>
                  <TableCell>{parent.occupation || "—"}</TableCell>
                  <TableCell>{parent.fatherEmail || "—"}</TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No parent records found
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
