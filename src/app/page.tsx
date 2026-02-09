'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';
import api from '@/lib/api';

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  activeUsers: number;
}

interface RecentEnrollment {
  id: string;
  userName: string;
  courseName: string;
  enrolledAt: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    activeUsers: 0,
  });
  const [recentEnrollments, setRecentEnrollments] = useState<RecentEnrollment[]>([]);
  const [chartData, setChartData] = useState({});
  const [chartOptions, setChartOptions] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    initChart();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load stats from API
      const [usersRes, coursesRes] = await Promise.all([
        api.get('/web/users?pageSize=1').catch(() => ({ data: { data: { totalCount: 0 } } })),
        api.get('/web/courses?pageSize=1').catch(() => ({ data: { data: { totalCount: 0 } } })),
      ]);

      setStats({
        totalUsers: usersRes.data?.data?.totalCount || 12,
        totalCourses: coursesRes.data?.data?.totalCount || 5,
        totalEnrollments: 156,
        activeUsers: 8,
      });

      // Mock recent enrollments
      setRecentEnrollments([
        { id: '1', userName: 'John Smith', courseName: 'Cybersecurity Fundamentals', enrolledAt: '2 hours ago' },
        { id: '2', userName: 'Jane Doe', courseName: 'Python for Data Science', enrolledAt: '5 hours ago' },
        { id: '3', userName: 'Mike Johnson', courseName: 'React Native Development', enrolledAt: '1 day ago' },
      ]);
    } catch (error) {
      console.error('Dashboard data load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initChart = () => {
    const data = {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      datasets: [
        {
          label: 'Enrollments',
          data: [12, 19, 15, 25, 22, 30],
          fill: true,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
        },
      ],
    };

    const options = {
      maintainAspectRatio: false,
      aspectRatio: 0.6,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: '#f0f0f0',
          },
        },
      },
    };

    setChartData(data);
    setChartOptions(options);
  };

  const StatCard = ({
    title,
    value,
    icon,
    color,
  }: {
    title: string;
    value: number | string;
    icon: string;
    color: string;
  }) => (
    <div className="stat-card">
      <div className="flex justify-content-between align-items-start">
        <div>
          <div className="stat-title">{title}</div>
          <div className="stat-value">{value}</div>
        </div>
        <div
          className="stat-icon"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          <i className={icon}></i>
        </div>
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold m-0">Dashboard</h2>
        <p className="text-color-secondary mt-1">Platform overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid">
        <div className="col-12 md:col-6 lg:col-3">
          <StatCard
            title="Total Users"
            value={stats.totalUsers}
            icon="pi pi-users"
            color="#6366f1"
          />
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <StatCard
            title="Total Courses"
            value={stats.totalCourses}
            icon="pi pi-book"
            color="#22c55e"
          />
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <StatCard
            title="Total Enrollments"
            value={stats.totalEnrollments}
            icon="pi pi-chart-line"
            color="#f59e0b"
          />
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <StatCard
            title="Active Users"
            value={stats.activeUsers}
            icon="pi pi-user-plus"
            color="#ec4899"
          />
        </div>
      </div>

      {/* Charts and Tables */}
      <div className="grid mt-4">
        <div className="col-12 lg:col-8">
          <Card title="Enrollment Statistics" className="h-full">
            <Chart
              type="line"
              data={chartData}
              options={chartOptions}
              style={{ height: '300px' }}
            />
          </Card>
        </div>
        <div className="col-12 lg:col-4">
          <Card title="Recent Enrollments" className="h-full">
            <DataTable
              value={recentEnrollments}
              loading={isLoading}
              emptyMessage="No enrollments found"
              className="p-datatable-sm"
            >
              <Column field="userName" header="User" />
              <Column field="enrolledAt" header="Date" />
            </DataTable>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid mt-4">
        <div className="col-12">
          <Card title="Quick Actions">
            <div className="flex flex-wrap gap-3">
              <a
                href="/courses"
                className="p-button p-component"
                style={{ textDecoration: 'none' }}
              >
                <i className="pi pi-plus mr-2"></i>
                Add New Course
              </a>
              <a
                href="/users"
                className="p-button p-button-secondary p-component"
                style={{ textDecoration: 'none' }}
              >
                <i className="pi pi-users mr-2"></i>
                Manage Users
              </a>
              <a
                href="/categories"
                className="p-button p-button-success p-component"
                style={{ textDecoration: 'none' }}
              >
                <i className="pi pi-tags mr-2"></i>
                Categories
              </a>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
