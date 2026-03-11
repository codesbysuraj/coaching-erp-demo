"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Wallet,
  BookOpen,
  UserCircle,
  LogOut,
  Menu,
  X,
  ClipboardList,
  Trash2,
  Settings,
  ShieldCheck,
} from "lucide-react";

interface SidebarProps {
  children: React.ReactNode;
}

const baseMenuItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/admin" },
  { name: "Students", icon: Users, path: "/admin/students" },
  { name: "Attendance", icon: ClipboardCheck, path: "/admin/attendance" },
  { name: "Test Scores", icon: ClipboardList, path: "/admin/test-scores" },
  { name: "Fees", icon: Wallet, path: "/admin/fees" },
  { name: "Academics", icon: BookOpen, path: "/admin/academics" },
  { name: "Parents", icon: UserCircle, path: "/admin/parents" },
  { name: "Recycle Bin", icon: Trash2, path: "/admin/recycle-bin" },
  { name: "Settings", icon: Settings, path: "/admin/settings" },
];

const superAdminItem = { name: "Admins", icon: ShieldCheck, path: "/admin/admins" };

export const AdminLayout: React.FC<SidebarProps> = ({ children }) => {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [adminName, setAdminName] = useState("Admin");
  const [adminEmail, setAdminEmail] = useState("");
  const [role, setRole] = useState("");

  const menuItems = role === "SUPER_ADMIN"
    ? [...baseMenuItems, superAdminItem]
    : baseMenuItems;

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.name) setAdminName(d.name);
        if (d.email) setAdminEmail(d.email);
        if (d.role) setRole(d.role);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">K Meson Academy</h1>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <X size={24} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${isActive
                    ? "bg-blue-50 text-blue-600"
                    : "text-gray-700 hover:bg-gray-100"
                    }`}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-4 py-2.5 w-full text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <Menu size={24} />
            </button>
            <div className="lg:ml-0">
              <h2 className="text-2xl font-bold text-gray-900">
                {menuItems.find((item) => item.path === pathname)?.name || "Admin"}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{adminName}</p>
                <p className="text-xs text-gray-500">{adminEmail}</p>
              </div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                {adminName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
