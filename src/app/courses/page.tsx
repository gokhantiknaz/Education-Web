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
import { Checkbox } from 'primereact/checkbox';
import api, { ApiResponse } from '@/lib/api';
import { Course, Category } from '@/types';

const emptyCourse: Partial<Course> = {
  title: '',
  shortDescription: '',
  fullDescription: '',
  instructorName: '',
  price: 0,
  durationMinutes: 0,
  level: 'Beginner',
  language: 'tr',
  isFeatured: false,
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [courseDialog, setCourseDialog] = useState(false);
  const [course, setCourse] = useState<Partial<Course>>(emptyCourse);
  const [submitted, setSubmitted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const toast = useRef<Toast>(null);

  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    page: 1,
  });

  const levels = [
    { label: 'Beginner', value: 'Beginner' },
    { label: 'Intermediate', value: 'Intermediate' },
    { label: 'Advanced', value: 'Advanced' },
  ];

  useEffect(() => {
    loadCourses();
    loadCategories();
  }, [lazyState]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<{ items: Course[]; totalCount: number }>>(
        `/web/courses?pageNumber=${lazyState.page}&pageSize=${lazyState.rows}`
      );
      setCourses(response.data.data.items || []);
      setTotalRecords(response.data.data.totalCount || 0);
    } catch (error) {
      console.error('Courses load error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load courses',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await api.get<ApiResponse<Category[]>>('/web/categories');
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Categories load error:', error);
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
    setCourse(emptyCourse);
    setSubmitted(false);
    setIsEditMode(false);
    setCourseDialog(true);
  };

  const editCourse = (course: Course) => {
    setCourse({ ...course });
    setIsEditMode(true);
    setCourseDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setCourseDialog(false);
  };

  const saveCourse = async () => {
    setSubmitted(true);

    if (!course.title?.trim() || !course.categoryId) {
      return;
    }

    try {
      if (isEditMode && course.id) {
        await api.put(`/web/courses/${course.id}`, course);
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Course updated successfully',
        });
      } else {
        await api.post('/web/courses', course);
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Course created successfully',
        });
      }
      setCourseDialog(false);
      loadCourses();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Operation failed',
      });
    }
  };

  const confirmDelete = (course: Course) => {
    confirmDialog({
      message: `Are you sure you want to delete "${course.title}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => deleteCourse(course),
    });
  };

  const deleteCourse = async (course: Course) => {
    try {
      await api.delete(`/web/courses/${course.id}`);
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Course deleted successfully',
      });
      loadCourses();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete course',
      });
    }
  };

  const togglePublish = async (course: Course) => {
    try {
      const endpoint = course.isPublished
        ? `/web/courses/${course.id}/unpublish`
        : `/web/courses/${course.id}/publish`;
      await api.put(endpoint);
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: course.isPublished ? 'Course unpublished' : 'Course published',
      });
      loadCourses();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Operation failed',
      });
    }
  };

  const priceBodyTemplate = (rowData: Course) => {
    return rowData.discountPrice ? (
      <div>
        <span className="line-through text-color-secondary mr-2">${rowData.price}</span>
        <span className="text-green-500 font-bold">${rowData.discountPrice}</span>
      </div>
    ) : (
      <span>${rowData.price}</span>
    );
  };

  const statusBodyTemplate = (rowData: Course) => {
    return (
      <Tag
        value={rowData.isPublished ? 'Published' : 'Draft'}
        severity={rowData.isPublished ? 'success' : 'warning'}
      />
    );
  };

  const levelBodyTemplate = (rowData: Course) => {
    return rowData.level;
  };

  const actionsBodyTemplate = (rowData: Course) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => editCourse(rowData)}
          tooltip="Edit"
        />
        <Button
          icon={rowData.isPublished ? 'pi pi-eye-slash' : 'pi pi-eye'}
          className={`p-button-rounded p-button-text ${rowData.isPublished ? 'p-button-warning' : 'p-button-success'}`}
          onClick={() => togglePublish(rowData)}
          tooltip={rowData.isPublished ? 'Unpublish' : 'Publish'}
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
      <h5 className="m-0">Courses</h5>
      <Button label="New Course" icon="pi pi-plus" onClick={openNew} />
    </div>
  );

  const courseDialogFooter = (
    <>
      <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
      <Button label="Save" icon="pi pi-check" onClick={saveCourse} />
    </>
  );

  return (
    <AdminLayout>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={courses}
          lazy
          paginator
          first={lazyState.first}
          rows={lazyState.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          header={header}
          emptyMessage="No courses found"
          rowsPerPageOptions={[10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="{first} - {last} / {totalRecords}"
        >
          <Column field="title" header="Title" sortable style={{ minWidth: '200px' }} />
          <Column field="instructorName" header="Instructor" sortable />
          <Column field="level" header="Level" body={levelBodyTemplate} sortable />
          <Column field="price" header="Price" body={priceBodyTemplate} sortable />
          <Column field="enrollmentCount" header="Enrollments" sortable />
          <Column field="isPublished" header="Status" body={statusBodyTemplate} sortable />
          <Column body={actionsBodyTemplate} header="Actions" style={{ width: '12rem' }} />
        </DataTable>
      </div>

      {/* Course Dialog */}
      <Dialog
        visible={courseDialog}
        style={{ width: '650px' }}
        header={isEditMode ? 'Edit Course' : 'New Course'}
        modal
        footer={courseDialogFooter}
        onHide={hideDialog}
      >
        <div className="p-fluid">
          <div className="field mb-4">
            <label htmlFor="title" className="font-bold">Title *</label>
            <InputText
              id="title"
              value={course.title}
              onChange={(e) => setCourse({ ...course, title: e.target.value })}
              required
              className={submitted && !course.title ? 'p-invalid' : ''}
            />
            {submitted && !course.title && (
              <small className="p-error">Title is required.</small>
            )}
          </div>

          <div className="field mb-4">
            <label htmlFor="category" className="font-bold">Category *</label>
            <Dropdown
              id="category"
              value={course.categoryId}
              options={categories}
              onChange={(e) => setCourse({ ...course, categoryId: e.value })}
              optionLabel="name"
              optionValue="id"
              placeholder="Select a category"
              className={submitted && !course.categoryId ? 'p-invalid' : ''}
            />
          </div>

          <div className="field mb-4">
            <label htmlFor="shortDescription" className="font-bold">Short Description</label>
            <InputTextarea
              id="shortDescription"
              value={course.shortDescription}
              onChange={(e) => setCourse({ ...course, shortDescription: e.target.value })}
              rows={2}
            />
          </div>

          <div className="field mb-4">
            <label htmlFor="instructorName" className="font-bold">Instructor Name</label>
            <InputText
              id="instructorName"
              value={course.instructorName}
              onChange={(e) => setCourse({ ...course, instructorName: e.target.value })}
            />
          </div>

          <div className="formgrid grid">
            <div className="field col-6 mb-4">
              <label htmlFor="price" className="font-bold">Price (USD)</label>
              <InputNumber
                id="price"
                value={course.price}
                onValueChange={(e) => setCourse({ ...course, price: e.value || 0 })}
                mode="currency"
                currency="USD"
                locale="en-US"
              />
            </div>
            <div className="field col-6 mb-4">
              <label htmlFor="discountPrice" className="font-bold">Discount Price</label>
              <InputNumber
                id="discountPrice"
                value={course.discountPrice}
                onValueChange={(e) => setCourse({ ...course, discountPrice: e.value || undefined })}
                mode="currency"
                currency="USD"
                locale="en-US"
              />
            </div>
          </div>

          <div className="formgrid grid">
            <div className="field col-6 mb-4">
              <label htmlFor="level" className="font-bold">Level</label>
              <Dropdown
                id="level"
                value={course.level}
                options={levels}
                onChange={(e) => setCourse({ ...course, level: e.value })}
                placeholder="Select level"
              />
            </div>
            <div className="field col-6 mb-4">
              <label htmlFor="durationMinutes" className="font-bold">Duration (Minutes)</label>
              <InputNumber
                id="durationMinutes"
                value={course.durationMinutes}
                onValueChange={(e) => setCourse({ ...course, durationMinutes: e.value || 0 })}
              />
            </div>
          </div>

          <div className="field-checkbox mb-4">
            <Checkbox
              inputId="isFeatured"
              checked={course.isFeatured || false}
              onChange={(e) => setCourse({ ...course, isFeatured: e.checked })}
            />
            <label htmlFor="isFeatured" className="ml-2">Featured</label>
          </div>
        </div>
      </Dialog>
    </AdminLayout>
  );
}
