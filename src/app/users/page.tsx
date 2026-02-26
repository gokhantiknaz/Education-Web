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
        summary: 'Error',
        detail: 'Failed to load users',
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
      message: `Are you sure you want to ${user.isActive ? 'deactivate' : 'activate'} ${user.firstName} ${user.lastName}?`,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
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
        summary: 'Success',
        detail: `User ${user.isActive ? 'deactivated' : 'activated'} successfully`,
      });
      loadUsers();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Operation failed',
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
        value={rowData.isActive ? 'Active' : 'Inactive'}
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
          tooltip="Details"
        />
        <Button
          icon={rowData.isActive ? 'pi pi-ban' : 'pi pi-check'}
          className={`p-button-rounded p-button-text ${rowData.isActive ? 'p-button-danger' : 'p-button-success'}`}
          onClick={() => confirmToggleActive(rowData)}
          tooltip={rowData.isActive ? 'Deactivate' : 'Activate'}
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
          emptyMessage="No users found"
          rowsPerPageOptions={[10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="{first} - {last} / {totalRecords}"
        >
          <Column field="firstName" header="First Name" sortable />
          <Column field="lastName" header="Last Name" sortable />
          <Column field="email" header="Email" sortable />
          <Column field="role" header="Role" body={roleBodyTemplate} sortable />
          <Column field="isActive" header="Status" body={statusBodyTemplate} sortable />
          <Column
            field="createdAt"
            header="Registration Date"
            sortable
            body={(rowData) => new Date(rowData.createdAt).toLocaleDateString('en-US')}
          />
          <Column body={actionsBodyTemplate} header="Actions" style={{ width: '10rem' }} />
        </DataTable>
      </div>

      {/* User Detail Dialog */}
      <Dialog
        visible={userDialog}
        style={{ width: '450px' }}
        header="User Details"
        modal
        onHide={() => setUserDialog(false)}
      >
        {selectedUser && (
          <div className="p-fluid">
            <div className="field mb-3">
              <label className="font-bold">Full Name</label>
              <p>{selectedUser.firstName} {selectedUser.lastName}</p>
            </div>
            <div className="field mb-3">
              <label className="font-bold">Email</label>
              <p>{selectedUser.email}</p>
            </div>
            <div className="field mb-3">
              <label className="font-bold">Phone</label>
              <p>{selectedUser.phoneNumber || '-'}</p>
            </div>
            <div className="field mb-3">
              <label className="font-bold">Role</label>
              <p>{selectedUser.role}</p>
            </div>
            <div className="field mb-3">
              <label className="font-bold">Profession</label>
              <p>{selectedUser.profession || '-'}</p>
            </div>
            <div className="field mb-3">
              <label className="font-bold">Company</label>
              <p>{selectedUser.company || '-'}</p>
            </div>
            <div className="field mb-3">
              <label className="font-bold">Location</label>
              <p>{selectedUser.location || '-'}</p>
            </div>
            <div className="field mb-3">
              <label className="font-bold">Registration Date</label>
              <p>{new Date(selectedUser.createdAt).toLocaleString('en-US')}</p>
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
