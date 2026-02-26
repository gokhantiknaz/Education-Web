'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputSwitch } from 'primereact/inputswitch';
import { Calendar } from 'primereact/calendar';
import { ProgressBar } from 'primereact/progressbar';
import api, { ApiResponse } from '@/lib/api';
import { PromoCode, PromoCodeDetail, Course } from '@/types';

const emptyPromoCode: Partial<PromoCode> = {
  code: '',
  description: '',
  discountType: 'Percentage',
  discountValue: 10,
  maxUsageCount: 0,
  maxUsagePerUser: 1,
  isActive: true,
};

export default function PromoCodesPage() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [promoDialog, setPromoDialog] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [promoCode, setPromoCode] = useState<Partial<PromoCode>>(emptyPromoCode);
  const [promoCodeDetail, setPromoCodeDetail] = useState<PromoCodeDetail | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const toast = useRef<Toast>(null);

  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    page: 1,
  });

  const [filters, setFilters] = useState({
    search: '',
    isActive: null as boolean | null,
    isExpired: null as boolean | null,
    courseId: null as string | null,
  });

  const discountTypes = [
    { label: 'Percentage (%)', value: 'Percentage' },
    { label: 'Fixed Amount (TL)', value: 'FixedAmount' },
  ];

  const statusOptions = [
    { label: 'All', value: null },
    { label: 'Active', value: true },
    { label: 'Inactive', value: false },
  ];

  const expiredOptions = [
    { label: 'All', value: null },
    { label: 'Valid', value: false },
    { label: 'Expired', value: true },
  ];

  useEffect(() => {
    loadPromoCodes();
    loadCourses();
  }, [lazyState, filters]);

  const loadPromoCodes = async () => {
    setLoading(true);
    try {
      let url = `/web/promo-codes?page=${lazyState.page}&pageSize=${lazyState.rows}`;
      if (filters.search) url += `&search=${encodeURIComponent(filters.search)}`;
      if (filters.isActive !== null) url += `&isActive=${filters.isActive}`;
      if (filters.isExpired !== null) url += `&isExpired=${filters.isExpired}`;
      if (filters.courseId) url += `&courseId=${filters.courseId}`;

      const response = await api.get<ApiResponse<{ items: PromoCode[]; pagination: { totalItems: number } }>>(url);
      setPromoCodes(response.data.data.items || []);
      setTotalRecords(response.data.data.pagination?.totalItems || 0);
    } catch (error) {
      console.error('Promo codes load error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load promo codes',
      });
    } finally {
      setLoading(false);
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

  const onPage = (event: { first: number; rows: number; page?: number }) => {
    setLazyState({
      ...lazyState,
      first: event.first,
      rows: event.rows,
      page: (event.page ?? 0) + 1,
    });
  };

  const openNew = () => {
    setPromoCode(emptyPromoCode);
    setSubmitted(false);
    setIsEditMode(false);
    setPromoDialog(true);
  };

  const editPromoCode = (data: PromoCode) => {
    setPromoCode({
      ...data,
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validTo: data.validTo ? new Date(data.validTo) : undefined,
    } as any);
    setIsEditMode(true);
    setPromoDialog(true);
  };

  const viewPromoCode = async (data: PromoCode) => {
    try {
      const response = await api.get<ApiResponse<PromoCodeDetail>>(`/web/promo-codes/${data.id}`);
      setPromoCodeDetail(response.data.data);
      setDetailDialog(true);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load promo code details',
      });
    }
  };

  const hideDialog = () => {
    setSubmitted(false);
    setPromoDialog(false);
  };

  const savePromoCode = async () => {
    setSubmitted(true);

    if (!promoCode.code?.trim() || !promoCode.discountValue) {
      return;
    }

    try {
      const payload = {
        ...promoCode,
        validFrom: promoCode.validFrom ? new Date(promoCode.validFrom as any).toISOString() : undefined,
        validTo: promoCode.validTo ? new Date(promoCode.validTo as any).toISOString() : undefined,
      };

      if (isEditMode && promoCode.id) {
        await api.put(`/web/promo-codes/${promoCode.id}`, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Promo code updated successfully',
        });
      } else {
        await api.post('/web/promo-codes', payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Promo code created successfully',
        });
      }
      setPromoDialog(false);
      loadPromoCodes();
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Operation failed',
      });
    }
  };

  const confirmDelete = (data: PromoCode) => {
    confirmDialog({
      message: `Are you sure you want to delete "${data.code}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => deletePromoCode(data),
    });
  };

  const deletePromoCode = async (data: PromoCode) => {
    try {
      await api.delete(`/web/promo-codes/${data.id}`);
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Promo code deleted successfully',
      });
      loadPromoCodes();
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: error.response?.data?.message || 'Failed to delete promo code',
      });
    }
  };

  const toggleActive = async (data: PromoCode) => {
    try {
      await api.put(`/web/promo-codes/${data.id}`, { isActive: !data.isActive });
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: data.isActive ? 'Promo code deactivated' : 'Promo code activated',
      });
      loadPromoCodes();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Operation failed',
      });
    }
  };

  const codeBodyTemplate = (rowData: PromoCode) => {
    return <span className="font-mono font-bold">{rowData.code}</span>;
  };

  const discountBodyTemplate = (rowData: PromoCode) => {
    return rowData.discountType === 'Percentage'
      ? `%${rowData.discountValue}`
      : `${rowData.discountValue.toFixed(2)} TL`;
  };

  const courseBodyTemplate = (rowData: PromoCode) => {
    return rowData.courseTitle || <span className="text-color-secondary">All Courses</span>;
  };

  const usageBodyTemplate = (rowData: PromoCode) => {
    const max = rowData.maxUsageCount || 0;
    const used = rowData.usageCount || 0;
    const percentage = max > 0 ? (used / max) * 100 : 0;

    return (
      <div>
        <div className="text-sm mb-1">
          {used} / {max === 0 ? '∞' : max}
        </div>
        {max > 0 && (
          <ProgressBar
            value={percentage}
            showValue={false}
            style={{ height: '6px' }}
            className={percentage >= 100 ? 'p-progressbar-danger' : ''}
          />
        )}
      </div>
    );
  };

  const validityBodyTemplate = (rowData: PromoCode) => {
    const now = new Date();
    const validFrom = rowData.validFrom ? new Date(rowData.validFrom) : null;
    const validTo = rowData.validTo ? new Date(rowData.validTo) : null;

    if (validTo && validTo < now) {
      return <Tag value="Expired" severity="danger" />;
    }
    if (validFrom && validFrom > now) {
      return <Tag value="Not Started" severity="warning" />;
    }

    if (validTo) {
      const daysLeft = Math.ceil((validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return <Tag value={`${daysLeft} days left`} severity={daysLeft <= 7 ? 'warning' : 'success'} />;
    }

    return <Tag value="No Expiry" severity="info" />;
  };

  const statusBodyTemplate = (rowData: PromoCode) => {
    return (
      <Tag
        value={rowData.isActive ? 'Active' : 'Inactive'}
        severity={rowData.isActive ? 'success' : 'danger'}
      />
    );
  };

  const actionsBodyTemplate = (rowData: PromoCode) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-eye"
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => viewPromoCode(rowData)}
          tooltip="View Details"
        />
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-secondary"
          onClick={() => editPromoCode(rowData)}
          tooltip="Edit"
        />
        <Button
          icon={rowData.isActive ? 'pi pi-ban' : 'pi pi-check'}
          className={`p-button-rounded p-button-text ${rowData.isActive ? 'p-button-warning' : 'p-button-success'}`}
          onClick={() => toggleActive(rowData)}
          tooltip={rowData.isActive ? 'Deactivate' : 'Activate'}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => confirmDelete(rowData)}
          tooltip="Delete"
        />
      </div>
    );
  };

  const header = (
    <div className="flex flex-column gap-3">
      <div className="flex justify-content-between align-items-center">
        <h5 className="m-0">Promo Codes</h5>
        <Button label="New Promo Code" icon="pi pi-plus" onClick={openNew} />
      </div>
      <div className="flex gap-3 flex-wrap">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            placeholder="Search code..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            style={{ width: '200px' }}
          />
        </span>
        <Dropdown
          value={filters.isActive}
          options={statusOptions}
          onChange={(e) => setFilters({ ...filters, isActive: e.value })}
          placeholder="Status"
          style={{ width: '150px' }}
        />
        <Dropdown
          value={filters.isExpired}
          options={expiredOptions}
          onChange={(e) => setFilters({ ...filters, isExpired: e.value })}
          placeholder="Validity"
          style={{ width: '150px' }}
        />
        <Dropdown
          value={filters.courseId}
          options={[{ label: 'All Courses', value: null }, ...courses.map(c => ({ label: c.title, value: c.id }))]}
          onChange={(e) => setFilters({ ...filters, courseId: e.value })}
          placeholder="Course"
          filter
          showClear
          style={{ width: '200px' }}
        />
      </div>
    </div>
  );

  const promoDialogFooter = (
    <>
      <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
      <Button label="Save" icon="pi pi-check" onClick={savePromoCode} />
    </>
  );

  return (
    <AdminLayout>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={promoCodes}
          lazy
          paginator
          first={lazyState.first}
          rows={lazyState.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          header={header}
          emptyMessage="No promo codes found"
          rowsPerPageOptions={[10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="{first} - {last} / {totalRecords}"
        >
          <Column field="code" header="Code" body={codeBodyTemplate} sortable style={{ minWidth: '120px' }} />
          <Column field="description" header="Description" style={{ minWidth: '150px' }} />
          <Column header="Discount" body={discountBodyTemplate} style={{ width: '100px' }} />
          <Column header="Course" body={courseBodyTemplate} style={{ minWidth: '150px' }} />
          <Column header="Usage" body={usageBodyTemplate} style={{ width: '120px' }} />
          <Column header="Validity" body={validityBodyTemplate} style={{ width: '120px' }} />
          <Column header="Status" body={statusBodyTemplate} style={{ width: '100px' }} />
          <Column body={actionsBodyTemplate} header="Actions" style={{ width: '180px' }} />
        </DataTable>
      </div>

      {/* Promo Code Dialog */}
      <Dialog
        visible={promoDialog}
        style={{ width: '600px' }}
        header={isEditMode ? 'Edit Promo Code' : 'New Promo Code'}
        modal
        footer={promoDialogFooter}
        onHide={hideDialog}
      >
        <div className="p-fluid">
          {!isEditMode && (
            <div className="field mb-4">
              <label htmlFor="code" className="font-bold">Code *</label>
              <InputText
                id="code"
                value={promoCode.code}
                onChange={(e) => setPromoCode({ ...promoCode, code: e.target.value.toUpperCase() })}
                required
                className={submitted && !promoCode.code ? 'p-invalid' : ''}
                placeholder="e.g., SUMMER2024"
              />
              {submitted && !promoCode.code && (
                <small className="p-error">Code is required.</small>
              )}
              <small className="text-color-secondary">Only uppercase letters, numbers, underscores and hyphens allowed</small>
            </div>
          )}

          <div className="field mb-4">
            <label htmlFor="description" className="font-bold">Description</label>
            <InputTextarea
              id="description"
              value={promoCode.description}
              onChange={(e) => setPromoCode({ ...promoCode, description: e.target.value })}
              rows={2}
            />
          </div>

          <div className="formgrid grid">
            <div className="field col-6 mb-4">
              <label htmlFor="discountType" className="font-bold">Discount Type *</label>
              <Dropdown
                id="discountType"
                value={promoCode.discountType}
                options={discountTypes}
                onChange={(e) => setPromoCode({ ...promoCode, discountType: e.value })}
              />
            </div>
            <div className="field col-6 mb-4">
              <label htmlFor="discountValue" className="font-bold">Discount Value *</label>
              <InputNumber
                id="discountValue"
                value={promoCode.discountValue}
                onValueChange={(e) => setPromoCode({ ...promoCode, discountValue: e.value || 0 })}
                suffix={promoCode.discountType === 'Percentage' ? '%' : ' TL'}
                min={0}
                max={promoCode.discountType === 'Percentage' ? 100 : undefined}
              />
            </div>
          </div>

          <div className="field mb-4">
            <label htmlFor="courseId" className="font-bold">Course (Optional)</label>
            <Dropdown
              id="courseId"
              value={promoCode.courseId}
              options={[{ label: 'All Courses', value: null }, ...courses.map(c => ({ label: c.title, value: c.id }))]}
              onChange={(e) => setPromoCode({ ...promoCode, courseId: e.value })}
              filter
              showClear
              placeholder="Select a course or leave empty for all"
            />
          </div>

          <div className="formgrid grid">
            <div className="field col-6 mb-4">
              <label htmlFor="maxUsageCount" className="font-bold">Max Total Usage</label>
              <InputNumber
                id="maxUsageCount"
                value={promoCode.maxUsageCount}
                onValueChange={(e) => setPromoCode({ ...promoCode, maxUsageCount: e.value || 0 })}
                min={0}
              />
              <small className="text-color-secondary">0 = Unlimited</small>
            </div>
            <div className="field col-6 mb-4">
              <label htmlFor="maxUsagePerUser" className="font-bold">Max Usage Per User</label>
              <InputNumber
                id="maxUsagePerUser"
                value={promoCode.maxUsagePerUser}
                onValueChange={(e) => setPromoCode({ ...promoCode, maxUsagePerUser: e.value || 0 })}
                min={0}
              />
              <small className="text-color-secondary">0 = Unlimited</small>
            </div>
          </div>

          <div className="formgrid grid">
            <div className="field col-6 mb-4">
              <label htmlFor="minimumOrderAmount" className="font-bold">Min. Order Amount (TL)</label>
              <InputNumber
                id="minimumOrderAmount"
                value={promoCode.minimumOrderAmount}
                onValueChange={(e) => setPromoCode({ ...promoCode, minimumOrderAmount: e.value ?? undefined })}
                min={0}
                mode="currency"
                currency="TRY"
                locale="tr-TR"
              />
            </div>
            <div className="field col-6 mb-4">
              <label htmlFor="maxDiscountAmount" className="font-bold">Max Discount Amount (TL)</label>
              <InputNumber
                id="maxDiscountAmount"
                value={promoCode.maxDiscountAmount}
                onValueChange={(e) => setPromoCode({ ...promoCode, maxDiscountAmount: e.value ?? undefined })}
                min={0}
                mode="currency"
                currency="TRY"
                locale="tr-TR"
              />
              <small className="text-color-secondary">For percentage discounts</small>
            </div>
          </div>

          <div className="formgrid grid">
            <div className="field col-6 mb-4">
              <label htmlFor="validFrom" className="font-bold">Valid From</label>
              <Calendar
                id="validFrom"
                value={promoCode.validFrom as any}
                onChange={(e) => setPromoCode({ ...promoCode, validFrom: e.value as any })}
                showTime
                showIcon
                dateFormat="dd/mm/yy"
              />
            </div>
            <div className="field col-6 mb-4">
              <label htmlFor="validTo" className="font-bold">Valid To</label>
              <Calendar
                id="validTo"
                value={promoCode.validTo as any}
                onChange={(e) => setPromoCode({ ...promoCode, validTo: e.value as any })}
                showTime
                showIcon
                dateFormat="dd/mm/yy"
              />
            </div>
          </div>

          <div className="field-checkbox mb-4">
            <InputSwitch
              inputId="isActive"
              checked={promoCode.isActive || false}
              onChange={(e) => setPromoCode({ ...promoCode, isActive: e.value })}
            />
            <label htmlFor="isActive" className="ml-2">Active</label>
          </div>
        </div>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog
        visible={detailDialog}
        style={{ width: '700px' }}
        header={`Promo Code: ${promoCodeDetail?.code}`}
        modal
        onHide={() => setDetailDialog(false)}
      >
        {promoCodeDetail && (
          <div>
            <div className="grid mb-4">
              <div className="col-6">
                <div className="text-color-secondary mb-1">Discount</div>
                <div className="text-xl font-bold">
                  {promoCodeDetail.discountType === 'Percentage'
                    ? `%${promoCodeDetail.discountValue}`
                    : `${promoCodeDetail.discountValue.toFixed(2)} TL`}
                </div>
              </div>
              <div className="col-6">
                <div className="text-color-secondary mb-1">Course</div>
                <div className="text-xl">{promoCodeDetail.courseTitle || 'All Courses'}</div>
              </div>
              <div className="col-6">
                <div className="text-color-secondary mb-1">Usage</div>
                <div className="text-xl font-bold">
                  {promoCodeDetail.usageCount} / {promoCodeDetail.maxUsageCount || '∞'}
                </div>
              </div>
              <div className="col-6">
                <div className="text-color-secondary mb-1">Status</div>
                <Tag
                  value={promoCodeDetail.isActive ? 'Active' : 'Inactive'}
                  severity={promoCodeDetail.isActive ? 'success' : 'danger'}
                />
              </div>
            </div>

            {promoCodeDetail.recentUsages && promoCodeDetail.recentUsages.length > 0 && (
              <>
                <h6>Recent Usages</h6>
                <DataTable value={promoCodeDetail.recentUsages} size="small">
                  <Column field="userName" header="User" />
                  <Column field="userEmail" header="Email" />
                  <Column
                    field="discountApplied"
                    header="Discount Applied"
                    body={(row) => `${row.discountApplied.toFixed(2)} TL`}
                  />
                  <Column
                    field="usedAt"
                    header="Used At"
                    body={(row) => new Date(row.usedAt).toLocaleString('tr-TR')}
                  />
                </DataTable>
              </>
            )}
          </div>
        )}
      </Dialog>
    </AdminLayout>
  );
}
