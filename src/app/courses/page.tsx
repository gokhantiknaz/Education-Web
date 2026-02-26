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
import { MultiSelect } from 'primereact/multiselect';
import api, { ApiResponse } from '@/lib/api';
import { Course, Category, Application, CourseSection, CreateSectionRequest } from '@/types';

const emptyCourse: Partial<Course> & { applicationIds?: string[] } = {
  title: '',
  shortDescription: '',
  fullDescription: '',
  instructorName: '',
  price: 0,
  durationMinutes: 0,
  level: 'Beginner',
  language: 'tr',
  isFeatured: false,
  applicationIds: [],
};

const emptySection: Partial<CourseSection> = {
  title: '',
  description: '',
  displayOrder: 0,
};

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [courseDialog, setCourseDialog] = useState(false);
  const [course, setCourse] = useState<Partial<Course> & { applicationIds?: string[] }>(emptyCourse);
  const [submitted, setSubmitted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const toast = useRef<Toast>(null);

  // Sections management state
  const [sectionsDialog, setSectionsDialog] = useState(false);
  const [sections, setSections] = useState<CourseSection[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [sectionDialog, setSectionDialog] = useState(false);
  const [section, setSection] = useState<Partial<CourseSection>>(emptySection);
  const [sectionSubmitted, setSectionSubmitted] = useState(false);
  const [isSectionEditMode, setIsSectionEditMode] = useState(false);
  const [sectionsLoading, setSectionsLoading] = useState(false);

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
    loadApplications();
  }, [lazyState]);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<{ items: Course[]; pagination: { totalItems: number } }>>(
        `/web/courses?pageNumber=${lazyState.page}&pageSize=${lazyState.rows}`
      );
      setCourses(response.data.data.items || []);
      setTotalRecords(response.data.data.pagination?.totalItems || 0);
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

  const loadApplications = async () => {
    try {
      const response = await api.get<ApiResponse<{ items: Application[] }>>('/web/applications?pageSize=100');
      setApplications(response.data.data.items || []);
    } catch (error) {
      console.error('Applications load error:', error);
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

  const editCourse = (courseData: Course) => {
    // Extract applicationIds from course.applications
    const applicationIds = courseData.applications?.map(app => app.id) || [];
    setCourse({ ...courseData, applicationIds });
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
      const payload = {
        ...course,
        applicationIds: course.applicationIds || [],
      };

      if (isEditMode && course.id) {
        await api.put(`/web/courses/${course.id}`, payload);
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Course updated successfully',
        });
      } else {
        await api.post('/web/courses', payload);
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

  // Sections management functions
  const openSections = async (courseData: Course) => {
    setSelectedCourse(courseData);
    setSectionsDialog(true);
    await loadSections(courseData.id);
  };

  const loadSections = async (courseId: string) => {
    setSectionsLoading(true);
    try {
      const response = await api.get<ApiResponse<CourseSection[]>>(`/web/courses/sections?courseId=${courseId}`);
      setSections(response.data.data || []);
    } catch (error) {
      console.error('Sections load error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load sections',
      });
    } finally {
      setSectionsLoading(false);
    }
  };

  const openNewSection = () => {
    setSection({ ...emptySection, courseId: selectedCourse?.id, displayOrder: sections.length });
    setSectionSubmitted(false);
    setIsSectionEditMode(false);
    setSectionDialog(true);
  };

  const editSection = (sectionData: CourseSection) => {
    setSection(sectionData);
    setIsSectionEditMode(true);
    setSectionDialog(true);
  };

  const hideSectionDialog = () => {
    setSectionSubmitted(false);
    setSectionDialog(false);
  };

  const saveSection = async () => {
    setSectionSubmitted(true);

    if (!section.title?.trim()) {
      return;
    }

    try {
      const payload: CreateSectionRequest = {
        courseId: selectedCourse!.id,
        title: section.title,
        description: section.description,
        displayOrder: section.displayOrder || 0,
      };

      if (isSectionEditMode && section.id) {
        await api.put(`/web/courses/sections/${section.id}`, {
          title: section.title,
          description: section.description,
          displayOrder: section.displayOrder,
        });
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Section updated successfully',
        });
      } else {
        await api.post(`/web/courses/${selectedCourse!.id}/sections`, {
          title: payload.title,
          description: payload.description,
          displayOrder: payload.displayOrder,
        });
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Section created successfully',
        });
      }
      setSectionDialog(false);
      if (selectedCourse) {
        await loadSections(selectedCourse.id);
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Operation failed',
      });
    }
  };

  const confirmDeleteSection = (sectionData: CourseSection) => {
    confirmDialog({
      message: `Are you sure you want to delete "${sectionData.title}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => deleteSection(sectionData),
    });
  };

  const deleteSection = async (sectionData: CourseSection) => {
    try {
      await api.delete(`/web/courses/sections/${sectionData.id}`);
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Section deleted successfully',
      });
      if (selectedCourse) {
        await loadSections(selectedCourse.id);
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete section',
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

  const applicationsBodyTemplate = (rowData: Course) => {
    if (!rowData.applications || rowData.applications.length === 0) {
      return <span className="text-color-secondary">-</span>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {rowData.applications.map((app) => (
          <Tag key={app.id} value={app.name} severity="info" />
        ))}
      </div>
    );
  };

  const actionsBodyTemplate = (rowData: Course) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-list"
          className="p-button-rounded p-button-text p-button-secondary"
          onClick={() => openSections(rowData)}
          tooltip="Sections"
        />
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

  const sectionDialogFooter = (
    <>
      <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideSectionDialog} />
      <Button label="Save" icon="pi pi-check" onClick={saveSection} />
    </>
  );

  const sectionsActionsTemplate = (rowData: CourseSection) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => editSection(rowData)}
          tooltip="Edit"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => confirmDeleteSection(rowData)}
          tooltip="Delete"
        />
      </div>
    );
  };

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
          <Column header="Applications" body={applicationsBodyTemplate} style={{ minWidth: '150px' }} />
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
            <label htmlFor="applications" className="font-bold">Applications</label>
            <MultiSelect
              id="applications"
              value={course.applicationIds}
              options={applications}
              onChange={(e) => setCourse({ ...course, applicationIds: e.value })}
              optionLabel="name"
              optionValue="id"
              placeholder="Select applications"
              display="chip"
              filter
              showClear
            />
            <small className="text-color-secondary">
              Select which applications this course should be available in
            </small>
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

      {/* Sections Dialog */}
      <Dialog
        visible={sectionsDialog}
        style={{ width: '900px' }}
        header={`Sections - ${selectedCourse?.title}`}
        modal
        onHide={() => setSectionsDialog(false)}
      >
        <div className="mb-3">
          <Button
            label="New Section"
            icon="pi pi-plus"
            onClick={openNewSection}
            size="small"
          />
        </div>
        <DataTable
          value={sections}
          loading={sectionsLoading}
          emptyMessage="No sections found"
          size="small"
        >
          <Column field="displayOrder" header="Order" sortable style={{ width: '80px' }} />
          <Column field="title" header="Title" sortable />
          <Column field="description" header="Description" />
          <Column field="lessonCount" header="Lessons" style={{ width: '100px' }} />
          <Column body={sectionsActionsTemplate} header="Actions" style={{ width: '120px' }} />
        </DataTable>
      </Dialog>

      {/* Section Edit Dialog */}
      <Dialog
        visible={sectionDialog}
        style={{ width: '500px' }}
        header={isSectionEditMode ? 'Edit Section' : 'New Section'}
        modal
        footer={sectionDialogFooter}
        onHide={hideSectionDialog}
      >
        <div className="p-fluid">
          <div className="field mb-4">
            <label htmlFor="sectionTitle" className="font-bold">Title *</label>
            <InputText
              id="sectionTitle"
              value={section.title}
              onChange={(e) => setSection({ ...section, title: e.target.value })}
              required
              className={sectionSubmitted && !section.title ? 'p-invalid' : ''}
            />
            {sectionSubmitted && !section.title && (
              <small className="p-error">Title is required.</small>
            )}
          </div>

          <div className="field mb-4">
            <label htmlFor="sectionDescription" className="font-bold">Description</label>
            <InputTextarea
              id="sectionDescription"
              value={section.description}
              onChange={(e) => setSection({ ...section, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="field mb-4">
            <label htmlFor="sectionOrder" className="font-bold">Display Order</label>
            <InputNumber
              id="sectionOrder"
              value={section.displayOrder}
              onValueChange={(e) => setSection({ ...section, displayOrder: e.value || 0 })}
            />
          </div>
        </div>
      </Dialog>
    </AdminLayout>
  );
}
