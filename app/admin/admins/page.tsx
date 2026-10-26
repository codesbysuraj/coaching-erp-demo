"use client";

import React, { useEffect, useState } from "react";
import {
  ShieldCheck, Plus, Trash2, Eye, EyeOff, Clock,
  Users, ChevronDown, ChevronUp, Copy, Check, LogIn
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Admin {
  id: number;
  name: string;
  email: string;
  role: string;
  modules: string[];
  createdAt: string;
  lastLogin: string | null;
  loginCount: number;
}

interface LoginLog {
  id: number;
  email: string;
  name: string;
  ipAddress: string;
  userAgent: string;
  loggedInAt: string;
}

export default function AdminsPage() {
  const { showToast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [logs, setLogs] = useState<LoginLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedAdmin, setExpandedAdmin] = useState<number | null>(null);
  const [adminLogs, setAdminLogs] = useState<Record<number, LoginLog[]>>({});
  const [deleteTarget, setDeleteTarget] = useState<Admin | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // New admin form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("ADMIN");
  const [formModules, setFormModules] = useState<string[]>(["SCHOOL"]);
  const [showFormPass, setShowFormPass] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAdmins();
    fetchAllLogs();
  }, []);

  const fetchAdmins = async () => {
    try {
      const res = await fetch("/api/admins");
      if (!res.ok) return;
      setAdmins(await res.json());
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLogs = async () => {
    const res = await fetch("/api/admins/logs");
    if (res.ok) setLogs(await res.json());
  };

  const fetchAdminLogs = async (adminId: number) => {
    if (adminLogs[adminId]) return;
    const res = await fetch(`/api/admins/logs?adminId=${adminId}`);
    if (res.ok) {
      const data = await res.json();
      setAdminLogs((prev) => ({ ...prev, [adminId]: data }));
    }
  };

  const handleModuleToggle = (mod: string) => {
    setFormModules(prev => prev.includes(mod) ? prev.filter(m => m !== mod) : [...prev, mod]);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formModules.length === 0 && formRole !== "SUPER_ADMIN") {
      showToast("Select at least one module", "error");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, email: formEmail, password: formPassword, role: formRole, modules: formModules }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data.error || "Failed to create admin", "error"); return; }
      showToast(`Admin ${formName} created successfully!`, "success");
      setFormName(""); setFormEmail(""); setFormPassword(""); setFormRole("ADMIN"); setFormModules(["SCHOOL"]);
      setShowForm(false);
      fetchAdmins();
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/admins?id=${deleteTarget.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || "Failed to delete", "error"); return; }
    showToast(`${deleteTarget.name} removed`, "info");
    setDeleteTarget(null);
    fetchAdmins();
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDate = (d: string | null) =>
    d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Never";

  if (loading) return <div className="flex items-center justify-center h-48 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <ShieldCheck size={26} className="text-blue-600" />
            Admin Management
          </h1>
          <p className="text-gray-500 mt-1 text-sm">Manage admin accounts and view login history</p>
        </div>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={16} className="mr-1" /> New Admin
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Create New Admin</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text" required value={formName} onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="admin@brightfuture.example"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showFormPass ? "text" : "password"} required value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button type="button" onClick={() => setShowFormPass(!showFormPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showFormPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select value={formRole} onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              
              {formRole === "ADMIN" && (
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Module Access</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={formModules.includes("SCHOOL")} onChange={() => handleModuleToggle("SCHOOL")} />
                      School / Science
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={formModules.includes("COMMERCE")} onChange={() => handleModuleToggle("COMMERCE")} />
                      Commerce
                    </label>
                  </div>
                </div>
              )}

              <div className="sm:col-span-2 flex gap-3 mt-2">
                <Button type="submit" variant="primary" disabled={creating}>
                  {creating ? "Creating..." : "Create Admin"}
                </Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users size={18} className="text-gray-600" />
            All Admins ({admins.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-100">
            {admins.map((admin) => (
              <div key={admin.id}>
                <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                      {admin.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900 text-sm">{admin.name}</span>
                        <Badge variant={admin.role === "SUPER_ADMIN" ? "danger" : "info"}>
                          {admin.role === "SUPER_ADMIN" ? "Super Admin" : "Admin"}
                        </Badge>
                        {admin.role !== "SUPER_ADMIN" && (
                          <div className="flex gap-1 ml-2">
                            {admin.modules?.includes("SCHOOL") && <Badge variant="warning">School</Badge>}
                            {admin.modules?.includes("COMMERCE") && <Badge variant="success">Commerce</Badge>}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-xs text-gray-500 font-mono">{admin.email}</span>
                        <button onClick={() => copyToClipboard(admin.email, admin.id)}
                          className="text-gray-400 hover:text-gray-600 ml-1" title="Copy email">
                          {copiedId === admin.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        </button>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> Last login: {formatDate(admin.lastLogin)}
                        </span>
                        <span className="flex items-center gap-1">
                          <LogIn size={11} /> {admin.loginCount} sign-ins
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                    <button
                      onClick={async () => {
                        const newId = expandedAdmin === admin.id ? null : admin.id;
                        setExpandedAdmin(newId);
                        if (newId) await fetchAdminLogs(newId);
                      }}
                      className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 px-2 py-1 rounded hover:bg-blue-50"
                    >
                      {expandedAdmin === admin.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      Logs
                    </button>
                    <button onClick={() => setDeleteTarget(admin)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                      title="Remove admin">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {expandedAdmin === admin.id && (
                  <div className="bg-gray-50 border-t border-gray-100 px-6 py-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Login History</p>
                    {(adminLogs[admin.id] || []).length === 0 ? (
                      <p className="text-xs text-gray-400 py-2">No login history yet</p>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto">
                        {(adminLogs[admin.id] || []).map((log) => (
                          <div key={log.id} className="flex items-start justify-between text-xs bg-white rounded-lg px-3 py-2 border border-gray-100">
                            <div>
                              <span className="font-medium text-gray-700">{formatDate(log.loggedInAt)}</span>
                              <span className="text-gray-400 ml-2">from {log.ipAddress}</span>
                            </div>
                            <span className="text-gray-400 max-w-xs truncate text-right" title={log.userAgent}>
                              {log.userAgent?.split(" ")[0] || "Unknown browser"}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogIn size={18} className="text-gray-600" />
            Recent Sign-in Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">No login activity recorded yet</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {logs.slice(0, 20).map((log) => (
                <div key={log.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-xs font-bold">
                      {log.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-800">{log.name}</span>
                      <span className="text-xs text-gray-500 ml-2">{log.email}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600">{formatDate(log.loggedInAt)}</p>
                    <p className="text-xs text-gray-400">{log.ipAddress}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Admin"
        message={`Remove ${deleteTarget?.name} (${deleteTarget?.email}) from the admin panel? They will no longer be able to log in.`}
        confirmText="Remove"
        variant="danger"
      />
    </div>
  );
}
