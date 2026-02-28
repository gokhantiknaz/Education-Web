'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';
import { Tag } from 'primereact/tag';
import { Avatar } from 'primereact/avatar';
import { ProgressBar } from 'primereact/progressbar';
import { Skeleton } from 'primereact/skeleton';
import api, { ApiResponse } from '@/lib/api';

interface DashboardData {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalLessons: number;
  totalRevenue: number;
  revenueThisMonth: number;
  newUsersThisMonth: number;
  newEnrollmentsThisMonth: number;
  completedCoursesCount: number;
  activeUsersToday: number;
  averageWatchTimeMinutes: number;
  totalWatchTimeMinutes: number;
  averageCompletionRate: number;
  popularCourses: PopularCourse[];
  mostWatchedCourses: MostWatchedCourse[];
  mostWatchedLessons: MostWatchedLesson[];
  recentEnrollments: RecentEnrollment[];
  recentOrders: RecentOrder[];
  monthlyEnrollments: MonthlyEnrollment[];
  dailyActivity: DailyActivity[];
}

interface PopularCourse {
  id: string;
  title: string;
  enrollmentCount: number;
  revenue: number;
}

interface MostWatchedCourse {
  id: string;
  title: string;
  thumbnailUrl?: string;
  totalViews: number;
  totalWatchTimeMinutes: number;
  completionRate: number;
}

interface MostWatchedLesson {
  id: string;
  title: string;
  courseTitle: string;
  viewCount: number;
  averageWatchTimeSeconds: number;
  completionRate: number;
}

