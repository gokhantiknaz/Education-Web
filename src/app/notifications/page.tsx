'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { MultiSelect } from 'primereact/multiselect';
import { Calendar } from 'primereact/calendar';
import { Card } from 'primereact/card';
import api, { ApiResponse } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config';
import {
  NotificationBatch,
  NotificationStats,
  SendNotificationRequest,
  RecipientType,
  Course,
  User,
} from '@/types';

export default function NotificationsPage() {
  const [batches, setBatches] = useState<NotificationBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [sendDialog, setSendDialog] = useState(false);
  const [sending, setSending] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const toast = useRef<Toast>(null);

  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    page: 1,
  });

  const [notificationForm, setNotificationForm] = useState<SendNotificationRequest>({
    title: '',
    message: '',
    type: 'Info',
    recipientType: 'All',
    sendPush: false,
  });

  const notificationTypes = [
    { label: 'Bilgi', value: 'Info' },
    { label: 'Başarı', value: 'Success' },
    { label: 'Uyarı', value: 'Warning' },
    { label: 'Yeni Kurs', value: 'NewCourse' },
    { label: 'Duyuru', value: 'Announcement' },
  ];

  const recipientTypes = [
    { label: 'Tüm Kullanıcılar', value: 'All' },
    { label: 'Role Göre', value: 'Role' },
    { label: 'Belirli Kullanıcılar', value: 'SpecificUsers' },
  ];

  const roleOptions = [
    { label: 'Öğrenci', value: 'Student' },
    { label: 'Yönetici', value: 'Admin' },
    { label: 'İçerik Yöneticisi', value: 'ContentManager' },
  ];

  useEffect(() => {
    loadBatches();
    loadStats();
    loadCourses();
    loadUsers();
  }, [lazyState]);

  const loadBatches = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<{ items: NotificationBatch[]; pagination: { totalItems: number } }>>(
        `${API_ENDPOINTS.NOTIFICATION_BATCHES}?page=${lazyState.page}&pageSize=${lazyState.rows}`
      );
      setBatches(response.data.data.items || []);
      setTotalRecords(response.data.data.pagination?.totalItems || 0);
    } catch (error) {
      console.error('Batches load error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Bildirimler yüklenemedi',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get<ApiResponse<NotificationStats>>(API_ENDPOINTS.NOTIFICATION_STATS);
      setStats(response.data.data);
    } catch (error) {
      console.error('Stats load error:', error);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await api.get<ApiResponse<{ items: Course[] }>>('/web/courses?pageSize=100');
      setCourses(response.data.data.items || []);
    } catch (error) {
      console.error('Courses load error:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get<ApiResponse<{ items: User[] }>>('/web/users?pageSize=100');
      setUsers(response.data.data.items || []);
    } catch (error) {
      console.error('Users load error:', error);
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

  const openSendDialog = () => {
    setNotificationForm({
      title: '',
      message: '',
      type: 'Info',
      recipientType: 'All',
      sendPush: false,
    });
    setSendDialog(true);
  };

  const sendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Uyarı',
        detail: 'Başlık ve mesaj zorunludur',
      });
      return;
    }

    if (notificationForm.recipientType === 'Role' && !notificationForm.targetRole) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Uyarı',
        detail: 'Lütfen bir rol seçin',
      });
      return;
    }

    if (notificationForm.recipientType === 'SpecificUsers' && (!notificationForm.targetUserIds || notificationForm.targetUserIds.length === 0)) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Uyarı',
        detail: 'Lütfen en az bir kullanıcı seçin',
      });
      return;
    }

    setSending(true);
    try {
      await api.post(API_ENDPOINTS.NOTIFICATIONS_SEND, notificationForm);
      toast.current?.show({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Bildirim başarıyla gönderildi',
      });
      setSendDialog(false);
      loadBatches();
      loadStats();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Bildirim gönderilemedi';
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: message,
      });
    } finally {
      setSending(false);
    }
  };

  const confirmResend = (batch: NotificationBatch) => {
    confirmDialog({
      message: `"${batch.title}" bildirimini tekrar göndermek istediğinize emin misiniz?`,
      header: 'Onay',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet',
      rejectLabel: 'Hayır',
      accept: () => resendNotification(batch),
    });
  };

  const resendNotification = async (batch: NotificationBatch) => {
    try {
      await api.post(API_ENDPOINTS.NOTIFICATION_BATCH_RESEND(batch.id), { sendPush: batch.sendPush });
      toast.current?.show({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Bildirim tekrar gönderildi',
      });
      loadBatches();
      loadStats();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'İşlem başarısız oldu',
      });
    }
  };

  const statusBodyTemplate = (rowData: NotificationBatch) => {
    const statusColors: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      Completed: 'success',
      Processing: 'info',
      Pending: 'warning',
      Failed: 'danger',
    };
    const statusLabels: Record<string, string> = {
      Completed: 'Tamamlandı',
      Processing: 'İşleniyor',
      Pending: 'Bekliyor',
      Failed: 'Başarısız',
    };
    return <Tag value={statusLabels[rowData.status] || rowData.status} severity={statusColors[rowData.status] || 'info'} />;
  };

  const recipientTypeBodyTemplate = (rowData: NotificationBatch) => {
    const labels: Record<string, string> = {
      All: 'Tüm Kullanıcılar',
      Role: rowData.targetRole || 'Role Göre',
      SpecificUsers: 'Belirli Kullanıcılar',
    };
    return <span>{labels[rowData.recipientType] || rowData.recipientType}</span>;
  };

  const typeBodyTemplate = (rowData: NotificationBatch) => {
    const typeColors: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'secondary'> = {
      Info: 'info',
      Success: 'success',
      Warning: 'warning',
      NewCourse: 'secondary',
      Announcement: 'danger',
    };
    return <Tag value={rowData.type || 'Info'} severity={typeColors[rowData.type || 'Info'] || 'info'} />;
  };

  const pushBodyTemplate = (rowData: NotificationBatch) => {
    return rowData.sendPush ? (
      <i className="pi pi-check-circle text-green-500" />
    ) : (
      <i className="pi pi-times-circle text-gray-400" />
    );
  };

  const actionsBodyTemplate = (rowData: NotificationBatch) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-refresh"
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => confirmResend(rowData)}
          tooltip="Tekrar Gönder"
        />
      </div>
    );
  };

  const header = (
    <div className="flex justify-content-between align-items-center">
      <h5 className="m-0">Bildirim Geçmişi</h5>
      <Button
        label="Bildirim Gönder"
        icon="pi pi-send"
        className="p-button-success"
        onClick={openSendDialog}
      />
    </div>
  );

  return (
    <AdminLayout>
      <Toast ref={toast} />
      <ConfirmDialog />

      {/* Stats Cards */}
      {stats && (
        <div className="grid mb-4">
          <div className="col-12 md:col-3">
            <Card className="h-full">
              <div className="flex align-items-center">
                <div className="flex-1">
                  <span className="text-500 font-medium">Toplam Gönderilen</span>
                  <div className="text-900 font-bold text-2xl mt-2">{stats.totalSent}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-send text-blue-500 text-xl" />
                </div>
              </div>
            </Card>
          </div>
          <div className="col-12 md:col-3">
            <Card className="h-full">
              <div className="flex align-items-center">
                <div className="flex-1">
                  <span className="text-500 font-medium">Okunma Oranı</span>
                  <div className="text-900 font-bold text-2xl mt-2">%{stats.readRate}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-green-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-eye text-green-500 text-xl" />
                </div>
              </div>
            </Card>
          </div>
          <div className="col-12 md:col-3">
            <Card className="h-full">
              <div className="flex align-items-center">
                <div className="flex-1">
                  <span className="text-500 font-medium">Push Gönderilen</span>
                  <div className="text-900 font-bold text-2xl mt-2">{stats.totalPushSent}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-mobile text-purple-500 text-xl" />
                </div>
              </div>
            </Card>
          </div>
          <div className="col-12 md:col-3">
            <Card className="h-full">
              <div className="flex align-items-center">
                <div className="flex-1">
                  <span className="text-500 font-medium">Zamanlanmış</span>
                  <div className="text-900 font-bold text-2xl mt-2">{stats.pendingScheduled}</div>
                </div>
                <div className="flex align-items-center justify-content-center bg-orange-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                  <i className="pi pi-clock text-orange-500 text-xl" />
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Batches Table */}
      <div className="card">
        <DataTable
          value={batches}
          lazy
          paginator
          first={lazyState.first}
          rows={lazyState.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          header={header}
          emptyMessage="Bildirim bulunamadı"
          rowsPerPageOptions={[10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="{first} - {last} / {totalRecords}"
        >
          <Column field="title" header="Başlık" sortable style={{ maxWidth: '200px' }} />
          <Column field="message" header="Mesaj" style={{ maxWidth: '250px' }} body={(row) => (
            <span className="text-overflow-ellipsis overflow-hidden white-space-nowrap block" style={{ maxWidth: '250px' }}>
              {row.message}
            </span>
          )} />
          <Column field="type" header="Tip" body={typeBodyTemplate} style={{ width: '100px' }} />
          <Column field="recipientType" header="Alıcı" body={recipientTypeBodyTemplate} style={{ width: '150px' }} />
          <Column field="totalRecipients" header="Alıcı Sayısı" sortable style={{ width: '100px' }} />
          <Column field="sendPush" header="Push" body={pushBodyTemplate} style={{ width: '70px' }} />
          <Column field="status" header="Durum" body={statusBodyTemplate} style={{ width: '100px' }} />
          <Column
            field="createdAt"
            header="Tarih"
            sortable
            style={{ width: '150px' }}
            body={(row) => new Date(row.createdAt).toLocaleString('tr-TR')}
          />
          <Column body={actionsBodyTemplate} header="İşlemler" style={{ width: '80px' }} />
        </DataTable>
      </div>

      {/* Send Notification Dialog */}
      <Dialog
        visible={sendDialog}
        style={{ width: '600px' }}
        header="Bildirim Gönder"
        modal
        onHide={() => setSendDialog(false)}
        footer={
          <div>
            <Button
              label="İptal"
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setSendDialog(false)}
            />
            <Button
              label="Gönder"
              icon="pi pi-send"
              onClick={sendNotification}
              loading={sending}
            />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="field mb-3">
            <label htmlFor="title" className="font-bold">Başlık *</label>
            <InputText
              id="title"
              value={notificationForm.title}
              onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
              placeholder="Bildirim başlığı"
            />
          </div>

          <div className="field mb-3">
            <label htmlFor="message" className="font-bold">Mesaj *</label>
            <InputTextarea
              id="message"
              value={notificationForm.message}
              onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
              placeholder="Bildirim mesajı"
              rows={4}
            />
          </div>

          <div className="field mb-3">
            <label htmlFor="type" className="font-bold">Tip</label>
            <Dropdown
              id="type"
              value={notificationForm.type}
              options={notificationTypes}
              onChange={(e) => setNotificationForm({ ...notificationForm, type: e.value })}
              placeholder="Tip Seçin"
            />
          </div>

          <div className="field mb-3">
            <label htmlFor="recipientType" className="font-bold">Alıcı Tipi</label>
            <Dropdown
              id="recipientType"
              value={notificationForm.recipientType}
              options={recipientTypes}
              onChange={(e) => setNotificationForm({
                ...notificationForm,
                recipientType: e.value,
                targetRole: undefined,
                targetUserIds: undefined,
              })}
              placeholder="Alıcı Tipi Seçin"
            />
          </div>

          {notificationForm.recipientType === 'Role' && (
            <div className="field mb-3">
              <label htmlFor="targetRole" className="font-bold">Rol</label>
              <Dropdown
                id="targetRole"
                value={notificationForm.targetRole}
                options={roleOptions}
                onChange={(e) => setNotificationForm({ ...notificationForm, targetRole: e.value })}
                placeholder="Rol Seçin"
              />
            </div>
          )}

          {notificationForm.recipientType === 'SpecificUsers' && (
            <div className="field mb-3">
              <label htmlFor="targetUserIds" className="font-bold">Kullanıcılar</label>
              <MultiSelect
                id="targetUserIds"
                value={notificationForm.targetUserIds}
                options={users.map(u => ({ label: `${u.firstName} ${u.lastName} (${u.email})`, value: u.id }))}
                onChange={(e) => setNotificationForm({ ...notificationForm, targetUserIds: e.value })}
                placeholder="Kullanıcı Seçin"
                filter
                display="chip"
                maxSelectedLabels={3}
              />
            </div>
          )}

          <div className="field mb-3">
            <label htmlFor="relatedCourseId" className="font-bold">İlgili Kurs (Opsiyonel)</label>
            <Dropdown
              id="relatedCourseId"
              value={notificationForm.relatedCourseId}
              options={courses.map(c => ({ label: c.title, value: c.id }))}
              onChange={(e) => setNotificationForm({ ...notificationForm, relatedCourseId: e.value })}
              placeholder="Kurs Seçin"
              showClear
              filter
            />
          </div>

          <div className="field mb-3">
            <label htmlFor="scheduledAt" className="font-bold">Zamanla (Opsiyonel)</label>
            <Calendar
              id="scheduledAt"
              value={notificationForm.scheduledAt ? new Date(notificationForm.scheduledAt) : null}
              onChange={(e) => setNotificationForm({
                ...notificationForm,
                scheduledAt: e.value ? (e.value as Date).toISOString() : undefined
              })}
              showTime
              hourFormat="24"
              dateFormat="dd/mm/yy"
              placeholder="Hemen gönder"
              minDate={new Date()}
            />
          </div>

          <div className="field-checkbox mb-3">
            <Checkbox
              inputId="sendPush"
              checked={notificationForm.sendPush}
              onChange={(e) => setNotificationForm({ ...notificationForm, sendPush: e.checked ?? false })}
            />
            <label htmlFor="sendPush" className="ml-2">Push bildirim gönder</label>
          </div>

          <div className="field mb-3">
            <label htmlFor="actionUrl" className="font-bold">Aksiyon URL (Opsiyonel)</label>
            <InputText
              id="actionUrl"
              value={notificationForm.actionUrl || ''}
              onChange={(e) => setNotificationForm({ ...notificationForm, actionUrl: e.target.value })}
              placeholder="/courses/slug"
            />
          </div>
        </div>
      </Dialog>
    </AdminLayout>
  );
}
