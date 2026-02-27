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
import { FilterMatchMode } from 'primereact/api';
import api, { ApiResponse } from '@/lib/api';
import { User, CreateUserRequest } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDialog, setUserDialog] = useState(false);
  const [createDialog, setCreateDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newUser, setNewUser] = useState<CreateUserRequest>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'Student',
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
    loadUsers();
  }, [lazyState]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<{ items: User[]; totalCount: number }>>(
        `/web/users?pageNumber=${lazyState.page}&pageSize=${lazyState.rows}`
      );
      setUsers(response.data.data.items || []);
      setTotalRecords(response.data.data.totalCount || 0);
    } catch (error) {
      console.error('Users load error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Kullanıcılar yüklenemedi',
      });
    } finally {
      setLoading(false);
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
    const _filters = { ...filters };
    (_filters['global'] as { value: string | null }).value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  const confirmToggleActive = (user: User) => {
    confirmDialog({
      message: `${user.firstName} ${user.lastName} kullanıcısını ${user.isActive ? 'pasif' : 'aktif'} yapmak istediğinize emin misiniz?`,
      header: 'Onay',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Evet',
      rejectLabel: 'Hayır',
      accept: () => toggleUserActive(user),
    });
  };

  const toggleUserActive = async (user: User) => {
    try {
      const endpoint = user.isActive
        ? `/web/users/${user.id}/deactivate`
        : `/web/users/${user.id}/activate`;
      await api.put(endpoint);
      toast.current?.show({
        severity: 'success',
        summary: 'Başarılı',
        detail: `Kullanıcı başarıyla ${user.isActive ? 'pasif' : 'aktif'} yapıldı`,
      });
      loadUsers();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'İşlem başarısız oldu',
      });
    }
  };

  const roleOptions = [
    { label: 'Öğrenci', value: 'Student' },
    { label: 'Yönetici', value: 'Admin' },
    { label: 'İçerik Yöneticisi', value: 'ContentManager' },
  ];

  const openCreateDialog = () => {
    setNewUser({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      role: 'Student',
    });
    setCreateDialog(true);
  };

  const createUser = async () => {
    if (!newUser.firstName || !newUser.lastName || !newUser.email || !newUser.password) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Uyarı',
        detail: 'Lütfen zorunlu alanları doldurun',
      });
      return;
    }

    if (newUser.password.length < 8) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Uyarı',
        detail: 'Şifre en az 8 karakter olmalıdır',
      });
      return;
    }

    setSaving(true);
    try {
      await api.post('/web/users', newUser);
      toast.current?.show({
        severity: 'success',
        summary: 'Başarılı',
        detail: 'Kullanıcı başarıyla oluşturuldu',
      });
      setCreateDialog(false);
      loadUsers();
    } catch (error: any) {
      const message = error.response?.data?.message || 'Kullanıcı oluşturulamadı';
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: message,
      });
    } finally {
      setSaving(false);
    }
  };

  const roleBodyTemplate = (rowData: User) => {
    const roleColors: Record<string, 'success' | 'info' | 'warning' | 'danger'> = {
      Admin: 'danger',
      ContentManager: 'warning',
      Student: 'info',
    };
    return <Tag value={rowData.role} severity={roleColors[rowData.role] || 'info'} />;
  };

  const statusBodyTemplate = (rowData: User) => {
    return (
      <Tag
        value={rowData.isActive ? 'Aktif' : 'Pasif'}
        severity={rowData.isActive ? 'success' : 'danger'}
      />
    );
  };

  const actionsBodyTemplate = (rowData: User) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => {
            setSelectedUser(rowData);
            setUserDialog(true);
          }}
          tooltip="Detay"
        />
        <Button
          icon={rowData.isActive ? 'pi pi-ban' : 'pi pi-check'}
          className={`p-button-rounded p-button-text ${rowData.isActive ? 'p-button-danger' : 'p-button-success'}`}
          onClick={() => confirmToggleActive(rowData)}
          tooltip={rowData.isActive ? 'Pasif Yap' : 'Aktif Yap'}
        />
      </div>
    );
  };

  const header = (
    <div className="flex justify-content-between align-items-center">
      <h5 className="m-0">Kullanıcılar</h5>
      <div className="flex gap-2 align-items-center">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={globalFilterValue}
            onChange={onGlobalFilterChange}
            placeholder="Ara..."
          />
        </span>
        <Button
          label="Yeni Kullanıcı"
          icon="pi pi-plus"
          className="p-button-success"
          onClick={openCreateDialog}
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
          value={users}
          lazy
          paginator
          first={lazyState.first}
          rows={lazyState.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          header={header}
          filters={filters}
          globalFilterFields={['firstName', 'lastName', 'email']}
          emptyMessage="Kullanıcı bulunamadı"
          rowsPerPageOptions={[10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="{first} - {last} / {totalRecords}"
        >
          <Column
            header=""
            style={{ width: '60px' }}
            body={(rowData: User) => (
              <div className="flex align-items-center justify-content-center">
                {rowData.profileImageUrl ? (
                  <img
                    src={rowData.profileImageUrl}
                    alt={`${rowData.firstName} ${rowData.lastName}`}
                    className="border-circle"
                    style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="border-circle flex align-items-center justify-content-center"
                    style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: '#6366f1',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '0.875rem'
                    }}
                  >
                    {rowData.firstName.charAt(0)}{rowData.lastName.charAt(0)}
                  </div>
                )}
              </div>
            )}
          />
          <Column field="firstName" header="Ad" sortable />
          <Column field="lastName" header="Soyad" sortable />
          <Column field="email" header="E-posta" sortable />
          <Column field="role" header="Rol" body={roleBodyTemplate} sortable />
          <Column field="isActive" header="Durum" body={statusBodyTemplate} sortable />
          <Column
            field="createdAt"
            header="Kayıt Tarihi"
            sortable
            body={(rowData) => new Date(rowData.createdAt).toLocaleDateString('tr-TR')}
          />
          <Column body={actionsBodyTemplate} header="İşlemler" style={{ width: '10rem' }} />
        </DataTable>
      </div>

      {/* User Detail Dialog */}
      <Dialog
        visible={userDialog}
        style={{ width: '550px' }}
        header="Kullanıcı Detayı"
        modal
        onHide={() => setUserDialog(false)}
        className="user-detail-dialog"
      >
        {selectedUser && (
          <div className="flex flex-column">
            {/* Profile Header */}
            <div className="flex flex-column align-items-center text-center mb-4 pb-4 border-bottom-1 surface-border">
              {/* Profile Photo */}
              <div className="relative mb-3">
                {selectedUser.profileImageUrl ? (
                  <img
                    src={selectedUser.profileImageUrl}
                    alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                    className="border-circle shadow-2"
                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="border-circle flex align-items-center justify-content-center shadow-2"
                    style={{
                      width: '120px',
                      height: '120px',
                      backgroundColor: '#6366f1',
                      fontSize: '2.5rem',
                      color: 'white',
                      fontWeight: 'bold'
                    }}
                  >
                    {selectedUser.firstName.charAt(0)}{selectedUser.lastName.charAt(0)}
                  </div>
                )}
                {/* Status indicator */}
                <span
                  className="absolute border-circle border-2 border-white"
                  style={{
                    width: '20px',
                    height: '20px',
                    backgroundColor: selectedUser.isActive ? '#22c55e' : '#ef4444',
                    bottom: '5px',
                    right: '5px'
                  }}
                />
              </div>

              {/* Name & Role */}
              <h2 className="m-0 mb-2 text-xl font-bold text-900">
                {selectedUser.firstName} {selectedUser.lastName}
              </h2>
              <div className="flex gap-2 align-items-center">
                <Tag value={selectedUser.role} severity={
                  selectedUser.role === 'Admin' ? 'danger' :
                  selectedUser.role === 'ContentManager' ? 'warning' : 'info'
                } />
                <Tag
                  value={selectedUser.isActive ? 'Aktif' : 'Pasif'}
                  severity={selectedUser.isActive ? 'success' : 'danger'}
                />
                {selectedUser.isEmailVerified && (
                  <Tag value="E-posta Doğrulandı" severity="success" icon="pi pi-check-circle" />
                )}
              </div>
            </div>

            {/* User Info Grid */}
            <div className="grid">
              {/* Contact Info */}
              <div className="col-12 md:col-6">
                <div className="surface-100 border-round p-3 h-full">
                  <h4 className="mt-0 mb-3 text-600 text-sm font-semibold uppercase">
                    <i className="pi pi-envelope mr-2"></i>İletişim
                  </h4>
                  <div className="mb-2">
                    <span className="text-500 text-sm block">E-posta</span>
                    <span className="text-900 font-medium">{selectedUser.email}</span>
                  </div>
                  <div>
                    <span className="text-500 text-sm block">Telefon</span>
                    <span className="text-900 font-medium">{selectedUser.phoneNumber || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="col-12 md:col-6">
                <div className="surface-100 border-round p-3 h-full">
                  <h4 className="mt-0 mb-3 text-600 text-sm font-semibold uppercase">
                    <i className="pi pi-briefcase mr-2"></i>Profesyonel
                  </h4>
                  <div className="mb-2">
                    <span className="text-500 text-sm block">Meslek</span>
                    <span className="text-900 font-medium">{selectedUser.profession || '-'}</span>
                  </div>
                  <div>
                    <span className="text-500 text-sm block">Şirket</span>
                    <span className="text-900 font-medium">{selectedUser.company || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Location & Date */}
              <div className="col-12">
                <div className="surface-100 border-round p-3">
                  <div className="flex flex-wrap gap-4">
                    <div className="flex-1">
                      <span className="text-500 text-sm block">
                        <i className="pi pi-map-marker mr-1"></i>Konum
                      </span>
                      <span className="text-900 font-medium">{selectedUser.location || '-'}</span>
                    </div>
                    <div className="flex-1">
                      <span className="text-500 text-sm block">
                        <i className="pi pi-calendar mr-1"></i>Kayıt Tarihi
                      </span>
                      <span className="text-900 font-medium">
                        {new Date(selectedUser.createdAt).toLocaleDateString('tr-TR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {selectedUser.bio && (
                <div className="col-12">
                  <div className="surface-100 border-round p-3">
                    <h4 className="mt-0 mb-2 text-600 text-sm font-semibold uppercase">
                      <i className="pi pi-user mr-2"></i>Hakkında
                    </h4>
                    <p className="m-0 text-900 line-height-3">{selectedUser.bio}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Dialog>
      {/* Create User Dialog */}
      <Dialog
        visible={createDialog}
        style={{ width: '500px' }}
        header="Yeni Kullanıcı Oluştur"
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
              onClick={createUser}
              loading={saving}
            />
          </div>
        }
      >
        <div className="p-fluid">
          <div className="field mb-3">
            <label htmlFor="firstName" className="font-bold">Ad *</label>
            <InputText
              id="firstName"
              value={newUser.firstName}
              onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
              placeholder="Ad"
            />
          </div>
          <div className="field mb-3">
            <label htmlFor="lastName" className="font-bold">Soyad *</label>
            <InputText
              id="lastName"
              value={newUser.lastName}
              onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
              placeholder="Soyad"
            />
          </div>
          <div className="field mb-3">
            <label htmlFor="email" className="font-bold">E-posta *</label>
            <InputText
              id="email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              placeholder="ornek@email.com"
            />
          </div>
          <div className="field mb-3">
            <label htmlFor="password" className="font-bold">Şifre *</label>
            <InputText
              id="password"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              placeholder="En az 8 karakter"
            />
          </div>
          <div className="field mb-3">
            <label htmlFor="phoneNumber" className="font-bold">Telefon</label>
            <InputText
              id="phoneNumber"
              value={newUser.phoneNumber || ''}
              onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
              placeholder="05xx xxx xx xx"
            />
          </div>
          <div className="field mb-3">
            <label htmlFor="role" className="font-bold">Rol *</label>
            <Dropdown
              id="role"
              value={newUser.role}
              options={roleOptions}
              onChange={(e) => setNewUser({ ...newUser, role: e.value })}
              placeholder="Rol Seçin"
            />
          </div>
        </div>
      </Dialog>
    </AdminLayout>
  );
}