interface RecentEnrollment {
  id: string;
  userName: string;
  userEmail: string;
  userProfileImage?: string;
  courseTitle: string;
  courseThumbnail?: string;
  enrolledAt: string;
  progressPercentage: number;
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  userEmail: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface MonthlyEnrollment {
  year: number;
  month: number;
  monthName: string;
  enrollmentCount: number;
  completionCount: number;
}

interface DailyActivity {
  date: string;
  activeUsers: number;
  lessonViews: number;
  watchTimeMinutes: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollmentChartData, setEnrollmentChartData] = useState({});
  const [watchedCoursesChartData, setWatchedCoursesChartData] = useState({});
  const [activityChartData, setActivityChartData] = useState({});
  const [chartOptions, setChartOptions] = useState({});
  const [barChartOptions, setBarChartOptions] = useState({});

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (data) {
      initCharts();
    }
  }, [data]);

  const loadDashboardData = async () => {
    try {
      const response = await api.get<ApiResponse<DashboardData>>('/web/analytics/dashboard');
      if (response.data?.data) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Dashboard data load error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initCharts = () => {
    if (!data) return;

    // Enrollment trend chart
    const enrollmentData = {
      labels: data.monthlyEnrollments.map(m => m.monthName),
      datasets: [
        {
          label: 'Kayitlar',
          data: data.monthlyEnrollments.map(m => m.enrollmentCount),
          fill: true,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Tamamlananlar',
          data: data.monthlyEnrollments.map(m => m.completionCount),
          fill: true,
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
        },
      ],
    };
    setEnrollmentChartData(enrollmentData);

    // Most watched courses chart
    const watchedData = {
      labels: data.mostWatchedCourses.map(c => c.title.length > 20 ? c.title.substring(0, 20) + '...' : c.title),
      datasets: [
        {
          label: 'Izlenme',
          data: data.mostWatchedCourses.map(c => c.totalViews),
          backgroundColor: '#6366f1',
          borderRadius: 4,
        },
      ],
    };
    setWatchedCoursesChartData(watchedData);

    // Daily activity chart
    const activityData = {
      labels: data.dailyActivity.map(d => {
        const date = new Date(d.date);
        return date.toLocaleDateString('tr-TR', { weekday: 'short' });
      }),
      datasets: [
        {
          label: 'Aktif Kullanici',
          data: data.dailyActivity.map(d => d.activeUsers),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          tension: 0.4,
        },
        {
          label: 'Ders Izleme',
          data: data.dailyActivity.map(d => d.lessonViews),
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.5)',
          tension: 0.4,
        },
      ],
    };
    setActivityChartData(activityData);

    // Chart options
    setChartOptions({
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
        },
      },
      scales: {
        x: {
          grid: { display: false },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f0f0f0' },
        },
      },
    });

    setBarChartOptions({
      indexAxis: 'y',
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: '#f0f0f0' },
        },
        y: {
          grid: { display: false },
        },
      },
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
    }).format(value);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} dk`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours} sa ${mins} dk`;
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins} dk once`;
    if (diffHours < 24) return `${diffHours} saat once`;
    return `${diffDays} gun once`;
  };

  const StatCard = ({
    title,
    value,
    subValue,
    icon,
    color,
  }: {
    title: string;
    value: number | string;
    subValue?: string;
    icon: string;
    color: string;
  }) => (
    <div className="stat-card">
      <div className="flex justify-content-between align-items-start">
        <div>
          <div className="stat-title">{title}</div>
          <div className="stat-value">{value}</div>
          {subValue && <div className="text-sm text-color-secondary mt-1">{subValue}</div>}
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

  const enrollmentUserTemplate = (rowData: RecentEnrollment) => (
    <div className="flex align-items-center gap-2">
      <Avatar
        image={rowData.userProfileImage}
        icon="pi pi-user"
        size="normal"
        shape="circle"
      />
      <div>
        <div className="font-semibold">{rowData.userName || 'Kullanici'}</div>
        <div className="text-sm text-color-secondary">{rowData.userEmail}</div>
      </div>
    </div>
  );

  const enrollmentProgressTemplate = (rowData: RecentEnrollment) => (
    <div className="w-full">
      <div className="flex justify-content-between mb-1">
        <span className="text-sm">{rowData.courseTitle}</span>
        <span className="text-sm font-semibold">{Math.round(rowData.progressPercentage)}%</span>
      </div>
      <ProgressBar value={rowData.progressPercentage} showValue={false} style={{ height: '6px' }} />
    </div>
  );

  const lessonViewsTemplate = (rowData: MostWatchedLesson) => (
    <div className="flex align-items-center gap-2">
      <i className="pi pi-eye text-primary" />
      <span>{rowData.viewCount}</span>
    </div>
  );

  const lessonCompletionTemplate = (rowData: MostWatchedLesson) => (
    <Tag
      value={`${Math.round(rowData.completionRate)}%`}
      severity={rowData.completionRate > 70 ? 'success' : rowData.completionRate > 40 ? 'warning' : 'danger'}
    />
  );

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="mb-4">
          <Skeleton width="200px" height="2rem" className="mb-2" />
          <Skeleton width="150px" height="1rem" />
        </div>
        <div className="grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="col-12 md:col-6 lg:col-3">
              <Skeleton height="120px" />
            </div>
          ))}
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="text-center py-8">
          <i className="pi pi-exclamation-circle text-4xl text-color-secondary mb-3" />
          <p>Dashboard verileri yuklenemedi</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-4">
        <h2 className="text-2xl font-semibold m-0">Dashboard</h2>
        <p className="text-color-secondary mt-1">Platform genel gorunumu</p>
      </div>

      {/* Stats Grid - Row 1 */}
      <div className="grid">
        <div className="col-12 md:col-6 lg:col-3">
          <StatCard
            title="Toplam Kullanici"
            value={data.totalUsers}
            subValue={`Bu ay +${data.newUsersThisMonth}`}
            icon="pi pi-users"
            color="#6366f1"
          />
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <StatCard
            title="Toplam Kurs"
            value={data.totalCourses}
            subValue={`${data.totalLessons} ders`}
            icon="pi pi-book"
            color="#22c55e"
          />
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <StatCard
            title="Toplam Kayit"
            value={data.totalEnrollments}
            subValue={`Bu ay +${data.newEnrollmentsThisMonth}`}
            icon="pi pi-chart-line"
            color="#f59e0b"
          />
        </div>
        <div className="col-12 md:col-6 lg:col-3">
          <StatCard
            title="Bugun Aktif"
            value={data.activeUsersToday}
            subValue={`${data.completedCoursesCount} kurs tamamlandi`}
            icon="pi pi-user-plus"
            color="#ec4899"
          />
        </div>
      </div>

      {/* Stats Grid - Row 2: Watch Stats */}
      <div className="grid mt-2">
        <div className="col-12 md:col-4">
          <StatCard
            title="Toplam Izlenme Suresi"
            value={formatDuration(data.totalWatchTimeMinutes)}
            icon="pi pi-clock"
            color="#8b5cf6"
          />
        </div>
        <div className="col-12 md:col-4">
          <StatCard
            title="Ort. Izlenme Suresi"
            value={formatDuration(data.averageWatchTimeMinutes)}
            icon="pi pi-stopwatch"
            color="#06b6d4"
          />
        </div>
        <div className="col-12 md:col-4">
          <StatCard
            title="Tamamlanma Orani"
            value={`%${Math.round(data.averageCompletionRate)}`}
            icon="pi pi-check-circle"
            color="#10b981"
          />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid mt-4">
        <div className="col-12 lg:col-8">
          <Card title="Kayit Trendi (Son 6 Ay)" className="h-full">
            <Chart
              type="line"
              data={enrollmentChartData}
              options={chartOptions}
              style={{ height: '300px' }}
            />
          </Card>
        </div>
        <div className="col-12 lg:col-4">
          <Card title="Gunluk Aktivite (Son 7 Gun)" className="h-full">
            <Chart
              type="line"
              data={activityChartData}
              options={chartOptions}
              style={{ height: '300px' }}
            />
          </Card>
        </div>
      </div>

      {/* Most Watched Courses & Lessons */}
      <div className="grid mt-4">
        <div className="col-12 lg:col-6">
          <Card title="En Cok Izlenen Kurslar" className="h-full">
            <Chart
              type="bar"
              data={watchedCoursesChartData}
              options={barChartOptions}
              style={{ height: '250px' }}
            />
          </Card>
        </div>
        <div className="col-12 lg:col-6">
          <Card title="En Cok Izlenen Dersler" className="h-full">
            <DataTable
              value={data.mostWatchedLessons.slice(0, 5)}
              emptyMessage="Veri bulunamadi"
              className="p-datatable-sm"
              scrollable
              scrollHeight="250px"
            >
              <Column field="title" header="Ders" style={{ maxWidth: '150px' }} />
              <Column field="courseTitle" header="Kurs" style={{ maxWidth: '120px' }} />
              <Column header="Izlenme" body={lessonViewsTemplate} style={{ width: '80px' }} />
              <Column header="Tamamlanma" body={lessonCompletionTemplate} style={{ width: '100px' }} />
            </DataTable>
          </Card>
        </div>
      </div>

      {/* Recent Enrollments & Orders */}
      <div className="grid mt-4">
        <div className="col-12 lg:col-7">
          <Card title="Son Kayitlar" className="h-full">
            <DataTable
              value={data.recentEnrollments}
              emptyMessage="Kayit bulunamadi"
              className="p-datatable-sm"
              scrollable
              scrollHeight="300px"
            >
              <Column header="Kullanici" body={enrollmentUserTemplate} style={{ minWidth: '200px' }} />
              <Column header="Kurs & Ilerleme" body={enrollmentProgressTemplate} style={{ minWidth: '250px' }} />
              <Column
                header="Tarih"
                body={(row) => formatTimeAgo(row.enrolledAt)}
                style={{ width: '120px' }}
              />
            </DataTable>
          </Card>
        </div>
        <div className="col-12 lg:col-5">
          <Card title="Populer Kurslar (Kayit Sayisi)" className="h-full">
            <DataTable
              value={data.popularCourses}
              emptyMessage="Kurs bulunamadi"
              className="p-datatable-sm"
              scrollable
              scrollHeight="300px"
            >
              <Column field="title" header="Kurs" />
              <Column
                field="enrollmentCount"
                header="Kayit"
                body={(row) => (
                  <Tag value={row.enrollmentCount} severity="info" />
                )}
                style={{ width: '80px' }}
              />
              <Column
                field="revenue"
                header="Gelir"
                body={(row) => formatCurrency(row.revenue)}
                style={{ width: '100px' }}
              />
            </DataTable>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid mt-4">
        <div className="col-12">
          <Card title="Hizli Erisim">
            <div className="flex flex-wrap gap-3">
              <a
                href="/courses"
                className="p-button p-component"
                style={{ textDecoration: 'none' }}
              >
                <i className="pi pi-plus mr-2"></i>
                Yeni Kurs Ekle
              </a>
              <a
                href="/lessons"
                className="p-button p-button-info p-component"
                style={{ textDecoration: 'none' }}
              >
                <i className="pi pi-video mr-2"></i>
                Dersler
              </a>
              <a
                href="/users"
                className="p-button p-button-secondary p-component"
                style={{ textDecoration: 'none' }}
              >
                <i className="pi pi-users mr-2"></i>
                Kullanicilar
              </a>
              <a
                href="/enrollments"
                className="p-button p-button-success p-component"
                style={{ textDecoration: 'none' }}
              >
                <i className="pi pi-user-plus mr-2"></i>
                Kayitlar
              </a>
              <a
                href="/quizzes"
                className="p-button p-button-warning p-component"
                style={{ textDecoration: 'none' }}
              >
                <i className="pi pi-question-circle mr-2"></i>
                Quizler
              </a>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
