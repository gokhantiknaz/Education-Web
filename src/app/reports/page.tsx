'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { Card } from 'primereact/card';
import { TabView, TabPanel } from 'primereact/tabview';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';
import { Calendar } from 'primereact/calendar';
import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { ProgressBar } from 'primereact/progressbar';
import { Skeleton } from 'primereact/skeleton';
import { Toast } from 'primereact/toast';
import api, { ApiResponse } from '@/lib/api';

// Types
interface ReportSummary {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalCompletions: number;
  totalRevenue: number;
  totalQuizAttempts: number;
  totalCertificates: number;
  enrollmentsThisPeriod: number;
  enrollmentsPreviousPeriod: number;
  revenueThisPeriod: number;
  revenuePreviousPeriod: number;
  totalWatchTimeMinutes: number;
  averageCompletionRate: number;
}

interface EnrollmentReport {
  items: EnrollmentItem[];
  totalCount: number;
  byDate: { date: string; count: number; completedCount: number }[];
  byCourse: { courseId: string; courseTitle: string; enrollmentCount: number; completionCount: number; averageProgress: number }[];
  byStatus: { status: string; count: number; percentage: number }[];
}

interface EnrollmentItem {
  id: string;
  userName: string;
  userEmail: string;
  courseTitle: string;
  enrolledAt: string;
  progressPercentage: number;
  completedAt?: string;
  status: string;
}

interface CoursePerformance {
  items: CoursePerformanceItem[];
}

interface CoursePerformanceItem {
  courseId: string;
  title: string;
  thumbnailUrl?: string;
  enrollmentCount: number;
  completionCount: number;
  completionRate: number;
  totalViews: number;
  totalWatchTimeMinutes: number;
  averageProgress: number;
  averageRating: number;
  reviewCount: number;
  revenue: number;
  quizAttempts: number;
  quizPassRate: number;
}

interface UserActivity {
  items: UserActivityItem[];
  totalActiveUsers: number;
  byDate: { date: string; activeUsers: number; lessonViews: number; quizAttempts: number; watchTimeMinutes: number }[];
}

interface UserActivityItem {
  userId: string;
  userName: string;
  userEmail: string;
  enrollmentCount: number;
  completedCourses: number;
  totalWatchTimeMinutes: number;
  quizAttempts: number;
  lastActivityAt?: string;
}

interface QuizPerformance {
  items: QuizPerformanceItem[];
  totalAttempts: number;
  totalPassed: number;
  totalFailed: number;
  overallPassRate: number;
}

interface QuizPerformanceItem {
  quizId: string;
  quizTitle: string;
  courseTitle: string;
  totalAttempts: number;
  passedCount: number;
  failedCount: number;
  passRate: number;
  averageScore: number;
  averageTimeSeconds: number;
}

interface Course {
  id: string;
  title: string;
}

