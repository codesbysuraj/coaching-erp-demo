"use client";

import React, { useEffect, useState } from "react";
import { Users, TrendingUp, IndianRupee, Calendar } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";

interface RecentAdmission {
  id: number;
  firstName: string;
  lastName: string;
  mobile: string;
  createdAt: string;
}

interface DashboardStats {
  totalStudents: number;
  attendancePercentage: number;
  pendingFees: number;
  recentAdmissions: RecentAdmission[];
  attendanceBreakdown: {
    present: number;
    absent: number;
    late: number;
    total: number;
  };
  feeBreakdown: {
    assigned: number;
    collected: number;
    pending: number;
  };
  admissionsTrend: Array<{
    date: string;
    count: number;
  }>;
  standardDistribution: Array<{
    standard: string;
    count: number;
  }>;
}

const attendanceColors = ["#16a34a", "#dc2626", "#f59e0b"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatShortDate = (isoDate: string) =>
  new Date(isoDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" });

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string>("");

  useEffect(() => {
    fetchAdminRole();
    fetchDashboardData();
  }, []);

  const fetchAdminRole = async () => {
    try {
      const response = await fetch("/api/auth/me");
      const data = await response.json();
      if (data.role) setRole(data.role);
    } catch (error) {
      console.error("Failed to fetch admin role:", error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await fetch("/api/dashboard");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader size="lg" />
      </div>
    );
  }

  const attendanceChartData = [
    { name: "Present", value: stats?.attendanceBreakdown.present || 0 },
    { name: "Absent", value: stats?.attendanceBreakdown.absent || 0 },
    { name: "Late", value: stats?.attendanceBreakdown.late || 0 },
  ];

  const feeChartData = [
    { name: "Assigned", amount: stats?.feeBreakdown.assigned || 0 },
    { name: "Collected", amount: stats?.feeBreakdown.collected || 0 },
    { name: "Pending", amount: stats?.feeBreakdown.pending || 0 },
  ];

  const admissionsTrendData = (stats?.admissionsTrend || []).map((entry) => ({
    ...entry,
    day: formatShortDate(entry.date),
  }));

  const classDistributionData = stats?.standardDistribution || [];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.totalStudents || 0}
                </h3>
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
                <p className="text-sm font-medium text-gray-500">Attendance Today</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.attendancePercentage || 0}%
                </h3>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>

        {role === "SUPER_ADMIN" && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Pending Fees</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-2">
                    {formatCurrency(stats?.pendingFees || 0)}
                  </h3>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <IndianRupee className="text-red-600" size={24} />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">New Admissions</p>
                <h3 className="text-3xl font-bold text-gray-900 mt-2">
                  {stats?.recentAdmissions.length || 0}
                </h3>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Calendar className="text-purple-600" size={24} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Admissions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Admissions</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentAdmissions && stats.recentAdmissions.length > 0 ? (
              <div className="space-y-4">
                {stats.recentAdmissions.map((student) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div>
                      <p className="font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-sm text-gray-500">{student.mobile}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent admissions</p>
            )}
          </CardContent>
        </Card>

        {/* Attendance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg p-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={attendanceChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={82}
                    paddingAngle={3}
                  >
                    {attendanceChartData.map((entry, index) => (
                      <Cell key={entry.name} fill={attendanceColors[index % attendanceColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {role === "SUPER_ADMIN" && (
          <Card>
            <CardHeader>
              <CardTitle>Fee Collection</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-50 rounded-lg p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={feeChartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `₹${Number(value) / 1000}k`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value ?? 0))} />
                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="#2563eb" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Class Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg p-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classDistributionData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="standard" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#7c3aed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Admissions Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={admissionsTrendData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#059669" strokeWidth={3} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
