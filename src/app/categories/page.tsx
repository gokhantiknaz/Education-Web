'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { Checkbox } from 'primereact/checkbox';
import api, { ApiResponse } from '@/lib/api';
import { Category } from '@/types';

const emptyCategory: Partial<Category> = {
  name: '',
  description: '',
  iconUrl: '',
  displayOrder: 0,
  isActive: true,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [category, setCategory] = useState<Partial<Category>>(emptyCategory);
  const [submitted, setSubmitted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const toast = useRef<Toast>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<Category[]>>('/web/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Categories load error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load categories',
      });
    } finally {
      setLoading(false);
    }
  };

  const openNew = () => {
    setCategory(emptyCategory);
    setSubmitted(false);
    setIsEditMode(false);
    setCategoryDialog(true);
  };

  const editCategory = (category: Category) => {
    setCategory({ ...category });
    setIsEditMode(true);
    setCategoryDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setCategoryDialog(false);
  };

  const saveCategory = async () => {
    setSubmitted(true);

    if (!category.name?.trim()) {
      return;
    }

    try {
      if (isEditMode && category.id) {
        await api.put(`/web/categories/${category.id}`, category);
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Category updated successfully',
        });
      } else {
        await api.post('/web/categories', category);
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Category created successfully',
        });
      }
      setCategoryDialog(false);
      loadCategories();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Operation failed',
      });
    }
  };

  const confirmDelete = (category: Category) => {
    confirmDialog({
      message: `Are you sure you want to delete "${category.name}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => deleteCategory(category),
    });
  };

  const deleteCategory = async (category: Category) => {
    try {
      await api.delete(`/web/categories/${category.id}`);
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Category deleted successfully',
      });
      loadCategories();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete category',
      });
    }
  };

  const statusBodyTemplate = (rowData: Category) => {
    return (
      <Tag
        value={rowData.isActive ? 'Active' : 'Inactive'}
        severity={rowData.isActive ? 'success' : 'danger'}
      />
    );
  };

  const actionsBodyTemplate = (rowData: Category) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => editCategory(rowData)}
          tooltip="Edit"
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
    <div className="flex justify-content-between align-items-center">
      <h5 className="m-0">Categories</h5>
      <Button label="New Category" icon="pi pi-plus" onClick={openNew} />
    </div>
  );

  const categoryDialogFooter = (
    <>
      <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
      <Button label="Save" icon="pi pi-check" onClick={saveCategory} />
    </>
  );

  return (
    <AdminLayout>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={categories}
          loading={loading}
          header={header}
          emptyMessage="No categories found"
          sortField="displayOrder"
          sortOrder={1}
        >
          <Column field="displayOrder" header="Order" sortable style={{ width: '80px' }} />
          <Column field="name" header="Name" sortable />
          <Column field="description" header="Description" />
          <Column field="coursesCount" header="Courses" sortable style={{ width: '120px' }} />
          <Column field="isActive" header="Status" body={statusBodyTemplate} style={{ width: '100px' }} />
          <Column body={actionsBodyTemplate} header="Actions" style={{ width: '10rem' }} />
        </DataTable>
      </div>

      {/* Category Dialog */}
      <Dialog
        visible={categoryDialog}
        style={{ width: '500px' }}
        header={isEditMode ? 'Edit Category' : 'New Category'}
        modal
        footer={categoryDialogFooter}
        onHide={hideDialog}
      >
        <div className="p-fluid">
          <div className="field mb-4">
            <label htmlFor="name" className="font-bold">Name *</label>
            <InputText
              id="name"
              value={category.name}
              onChange={(e) => setCategory({ ...category, name: e.target.value })}
              required
              className={submitted && !category.name ? 'p-invalid' : ''}
            />
            {submitted && !category.name && (
              <small className="p-error">Name is required.</small>
            )}
          </div>

          <div className="field mb-4">
            <label htmlFor="description" className="font-bold">Description</label>
            <InputTextarea
              id="description"
              value={category.description}
              onChange={(e) => setCategory({ ...category, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="field mb-4">
            <label htmlFor="iconUrl" className="font-bold">Icon URL</label>
            <InputText
              id="iconUrl"
              value={category.iconUrl}
              onChange={(e) => setCategory({ ...category, iconUrl: e.target.value })}
              placeholder="/icons/category.png"
            />
          </div>

          <div className="field mb-4">
            <label htmlFor="displayOrder" className="font-bold">Display Order</label>
            <InputNumber
              id="displayOrder"
              value={category.displayOrder}
              onValueChange={(e) => setCategory({ ...category, displayOrder: e.value || 0 })}
            />
          </div>

          <div className="field-checkbox mb-4">
            <Checkbox
              inputId="isActive"
              checked={category.isActive || false}
              onChange={(e) => setCategory({ ...category, isActive: e.checked })}
            />
            <label htmlFor="isActive" className="ml-2">Active</label>
          </div>
        </div>
      </Dialog>
    </AdminLayout>
  );
}
