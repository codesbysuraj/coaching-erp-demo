"use client";

import React, { useEffect, useState } from "react";
import { Trash2, RotateCcw, AlertTriangle, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { Loader } from "@/components/ui/Loader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

interface DeletedStudent {
  id: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  gender?: string;
  mobile: string;
  email?: string;
  standard?: string;
  course?: string;
  createdAt: string;
  deletedAt: string;
}

export default function RecycleBinPage() {
  const { showToast } = useToast();
  const [deletedStudents, setDeletedStudents] = useState<DeletedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [restoreTarget, setRestoreTarget] = useState<DeletedStudent | null>(null);
  const [hardDeleteTarget, setHardDeleteTarget] = useState<DeletedStudent | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchDeletedStudents();
  }, []);

  const fetchDeletedStudents = async () => {
    try {
      const res = await fetch("/api/recycle-bin");
      const data = await res.json();
      setDeletedStudents(data);
    } catch {
      showToast("Failed to load recycle bin", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setProcessing(true);
    try {
      const res = await fetch("/api/recycle-bin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId: restoreTarget.id }),
      });
      if (res.ok) {
        showToast(`${restoreTarget.firstName} ${restoreTarget.lastName} restored successfully!`, "success");
        fetchDeletedStudents();
      } else {
        showToast("Failed to restore student", "error");
      }
    } catch {
      showToast("Failed to restore student", "error");
    } finally {
      setProcessing(false);
      setRestoreTarget(null);
    }
  };

  const handleHardDelete = async () => {
    if (!hardDeleteTarget) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/recycle-bin?studentId=${hardDeleteTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        showToast(`${hardDeleteTarget.firstName} ${hardDeleteTarget.lastName} permanently deleted.`, "info");
        fetchDeletedStudents();
      } else {
        showToast("Failed to permanently delete student", "error");
      }
    } catch {
      showToast("Failed to permanently delete student", "error");
    } finally {
      setProcessing(false);
      setHardDeleteTarget(null);
    }
  };

  const filtered = deletedStudents.filter(
    (s) =>
      s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.mobile.includes(searchTerm)
  );

  const daysInBin = (deletedAt: string) => {
    const diff = Date.now() - new Date(deletedAt).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Trash2 size={26} className="text-red-500" />
          Recycle Bin
        </h1>
        <p className="text-gray-500 mt-1">
          Students moved here can be restored. Permanently delete only when sure.
        </p>
      </div>

      {/* Warning Banner */}
      {deletedStudents.length > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <AlertTriangle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {deletedStudents.length} student{deletedStudents.length > 1 ? "s" : ""} in recycle bin
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              All attendance, fees, and test score records are preserved. Restore the student to make them active again.
            </p>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle>Deleted Students ({filtered.length})</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead>Deleted</TableHead>
                <TableHead>Days in Bin</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length > 0 ? (
                filtered.map((student) => (
                  <TableRow key={student.id} className="bg-red-50/30">
                    <TableCell>{student.id}</TableCell>
                    <TableCell className="font-medium">
                      {student.firstName} {student.middleName} {student.lastName}
                    </TableCell>
                    <TableCell>
                      {student.standard ? (
                        <Badge variant="info">{student.standard}</Badge>
                      ) : "-"}
                    </TableCell>
                    <TableCell>{student.mobile}</TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {new Date(student.deletedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={daysInBin(student.deletedAt) > 30 ? "danger" : "warning"}>
                        {daysInBin(student.deletedAt)}d
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => setRestoreTarget(student)}
                          title="Restore Student"
                        >
                          <RotateCcw size={15} className="mr-1" />
                          Restore
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setHardDeleteTarget(student)}
                          title="Permanently Delete"
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Trash2 size={32} className="text-gray-300" />
                      <p className="text-gray-400 font-medium">Recycle bin is empty</p>
                      <p className="text-gray-400 text-sm">Deleted students will appear here</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Restore Dialog */}
      <ConfirmDialog
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Restore Student"
        message={`Restore ${restoreTarget?.firstName} ${restoreTarget?.lastName}? They will become active again with all their data intact.`}
        confirmText="Restore"
        variant="primary"
        loading={processing}
      />

      {/* Hard Delete Dialog */}
      <ConfirmDialog
        isOpen={!!hardDeleteTarget}
        onClose={() => setHardDeleteTarget(null)}
        onConfirm={handleHardDelete}
        title="Permanently Delete Student"
        message={`This will PERMANENTLY delete ${hardDeleteTarget?.firstName} ${hardDeleteTarget?.lastName} and ALL their data (attendance, fees, test scores). This CANNOT be undone. Are you absolutely sure?`}
        confirmText="Delete Forever"
        variant="danger"
        loading={processing}
      />
    </div>
  );
}
