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
import { User } from '@/types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDialog, setUserDialog] = useState(false);
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
      <h5 className="m-0">Users</h5>
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilterValue}
          onChange={onGlobalFilterChange}
          placeholder="Search..."
        />
      </span>
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
    </AdminLayout>
  );
}
