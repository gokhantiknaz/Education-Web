'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { DataTable, DataTableFilterMeta } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { ProgressBar } from 'primereact/progressbar';
import { FilterMatchMode } from 'primereact/api';
import api, { ApiResponse } from '@/lib/api';
import { Enrollment, Course, User, CreateEnrollmentRequest } from '@/types';

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [detailDialog, setDetailDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  // Filter states
  const [filterCourseId, setFilterCourseId] = useState<string | null>(null);
  const [filterIsActive, setFilterIsActive] = useState<boolean | null>(null);
  const [filterIsCompleted, setFilterIsCompleted] = useState<boolean | null>(null);

  // For create dialog
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [newEnrollment, setNewEnrollment] = useState<CreateEnrollmentRequest>({
    userId: '',
    courseId: '',
    expiresAt: undefined,
  });

  const toast = useRef<Toast>(null);

  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    page: 1,
  });

  const [filters, setFilters] = useState<DataTableFilterMeta>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  });

  useEffect(() => {
    loadEnrollments();
  }, [lazyState, filterCourseId, filterIsActive, filterIsCompleted]);

  useEffect(() => {
    loadCoursesAndUsers();
  }, []);

  const loadEnrollments = async () => {
    setLoading(true);
    try {
      let url = `/web/enrollments?pageNumber=${lazyState.page}&pageSize=${lazyState.rows}`;
      if (globalFilterValue) url += `&search=${encodeURIComponent(globalFilterValue)}`;
      if (filterCourseId) url += `&courseId=${filterCourseId}`;
      if (filterIsActive !== null) url += `&isActive=${filterIsActive}`;
      if (filterIsCompleted !== null) url += `&isCompleted=${filterIsCompleted}`;

      const response = await api.get<ApiResponse<{ items: Enrollment[]; pagination: { totalItems: number } }>>(url);
      setEnrollments(response.data.data.items || []);
      setTotalRecords(response.data.data.pagination?.totalItems || 0);
    } catch (error) {
      console.error('Enrollments load error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Kayıtlar yüklenemedi',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCoursesAndUsers = async () => {
    try {
      const [coursesRes, usersRes] = await Promise.all([
        api.get<ApiResponse<{ items: Course[] }>>('/web/courses?pageSize=1000'),
        api.get<ApiResponse<{ items: User[] }>>('/web/users?pageSize=1000'),
      ]);
      setCourses(coursesRes.data.data.items || []);
      setUsers(usersRes.data.data.items || []);
    } catch (error) {
      console.error('Courses/Users load error:', error);
    }
  };

  const onPage = (event: { first: number; rows: number; page?: number }) => {
    setLazyState({
      ...lazyState,
      first: event.first,
      rows: event.rows,
      page: (event.page ?? 0) + 1,
    });
  };

  const onGlobalFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGlobalFilterValue(value);
  };

  const onSearch = () => {
    setLazyState({ ...lazyState, first: 0, page: 1 });
    loadEnrollments();
  };

  const confirmDelete = (enrollment: Enrollment) => {
    confirmDialog({
      message: `${enrollment.userName} kullanıcısının "${enrollment.courseTitle}" kursundaki kaydını silmek istediğinize emin misiniz?`,
      header: 'Silme Onayı',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet, Sil',
      rejectLabel: 'Hayır',
      acceptClassName: 'p-button-danger',
      accept: () => deleteEnrollment(enrollment.id),
    });
  };

  const deleteEnrollment = async (id: string) => {
    try {
      await api.delete(`/web/enrollments/${id}`);
      toast.current?.show({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Kayıt silindi',
      });
      loadEnrollments();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Kayıt silinemedi',
      });
    }
  };

  const confirmToggleActive = (enrollment: Enrollment) => {
    confirmDialog({
      message: `Bu kaydı ${enrollment.isActive ? 'pasif' : 'aktif'} yapmak istediğinize emin misiniz?`,
      header: 'Onay',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet',
      rejectLabel: 'Hayır',
      accept: () => toggleEnrollmentActive(enrollment),
    });
  };

  const toggleEnrollmentActive = async (enrollment: Enrollment) => {
    try {
      const endpoint = enrollment.isActive
        ? `/web/enrollments/${enrollment.id}/deactivate`
        : `/web/enrollments/${enrollment.id}/activate`;
      await api.put(endpoint);
      toast.current?.show({
        severity: 'success',
        summary: 'Başarılı',
        detail: `Kayıt başarıyla ${enrollment.isActive ? 'pasif' : 'aktif'} yapıldı`,
      });
      loadEnrollments();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'İşlem başarısız oldu',
      });
    }
  };

  const openCreateDialog = () => {
    setNewEnrollment({
      userId: '',
      courseId: '',
      expiresAt: undefined,
    });
    setCreateDialog(true);
  };

  const createEnrollment = async () => {
    if (!newEnrollment.userId || !newEnrollment.courseId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Uyarı',
        detail: 'Lütfen kullanıcı ve kurs seçin',
      });
      return;
    }

    setSaving(true);
    try {
      await api.post('/web/enrollments', newEnrollment);
      toast.current?.show({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Kayıt başarıyla oluşturuldu',
      });
      setCreateDialog(false);
      loadEnrollments();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Kayıt oluşturulamadı';
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: message,
      });
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setFilterCourseId(null);
    setFilterIsActive(null);
    setFilterIsCompleted(null);
    setGlobalFilterValue('');
    setLazyState({ ...lazyState, first: 0, page: 1 });
  };

  const statusBodyTemplate = (rowData: Enrollment) => {
    return (
      <Tag
        value={rowData.isActive ? 'Aktif' : 'Pasif'}
        severity={rowData.isActive ? 'success' : 'danger'}
      />
    );
  };

  const progressBodyTemplate = (rowData: Enrollment) => {
    const isCompleted = rowData.completedAt !== null;
    return (
      <div className="flex flex-column gap-1">
        <ProgressBar
          value={rowData.progressPercentage}
          showValue={false}
          style={{ height: '8px' }}
          className={isCompleted ? 'progress-completed' : ''}
        />
        <span className="text-sm text-500">
          %{rowData.progressPercentage.toFixed(0)}
          {isCompleted && <i className="pi pi-check-circle text-green-500 ml-2" />}
        </span>
      </div>
    );
  };

  const userBodyTemplate = (rowData: Enrollment) => {
    return (
      <div className="flex align-items-center gap-2">
        {rowData.userProfileImage ? (
          <img
            src={rowData.userProfileImage}
            alt={rowData.userName}
            className="border-circle"
            style={{ width: '32px', height: '32px', objectFit: 'cover' }}
          />
        ) : (
          <div
            className="border-circle flex align-items-center justify-content-center"
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#6366f1',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '0.75rem'
            }}
          >
            {rowData.userName.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="flex flex-column">
          <span className="font-medium">{rowData.userName}</span>
          <span className="text-xs text-500">{rowData.userEmail}</span>
        </div>
      </div>
    );
  };

  const courseBodyTemplate = (rowData: Enrollment) => {
    return (
      <div className="flex align-items-center gap-2">
        {rowData.courseThumbnail ? (
          <img
            src={rowData.courseThumbnail}
            alt={rowData.courseTitle}
            className="border-round"
            style={{ width: '48px', height: '32px', objectFit: 'cover' }}
          />
        ) : (
          <div
            className="border-round flex align-items-center justify-content-center"
            style={{
              width: '48px',
              height: '32px',
              backgroundColor: '#e0e0e0',
            }}
          >
            <i className="pi pi-book text-500" />
          </div>
        )}
        <span className="font-medium">{rowData.courseTitle}</span>
      </div>
    );
  };

  const actionsBodyTemplate = (rowData: Enrollment) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => {
            setSelectedEnrollment(rowData);
            setDetailDialog(true);
          }}
          tooltip="Detay"
        />
        <Button
          icon={rowData.isActive ? 'pi pi-ban' : 'pi pi-check'}
          className={`p-button-rounded p-button-text ${rowData.isActive ? 'p-button-warning' : 'p-button-success'}`}
          onClick={() => confirmToggleActive(rowData)}
          tooltip={rowData.isActive ? 'Pasif Yap' : 'Aktif Yap'}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => confirmDelete(rowData)}
          tooltip="Sil"
        />
      </div>
    );
  };

  const activeOptions = [
    { label: 'Tümü', value: null },
    { label: 'Aktif', value: true },
    { label: 'Pasif', value: false },
  ];

  const completedOptions = [
    { label: 'Tümü', value: null },
    { label: 'Tamamlandı', value: true },
    { label: 'Devam Ediyor', value: false },
  ];

  const header = (
    <div className="flex flex-column gap-3">
      <div className="flex justify-content-between align-items-center">
        <h5 className="m-0">Kurs Kayıtları</h5>
        <Button
          label="Yeni Kayıt"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={openCreateDialog}
        />
      </div>
      <div className="flex flex-wrap gap-2 align-items-center">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Ara..."
            style={{ width: '200px' }}
          />
        </span>
        <Dropdown
          value={filterCourseId}
          options={courses.map(c => ({ label: c.title, value: c.id }))}
          onChange={(e) => setFilterCourseId(e.value)}
          placeholder="Kurs Seç"
          showClear
          filter
          style={{ width: '200px' }}
        />
        <Dropdown
          value={filterIsActive}
          options={activeOptions}
          onChange={(e) => setFilterIsActive(e.value)}
          placeholder="Durum"
          style={{ width: '120px' }}
        />
        <Dropdown
          value={filterIsCompleted}
          options={completedOptions}
          onChange={(e) => setFilterIsCompleted(e.value)}
          placeholder="İlerleme"
          style={{ width: '140px' }}
        />
        <Button
          icon="pi pi-filter-slash"
          className="p-button-outlined"
          onClick={clearFilters}
          tooltip="Filtreleri Temizle"
        />
      </div>
    </div>
  );

  return (
    <AdminLayout>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={enrollments}
          lazy
          paginator
          first={lazyState.first}
          rows={lazyState.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          header={header}
          filters={filters}
          emptyMessage="Kayıt bulunamadı"
          rowsPerPageOptions={[10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="{first} - {last} / {totalRecords}"
        >
          <Column header="Kullanıcı" body={userBodyTemplate} style={{ minWidth: '200px' }} />
          <Column header="Kurs" body={courseBodyTemplate} style={{ minWidth: '200px' }} />
          <Column header="İlerleme" body={progressBodyTemplate} style={{ minWidth: '120px' }} />
          <Column header="Durum" body={statusBodyTemplate} style={{ width: '100px' }} />
          <Column
            field="enrolledAt"
            header="Kayıt Tarihi"
            body={(rowData) => new Date(rowData.enrolledAt).toLocaleDateString('tr-TR')}
            style={{ width: '120px' }}
          />
          <Column
            field="lastAccessedAt"
            header="Son Erişim"
            body={(rowData) => rowData.lastAccessedAt
              ? new Date(rowData.lastAccessedAt).toLocaleDateString('tr-TR')
              : '-'
            }
            style={{ width: '120px' }}
          />
          <Column body={actionsBodyTemplate} header="İşlemler" style={{ width: '140px' }} />
        </DataTable>
      </div>

      {/* Enrollment Detail Dialog */}
      <Dialog
        visible={detailDialog}
        style={{ width: '550px' }}
        header="Kayıt Detayı"
        modal
        onHide={() => setDetailDialog(false)}
      >
        {selectedEnrollment && (
          <div className="flex flex-column gap-4">
            {/* User Section */}
            <div className="surface-100 border-round p-3">
              <h4 className="mt-0 mb-3 text-600 text-sm font-semibold uppercase">
                <i className="pi pi-user mr-2"></i>Kullanıcı
              </h4>
              <div className="flex align-items-center gap-3">
                {selectedEnrollment.userProfileImage ? (
                  <img
                    src={selectedEnrollment.userProfileImage}
                    alt={selectedEnrollment.userName}
                    className="border-circle"
                    style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="border-circle flex align-items-center justify-content-center"
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#6366f1',
                      color: 'white',
                      fontWeight: 'bold',
                    }}
                  >
                    {selectedEnrollment.userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="font-bold">{selectedEnrollment.userName}</div>
                  <div className="text-500 text-sm">{selectedEnrollment.userEmail}</div>
                </div>
              </div>
            </div>

            {/* Course Section */}
            <div className="surface-100 border-round p-3">
              <h4 className="mt-0 mb-3 text-600 text-sm font-semibold uppercase">
                <i className="pi pi-book mr-2"></i>Kurs
              </h4>
              <div className="flex align-items-center gap-3">
                {selectedEnrollment.courseThumbnail ? (
                  <img
                    src={selectedEnrollment.courseThumbnail}
                    alt={selectedEnrollment.courseTitle}
                    className="border-round"
                    style={{ width: '80px', height: '50px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="border-round flex align-items-center justify-content-center"
                    style={{
                      width: '80px',
                      height: '50px',
                      backgroundColor: '#e0e0e0',
                    }}
                  >
                    <i className="pi pi-book text-500 text-2xl" />
                  </div>
                )}
                <div className="font-bold">{selectedEnrollment.courseTitle}</div>
              </div>
            </div>

            {/* Progress Section */}
            <div className="surface-100 border-round p-3">
              <h4 className="mt-0 mb-3 text-600 text-sm font-semibold uppercase">
                <i className="pi pi-chart-line mr-2"></i>İlerleme
              </h4>
              <div className="mb-3">
                <ProgressBar value={selectedEnrollment.progressPercentage} style={{ height: '12px' }} />
                <div className="flex justify-content-between mt-2">
                  <span className="text-500">%{selectedEnrollment.progressPercentage.toFixed(1)}</span>
                  {selectedEnrollment.completedAt && (
                    <Tag value="Tamamlandı" severity="success" icon="pi pi-check" />
                  )}
                </div>
              </div>
              {selectedEnrollment.hasCertificate && (
                <div className="flex align-items-center gap-2 text-green-600">
                  <i className="pi pi-verified" />
                  <span>Sertifika verildi</span>
                </div>
              )}
            </div>

            {/* Dates Section */}
            <div className="grid">
              <div className="col-6">
                <div className="surface-100 border-round p-3 h-full">
                  <span className="text-500 text-sm block mb-1">Kayıt Tarihi</span>
                  <span className="font-medium">
                    {new Date(selectedEnrollment.enrolledAt).toLocaleDateString('tr-TR', {
                      day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
              <div className="col-6">
                <div className="surface-100 border-round p-3 h-full">
                  <span className="text-500 text-sm block mb-1">Son Erişim</span>
                  <span className="font-medium">
                    {selectedEnrollment.lastAccessedAt
                      ? new Date(selectedEnrollment.lastAccessedAt).toLocaleDateString('tr-TR', {
                          day: 'numeric', month: 'long', year: 'numeric'
                        })
                      : '-'
                    }
                  </span>
                </div>
              </div>
              {selectedEnrollment.expiresAt && (
                <div className="col-6">
                  <div className="surface-100 border-round p-3 h-full">
                    <span className="text-500 text-sm block mb-1">Bitiş Tarihi</span>
                    <span className="font-medium">
                      {new Date(selectedEnrollment.expiresAt).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}
              {selectedEnrollment.completedAt && (
                <div className="col-6">
                  <div className="surface-100 border-round p-3 h-full">
                    <span className="text-500 text-sm block mb-1">Tamamlanma</span>
                    <span className="font-medium">
                      {new Date(selectedEnrollment.completedAt).toLocaleDateString('tr-TR', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div className="flex align-items-center gap-2">
              <span className="text-500">Durum:</span>
              <Tag
                value={selectedEnrollment.isActive ? 'Aktif' : 'Pasif'}
                severity={selectedEnrollment.isActive ? 'success' : 'danger'}
              />
            </div>
          </div>
        )}
      </Dialog>

      {/* Create Enrollment Dialog */}
      <Dialog
        visible={createDialog}
        style={{ width: '500px' }}
        header="Yeni Kurs Kaydı"
        modal
        onHide={() => setCreateDialog(false)}
        footer={
          <div>
            <Button
              label="İptal"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setCreateDialog(false)}
            />
            <Button
              label="Kaydet"
              icon="pi pi-check"
              onClick={createEnrollment}
              loading={saving}
            />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="field mb-3">
            <label htmlFor="userId" className="font-bold">Kullanıcı *</label>
            <Dropdown
              id="userId"
              value={newEnrollment.userId}
              options={users.map(u => ({
                label: `${u.firstName} ${u.lastName} (${u.email})`,
                value: u.id
              }))}
              onChange={(e) => setNewEnrollment({ ...newEnrollment, userId: e.value })}
              placeholder="Kullanıcı Seçin"
              filter
              showClear
            />
          </div>
          <div className="field mb-3">
            <label htmlFor="courseId" className="font-bold">Kurs *</label>
            <Dropdown
              id="courseId"
              value={newEnrollment.courseId}
              options={courses.map(c => ({
                label: c.title,
                value: c.id
              }))}
              onChange={(e) => setNewEnrollment({ ...newEnrollment, courseId: e.value })}
              placeholder="Kurs Seçin"
              filter
              showClear
            />
          </div>
          <div className="field mb-3">
            <label htmlFor="expiresAt" className="font-bold">Bitiş Tarihi (Opsiyonel)</label>
            <Calendar
              id="expiresAt"
              value={newEnrollment.expiresAt ? new Date(newEnrollment.expiresAt) : null}
              onChange={(e) => setNewEnrollment({
                ...newEnrollment,
                expiresAt: e.value ? (e.value as Date).toISOString() : undefined
              })}
              showIcon
              dateFormat="dd/mm/yy"
              minDate={new Date()}
              placeholder="Tarih Seçin"
            />
            <small className="text-500">Boş bırakılırsa süresiz erişim verilir</small>
          </div>
        </div>
      </Dialog>
    </AdminLayout>
  );
}