export default function ReportsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState<Date[]>([
    new Date(new Date().setMonth(new Date().getMonth() - 1)),
    new Date()
  ]);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);

  // Report data
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [enrollmentReport, setEnrollmentReport] = useState<EnrollmentReport | null>(null);
  const [coursePerformance, setCoursePerformance] = useState<CoursePerformance | null>(null);
  const [userActivity, setUserActivity] = useState<UserActivity | null>(null);
  const [quizPerformance, setQuizPerformance] = useState<QuizPerformance | null>(null);

  // Charts
  const [enrollmentChartData, setEnrollmentChartData] = useState({});
  const [statusChartData, setStatusChartData] = useState({});
  const [activityChartData, setActivityChartData] = useState({});
  const [quizChartData, setQuizChartData] = useState({});

  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadCourses();
  }, []);

  useEffect(() => {
    if (dateRange[0] && dateRange[1]) {
      loadReports();
    }
  }, [dateRange, selectedCourse]);

  const loadCourses = async () => {
    try {
      const response = await api.get<ApiResponse<{ items: Course[] }>>('/web/courses?pageSize=100');
      setCourses(response.data.data.items || []);
    } catch (error) {
      console.error('Courses load error:', error);
    }
  };

  const loadReports = async () => {
    setIsLoading(true);
    const startDate = dateRange[0].toISOString();
    const endDate = dateRange[1].toISOString();

    try {
      const [summaryRes, enrollmentRes, courseRes, activityRes, quizRes] = await Promise.all([
        api.get<ApiResponse<ReportSummary>>(`/web/analytics/reports/summary?startDate=${startDate}&endDate=${endDate}`),
        api.get<ApiResponse<EnrollmentReport>>(`/web/analytics/reports/enrollments?startDate=${startDate}&endDate=${endDate}${selectedCourse ? `&courseId=${selectedCourse}` : ''}`),
        api.get<ApiResponse<CoursePerformance>>(`/web/analytics/reports/course-performance?startDate=${startDate}&endDate=${endDate}`),
        api.get<ApiResponse<UserActivity>>(`/web/analytics/reports/user-activity?startDate=${startDate}&endDate=${endDate}`),
        api.get<ApiResponse<QuizPerformance>>(`/web/analytics/reports/quiz-performance?startDate=${startDate}&endDate=${endDate}${selectedCourse ? `&courseId=${selectedCourse}` : ''}`)
      ]);

      setSummary(summaryRes.data.data);
      setEnrollmentReport(enrollmentRes.data.data);
      setCoursePerformance(courseRes.data.data);
      setUserActivity(activityRes.data.data);
      setQuizPerformance(quizRes.data.data);

      // Initialize charts
      initCharts(enrollmentRes.data.data, activityRes.data.data, quizRes.data.data);
    } catch (error) {
      console.error('Reports load error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Raporlar yuklenemedi'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const initCharts = (enrollment: EnrollmentReport, activity: UserActivity, quiz: QuizPerformance) => {
    // Enrollment trend
    setEnrollmentChartData({
      labels: enrollment.byDate.map(d => new Date(d.date).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })),
      datasets: [
        {
          label: 'Kayitlar',
          data: enrollment.byDate.map(d => d.count),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Tamamlanan',
          data: enrollment.byDate.map(d => d.completedCount),
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4
        }
      ]
    });

    // Status distribution
    setStatusChartData({
      labels: enrollment.byStatus.map(s => s.status),
      datasets: [{
        data: enrollment.byStatus.map(s => s.count),
        backgroundColor: ['#22c55e', '#f59e0b', '#ef4444'],
        borderWidth: 0
      }]
    });

    // Activity trend
    setActivityChartData({
      labels: activity.byDate.map(d => new Date(d.date).toLocaleDateString('tr-TR', { weekday: 'short' })),
      datasets: [
        {
          label: 'Aktif Kullanici',
          data: activity.byDate.map(d => d.activeUsers),
          borderColor: '#6366f1',
          tension: 0.4
        },
        {
          label: 'Ders Izleme',
          data: activity.byDate.map(d => d.lessonViews),
          borderColor: '#f59e0b',
          tension: 0.4
        }
      ]
    });

    // Quiz pass rate
    setQuizChartData({
      labels: ['Basarili', 'Basarisiz'],
      datasets: [{
        data: [quiz.totalPassed, quiz.totalFailed],
        backgroundColor: ['#22c55e', '#ef4444'],
        borderWidth: 0
      }]
    });
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(value);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${Math.round(minutes)} dk`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours} sa ${mins} dk`;
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' });

  const getChangeIcon = (current: number, previous: number) => {
    if (current > previous) return <i className="pi pi-arrow-up text-green-500 ml-2" />;
    if (current < previous) return <i className="pi pi-arrow-down text-red-500 ml-2" />;
    return <i className="pi pi-minus text-gray-400 ml-2" />;
  };

  const getChangePercent = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const change = ((current - previous) / previous) * 100;
    return `${change > 0 ? '+' : ''}${change.toFixed(1)}%`;
  };

  const chartOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' as const } },
    scales: {
      x: { grid: { display: false } },
      y: { beginAtZero: true, grid: { color: '#f0f0f0' } }
    }
  };

  const pieOptions = {
    maintainAspectRatio: false,
    plugins: { legend: { position: 'right' as const } }
  };

  const SummaryCard = ({ title, value, subValue, icon, color }: {
    title: string; value: string | number; subValue?: React.ReactNode; icon: string; color: string;
  }) => (
    <div className="surface-card shadow-1 border-round p-3">
      <div className="flex justify-content-between align-items-start">
        <div>
          <div className="text-500 text-sm mb-1">{title}</div>
          <div className="text-2xl font-bold">{value}</div>
          {subValue && <div className="text-sm mt-1">{subValue}</div>}
        </div>
        <div className="border-round p-2" style={{ backgroundColor: `${color}20`, color }}>
          <i className={`${icon} text-xl`} />
        </div>
      </div>
    </div>
  );

  if (isLoading && !summary) {
    return (
      <AdminLayout>
        <div className="mb-4">
          <Skeleton width="200px" height="2rem" className="mb-2" />
        </div>
        <div className="grid">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="col-12 md:col-6 lg:col-3">
              <Skeleton height="100px" />
            </div>
          ))}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Toast ref={toast} />

      <div className="flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold m-0">Raporlar</h2>
          <p className="text-color-secondary mt-1">Detayli platform analizleri</p>
        </div>
        <div className="flex gap-3 align-items-center">
          <Dropdown
            value={selectedCourse}
            options={courses}
            onChange={(e) => setSelectedCourse(e.value)}
            optionLabel="title"
            optionValue="id"
            placeholder="Tum Kurslar"
            showClear
            className="w-15rem"
          />
          <Calendar
            value={dateRange}
            onChange={(e) => setDateRange(e.value as Date[])}
            selectionMode="range"
            dateFormat="dd/mm/yy"
            placeholder="Tarih Araligi"
            showIcon
            className="w-15rem"
          />
          <Button
            icon="pi pi-refresh"
            onClick={loadReports}
            loading={isLoading}
            tooltip="Yenile"
          />
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid mb-4">
          <div className="col-12 md:col-6 lg:col-3">
            <SummaryCard
              title="Toplam Kayit"
              value={summary.totalEnrollments}
              subValue={
                <span className="flex align-items-center">
                  Bu donem: {summary.enrollmentsThisPeriod}
                  {getChangeIcon(summary.enrollmentsThisPeriod, summary.enrollmentsPreviousPeriod)}
                  <span className="text-500 ml-1">
                    {getChangePercent(summary.enrollmentsThisPeriod, summary.enrollmentsPreviousPeriod)}
                  </span>
                </span>
              }
              icon="pi pi-users"
              color="#6366f1"
            />
          </div>
          <div className="col-12 md:col-6 lg:col-3">
            <SummaryCard
              title="Tamamlanan"
              value={summary.totalCompletions}
              subValue={`%${summary.averageCompletionRate.toFixed(1)} tamamlanma orani`}
              icon="pi pi-check-circle"
              color="#22c55e"
            />
          </div>
          <div className="col-12 md:col-6 lg:col-3">
            <SummaryCard
              title="Toplam Gelir"
              value={formatCurrency(summary.totalRevenue)}
              subValue={
                <span className="flex align-items-center">
                  Bu donem: {formatCurrency(summary.revenueThisPeriod)}
                  {getChangeIcon(summary.revenueThisPeriod, summary.revenuePreviousPeriod)}
                </span>
              }
              icon="pi pi-wallet"
              color="#f59e0b"
            />
          </div>
          <div className="col-12 md:col-6 lg:col-3">
            <SummaryCard
              title="Izlenme Suresi"
              value={formatDuration(summary.totalWatchTimeMinutes)}
              subValue={`${summary.totalQuizAttempts} quiz denemesi`}
              icon="pi pi-clock"
              color="#8b5cf6"
            />
          </div>
        </div>
      )}

      {/* Report Tabs */}
      <TabView>
        {/* Enrollment Report */}
        <TabPanel header="Kayit Raporu" leftIcon="pi pi-user-plus mr-2">
          {enrollmentReport && (
            <div className="grid">
              <div className="col-12 lg:col-8">
                <Card title="Kayit Trendi">
                  <Chart type="line" data={enrollmentChartData} options={chartOptions} style={{ height: '300px' }} />
                </Card>
              </div>
              <div className="col-12 lg:col-4">
                <Card title="Durum Dagilimi">
                  <Chart type="doughnut" data={statusChartData} options={pieOptions} style={{ height: '300px' }} />
                </Card>
              </div>
              <div className="col-12 lg:col-6">
                <Card title="Kurs Bazli Kayitlar">
                  <DataTable value={enrollmentReport.byCourse} className="p-datatable-sm" scrollable scrollHeight="300px">
                    <Column field="courseTitle" header="Kurs" />
                    <Column field="enrollmentCount" header="Kayit" style={{ width: '80px' }} />
                    <Column field="completionCount" header="Tamamlanan" style={{ width: '100px' }} />
                    <Column
                      header="Ort. Ilerleme"
                      body={(row) => (
                        <div className="w-full">
                          <ProgressBar value={row.averageProgress} showValue={false} style={{ height: '8px' }} />
                          <span className="text-xs">{Math.round(row.averageProgress)}%</span>
                        </div>
                      )}
                      style={{ width: '120px' }}
                    />
                  </DataTable>
                </Card>
              </div>
              <div className="col-12 lg:col-6">
                <Card title="Son Kayitlar">
                  <DataTable value={enrollmentReport.items.slice(0, 10)} className="p-datatable-sm" scrollable scrollHeight="300px">
                    <Column field="userName" header="Kullanici" />
                    <Column field="courseTitle" header="Kurs" />
                    <Column
                      header="Durum"
                      body={(row) => (
                        <Tag
                          value={row.status}
                          severity={row.status === 'Tamamlandı' ? 'success' : row.status === 'Devam Ediyor' ? 'warning' : 'danger'}
                        />
                      )}
                      style={{ width: '120px' }}
                    />
                  </DataTable>
                </Card>
              </div>
            </div>
          )}
        </TabPanel>

        {/* Course Performance */}
        <TabPanel header="Kurs Performansi" leftIcon="pi pi-book mr-2">
          {coursePerformance && (
            <Card>
              <DataTable
                value={coursePerformance.items}
                className="p-datatable-sm"
                paginator
                rows={10}
                emptyMessage="Veri bulunamadi"
              >
                <Column field="title" header="Kurs" sortable style={{ minWidth: '200px' }} />
                <Column field="enrollmentCount" header="Kayit" sortable style={{ width: '80px' }} />
                <Column
                  header="Tamamlanma"
                  body={(row) => (
                    <Tag
                      value={`${Math.round(row.completionRate)}%`}
                      severity={row.completionRate > 70 ? 'success' : row.completionRate > 40 ? 'warning' : 'danger'}
                    />
                  )}
                  sortable
                  sortField="completionRate"
                  style={{ width: '100px' }}
                />
                <Column field="totalViews" header="Izlenme" sortable style={{ width: '90px' }} />
                <Column
                  header="Izlenme Suresi"
                  body={(row) => formatDuration(row.totalWatchTimeMinutes)}
                  sortable
                  sortField="totalWatchTimeMinutes"
                  style={{ width: '120px' }}
                />
                <Column
                  header="Puan"
                  body={(row) => (
                    <span className="flex align-items-center gap-1">
                      <i className="pi pi-star-fill text-yellow-500" />
                      {row.averageRating.toFixed(1)}
                    </span>
                  )}
                  sortable
                  sortField="averageRating"
                  style={{ width: '80px' }}
                />
                <Column
                  header="Gelir"
                  body={(row) => formatCurrency(row.revenue)}
                  sortable
                  sortField="revenue"
                  style={{ width: '120px' }}
                />
                <Column
                  header="Quiz Basari"
                  body={(row) => row.quizAttempts > 0 ? `%${Math.round(row.quizPassRate)}` : '-'}
                  sortable
                  sortField="quizPassRate"
                  style={{ width: '100px' }}
                />
              </DataTable>
            </Card>
          )}
        </TabPanel>

        {/* User Activity */}
        <TabPanel header="Kullanici Aktivitesi" leftIcon="pi pi-chart-line mr-2">
          {userActivity && (
            <div className="grid">
              <div className="col-12">
                <Card title="Gunluk Aktivite">
                  <Chart type="line" data={activityChartData} options={chartOptions} style={{ height: '300px' }} />
                </Card>
              </div>
              <div className="col-12">
                <Card title={`En Aktif Kullanicilar (${userActivity.totalActiveUsers} aktif)`}>
                  <DataTable
                    value={userActivity.items}
                    className="p-datatable-sm"
                    paginator
                    rows={10}
                    emptyMessage="Veri bulunamadi"
                  >
                    <Column field="userName" header="Kullanici" sortable style={{ minWidth: '150px' }} />
                    <Column field="userEmail" header="E-posta" style={{ minWidth: '200px' }} />
                    <Column field="enrollmentCount" header="Kayit" sortable style={{ width: '80px' }} />
                    <Column field="completedCourses" header="Tamamlanan" sortable style={{ width: '100px' }} />
                    <Column
                      header="Izlenme Suresi"
                      body={(row) => formatDuration(row.totalWatchTimeMinutes)}
                      sortable
                      sortField="totalWatchTimeMinutes"
                      style={{ width: '120px' }}
                    />
                    <Column field="quizAttempts" header="Quiz" sortable style={{ width: '80px' }} />
                    <Column
                      header="Son Aktivite"
                      body={(row) => row.lastActivityAt ? formatDate(row.lastActivityAt) : '-'}
                      sortable
                      sortField="lastActivityAt"
                      style={{ width: '120px' }}
                    />
                  </DataTable>
                </Card>
              </div>
            </div>
          )}
        </TabPanel>

        {/* Quiz Performance */}
        <TabPanel header="Quiz Performansi" leftIcon="pi pi-question-circle mr-2">
          {quizPerformance && (
            <div className="grid">
              <div className="col-12 lg:col-4">
                <Card title="Genel Basari Orani">
                  <Chart type="pie" data={quizChartData} options={pieOptions} style={{ height: '250px' }} />
                  <div className="text-center mt-3">
                    <div className="text-3xl font-bold text-primary">
                      %{quizPerformance.overallPassRate.toFixed(1)}
                    </div>
                    <div className="text-500">
                      {quizPerformance.totalAttempts} toplam deneme
                    </div>
                  </div>
                </Card>
              </div>
              <div className="col-12 lg:col-8">
                <Card title="Quiz Detaylari">
                  <DataTable
                    value={quizPerformance.items}
                    className="p-datatable-sm"
                    paginator
                    rows={10}
                    emptyMessage="Veri bulunamadi"
                  >
                    <Column field="quizTitle" header="Quiz" sortable style={{ minWidth: '150px' }} />
                    <Column field="courseTitle" header="Kurs" style={{ minWidth: '150px' }} />
                    <Column field="totalAttempts" header="Deneme" sortable style={{ width: '80px' }} />
                    <Column
                      header="Basarili"
                      body={(row) => <Tag value={row.passedCount} severity="success" />}
                      sortable
                      sortField="passedCount"
                      style={{ width: '80px' }}
                    />
                    <Column
                      header="Basarisiz"
                      body={(row) => <Tag value={row.failedCount} severity="danger" />}
                      sortable
                      sortField="failedCount"
                      style={{ width: '80px' }}
                    />
                    <Column
                      header="Basari Orani"
                      body={(row) => (
                        <Tag
                          value={`%${Math.round(row.passRate)}`}
                          severity={row.passRate > 70 ? 'success' : row.passRate > 50 ? 'warning' : 'danger'}
                        />
                      )}
                      sortable
                      sortField="passRate"
                      style={{ width: '100px' }}
                    />
                    <Column
                      header="Ort. Puan"
                      body={(row) => `${Math.round(row.averageScore)}`}
                      sortable
                      sortField="averageScore"
                      style={{ width: '90px' }}
                    />
                    <Column
                      header="Ort. Sure"
                      body={(row) => {
                        const mins = Math.floor(row.averageTimeSeconds / 60);
                        const secs = row.averageTimeSeconds % 60;
                        return `${mins}:${secs.toString().padStart(2, '0')}`;
                      }}
                      sortable
                      sortField="averageTimeSeconds"
                      style={{ width: '90px' }}
                    />
                  </DataTable>
                </Card>
              </div>
            </div>
          )}
        </TabPanel>
      </TabView>
    </AdminLayout>
  );
}
