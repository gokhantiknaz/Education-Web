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
import { Checkbox } from 'primereact/checkbox';
import { TabView, TabPanel } from 'primereact/tabview';
import { ColorPicker } from 'primereact/colorpicker';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { OrderList } from 'primereact/orderlist';
import api, { ApiResponse } from '@/lib/api';
import { Application, ApplicationCourse, Course } from '@/types';

const emptyApplication: Partial<Application> = {
  appId: '',
  name: '',
  description: '',
  logoUrl: '',
  splashImageUrl: '',
  primaryColor: '#6C5CE7',
  secondaryColor: '#A29BFE',
  accentColor: '#FD79A8',
  androidPackageName: '',
  iosBundleId: '',
  isActive: true,
  allowRegistration: true,
  requireEnrollment: false,
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);
  const [applicationDialog, setApplicationDialog] = useState(false);
  const [courseDialog, setCourseDialog] = useState(false);
  const [application, setApplication] = useState<Partial<Application>>(emptyApplication);
  const [submitted, setSubmitted] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [assignedCourses, setAssignedCourses] = useState<ApplicationCourse[]>([]);
  const toast = useRef<Toast>(null);

  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    page: 1,
  });

  useEffect(() => {
    loadApplications();
    loadCourses();
  }, [lazyState]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<{ items: Application[]; pagination: { totalItems: number } }>>(
        `/web/applications?pageNumber=${lazyState.page}&pageSize=${lazyState.rows}`
      );
      setApplications(response.data.data.items || []);
      setTotalRecords(response.data.data.pagination?.totalItems || 0);
    } catch (error) {
      console.error('Applications load error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load applications',
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

  const loadApplicationDetail = async (id: string) => {
    try {
      const response = await api.get<ApiResponse<Application>>(`/web/applications/${id}`);
      const appDetail = response.data.data;
      setApplication(appDetail);
      setAssignedCourses(appDetail.courses || []);
    } catch (error) {
      console.error('Application detail load error:', error);
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
    setApplication(emptyApplication);
    setAssignedCourses([]);
    setSubmitted(false);
    setIsEditMode(false);
    setApplicationDialog(true);
  };

  const editApplication = async (app: Application) => {
    await loadApplicationDetail(app.id);
    setIsEditMode(true);
    setApplicationDialog(true);
  };

  const hideDialog = () => {
    setSubmitted(false);
    setApplicationDialog(false);
  };

  const hideCourseDialog = () => {
    setCourseDialog(false);
    setSelectedCourse(null);
  };

  const saveApplication = async () => {
    setSubmitted(true);

    if (!application.appId?.trim() || !application.name?.trim()) {
      return;
    }

    try {
      if (isEditMode && application.id) {
        await api.put(`/web/applications/${application.id}`, {
          name: application.name,
          description: application.description,
          logoUrl: application.logoUrl,
          splashImageUrl: application.splashImageUrl,
          primaryColor: application.primaryColor,
          secondaryColor: application.secondaryColor,
          accentColor: application.accentColor,
          androidPackageName: application.androidPackageName,
          iosBundleId: application.iosBundleId,
          isActive: application.isActive,
          allowRegistration: application.allowRegistration,
          requireEnrollment: application.requireEnrollment,
        });
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Application updated successfully',
        });
      } else {
        await api.post('/web/applications', application);
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'Application created successfully',
        });
      }
      setApplicationDialog(false);
      loadApplications();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Operation failed',
      });
    }
  };

  const confirmDelete = (app: Application) => {
    confirmDialog({
      message: `Are you sure you want to delete "${app.name}"?`,
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      accept: () => deleteApplication(app),
    });
  };

  const deleteApplication = async (app: Application) => {
    try {
      await api.delete(`/web/applications/${app.id}`);
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Application deleted successfully',
      });
      loadApplications();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to delete application',
      });
    }
  };

  const openCourseDialog = () => {
    setSelectedCourse(null);
    setCourseDialog(true);
  };

  const assignCourse = async () => {
    if (!selectedCourse || !application.id) return;

    try {
      const response = await api.post<ApiResponse<ApplicationCourse>>(
        `/web/applications/${application.id}/courses`,
        {
          courseId: selectedCourse,
          displayOrder: assignedCourses.length,
          isDefault: assignedCourses.length === 0,
        }
      );
      setAssignedCourses([...assignedCourses, response.data.data]);
      setCourseDialog(false);
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Course assigned successfully',
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to assign course',
      });
    }
  };

  const removeCourse = async (course: ApplicationCourse) => {
    if (!application.id) return;

    try {
      await api.delete(`/web/applications/${application.id}/courses/${course.courseId}`);
      setAssignedCourses(assignedCourses.filter(c => c.courseId !== course.courseId));
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Course removed successfully',
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to remove course',
      });
    }
  };

  const setDefaultCourse = async (course: ApplicationCourse) => {
    if (!application.id) return;

    try {
      await api.put(`/web/applications/${application.id}/courses/${course.courseId}`, {
        isDefault: true,
      });
      setAssignedCourses(assignedCourses.map(c => ({
        ...c,
        isDefault: c.courseId === course.courseId,
      })));
      toast.current?.show({
        severity: 'success',
        summary: 'Success',
        detail: 'Default course updated',
      });
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update default course',
      });
    }
  };

  const statusBodyTemplate = (rowData: Application) => {
    return (
      <Tag
        value={rowData.isActive ? 'Active' : 'Inactive'}
        severity={rowData.isActive ? 'success' : 'danger'}
      />
    );
  };

  const courseCountBodyTemplate = (rowData: Application) => {
    return <Tag value={rowData.courseCount || 0} severity="info" />;
  };

  const actionsBodyTemplate = (rowData: Application) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => editApplication(rowData)}
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

  const colorPreviewTemplate = (color: string | undefined) => {
    if (!color) return null;
    return (
      <div
        style={{
          width: '24px',
          height: '24px',
          backgroundColor: color,
          borderRadius: '4px',
          border: '1px solid #ddd',
          display: 'inline-block',
          marginRight: '8px',
        }}
      />
    );
  };

  const courseItemTemplate = (course: ApplicationCourse) => {
    return (
      <div className="flex align-items-center justify-content-between p-2">
        <div className="flex align-items-center gap-3">
          {course.courseThumbnailUrl && (
            <img
              src={course.courseThumbnailUrl}
              alt={course.courseTitle}
              style={{ width: '60px', height: '40px', objectFit: 'cover', borderRadius: '4px' }}
            />
          )}
          <div>
            <div className="font-bold">{course.courseTitle}</div>
            {course.isDefault && <Tag value="Default" severity="success" className="mt-1" />}
          </div>
        </div>
        <div className="flex gap-2">
          {!course.isDefault && (
            <Button
              icon="pi pi-star"
              className="p-button-rounded p-button-text p-button-warning"
              onClick={() => setDefaultCourse(course)}
              tooltip="Set as Default"
            />
          )}
          <Button
            icon="pi pi-trash"
            className="p-button-rounded p-button-text p-button-danger"
            onClick={() => removeCourse(course)}
            tooltip="Remove"
          />
        </div>
      </div>
    );
  };

  const availableCourses = courses.filter(
    c => !assignedCourses.some(ac => ac.courseId === c.id)
  );

  const header = (
    <div className="flex justify-content-between align-items-center">
      <h5 className="m-0">Applications</h5>
      <Button label="New Application" icon="pi pi-plus" onClick={openNew} />
    </div>
  );

  const applicationDialogFooter = (
    <>
      <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideDialog} />
      <Button label="Save" icon="pi pi-check" onClick={saveApplication} />
    </>
  );

  const courseDialogFooter = (
    <>
      <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={hideCourseDialog} />
      <Button label="Assign" icon="pi pi-check" onClick={assignCourse} disabled={!selectedCourse} />
    </>
  );

  return (
    <AdminLayout>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={applications}
          lazy
          paginator
          first={lazyState.first}
          rows={lazyState.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          header={header}
          emptyMessage="No applications found"
          rowsPerPageOptions={[10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="{first} - {last} / {totalRecords}"
        >
          <Column field="name" header="Name" sortable style={{ minWidth: '150px' }} />
          <Column field="appId" header="App ID" sortable style={{ minWidth: '200px' }} />
          <Column field="isActive" header="Status" body={statusBodyTemplate} sortable />
          <Column field="courseCount" header="Courses" body={courseCountBodyTemplate} sortable />
          <Column body={actionsBodyTemplate} header="Actions" style={{ width: '10rem' }} />
        </DataTable>
      </div>

      {/* Application Dialog */}
      <Dialog
        visible={applicationDialog}
        style={{ width: '800px' }}
        header={isEditMode ? 'Edit Application' : 'New Application'}
        modal
        footer={applicationDialogFooter}
        onHide={hideDialog}
      >
        <TabView>
          {/* Basic Info Tab */}
          <TabPanel header="Basic Info">
            <div className="p-fluid">
              <div className="field mb-4">
                <label htmlFor="appId" className="font-bold">App ID *</label>
                <InputText
                  id="appId"
                  value={application.appId}
                  onChange={(e) => setApplication({ ...application, appId: e.target.value })}
                  required
                  disabled={isEditMode}
                  placeholder="com.company.appname"
                  className={submitted && !application.appId ? 'p-invalid' : ''}
                />
                {submitted && !application.appId && (
                  <small className="p-error">App ID is required.</small>
                )}
              </div>

              <div className="field mb-4">
                <label htmlFor="name" className="font-bold">Name *</label>
                <InputText
                  id="name"
                  value={application.name}
                  onChange={(e) => setApplication({ ...application, name: e.target.value })}
                  required
                  className={submitted && !application.name ? 'p-invalid' : ''}
                />
                {submitted && !application.name && (
                  <small className="p-error">Name is required.</small>
                )}
              </div>

              <div className="field mb-4">
                <label htmlFor="description" className="font-bold">Description</label>
                <InputTextarea
                  id="description"
                  value={application.description || ''}
                  onChange={(e) => setApplication({ ...application, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </TabPanel>

          {/* Branding Tab */}
          <TabPanel header="Branding">
            <div className="p-fluid">
              <div className="field mb-4">
                <label htmlFor="logoUrl" className="font-bold">Logo URL</label>
                <InputText
                  id="logoUrl"
                  value={application.logoUrl || ''}
                  onChange={(e) => setApplication({ ...application, logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="field mb-4">
                <label htmlFor="splashImageUrl" className="font-bold">Splash Image URL</label>
                <InputText
                  id="splashImageUrl"
                  value={application.splashImageUrl || ''}
                  onChange={(e) => setApplication({ ...application, splashImageUrl: e.target.value })}
                  placeholder="https://example.com/splash.png"
                />
              </div>

              <div className="formgrid grid">
                <div className="field col-4 mb-4">
                  <label className="font-bold">Primary Color</label>
                  <div className="flex align-items-center gap-2">
                    {colorPreviewTemplate(application.primaryColor)}
                    <InputText
                      value={application.primaryColor || ''}
                      onChange={(e) => setApplication({ ...application, primaryColor: e.target.value })}
                      placeholder="#6C5CE7"
                    />
                  </div>
                </div>

                <div className="field col-4 mb-4">
                  <label className="font-bold">Secondary Color</label>
                  <div className="flex align-items-center gap-2">
                    {colorPreviewTemplate(application.secondaryColor)}
                    <InputText
                      value={application.secondaryColor || ''}
                      onChange={(e) => setApplication({ ...application, secondaryColor: e.target.value })}
                      placeholder="#A29BFE"
                    />
                  </div>
                </div>

                <div className="field col-4 mb-4">
                  <label className="font-bold">Accent Color</label>
                  <div className="flex align-items-center gap-2">
                    {colorPreviewTemplate(application.accentColor)}
                    <InputText
                      value={application.accentColor || ''}
                      onChange={(e) => setApplication({ ...application, accentColor: e.target.value })}
                      placeholder="#FD79A8"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>

          {/* App Store Tab */}
          <TabPanel header="App Store">
            <div className="p-fluid">
              <div className="field mb-4">
                <label htmlFor="androidPackageName" className="font-bold">Android Package Name</label>
                <InputText
                  id="androidPackageName"
                  value={application.androidPackageName || ''}
                  onChange={(e) => setApplication({ ...application, androidPackageName: e.target.value })}
                  placeholder="com.company.appname"
                />
              </div>

              <div className="field mb-4">
                <label htmlFor="iosBundleId" className="font-bold">iOS Bundle ID</label>
                <InputText
                  id="iosBundleId"
                  value={application.iosBundleId || ''}
                  onChange={(e) => setApplication({ ...application, iosBundleId: e.target.value })}
                  placeholder="com.company.appname"
                />
              </div>
            </div>
          </TabPanel>

          {/* Settings Tab */}
          <TabPanel header="Settings">
            <div className="p-fluid">
              <div className="field-checkbox mb-4">
                <Checkbox
                  inputId="isActive"
                  checked={application.isActive || false}
                  onChange={(e) => setApplication({ ...application, isActive: e.checked })}
                />
                <label htmlFor="isActive" className="ml-2">Active</label>
              </div>

              <div className="field-checkbox mb-4">
                <Checkbox
                  inputId="allowRegistration"
                  checked={application.allowRegistration || false}
                  onChange={(e) => setApplication({ ...application, allowRegistration: e.checked })}
                />
                <label htmlFor="allowRegistration" className="ml-2">Allow Registration</label>
              </div>

              <div className="field-checkbox mb-4">
                <Checkbox
                  inputId="requireEnrollment"
                  checked={application.requireEnrollment || false}
                  onChange={(e) => setApplication({ ...application, requireEnrollment: e.checked })}
                />
                <label htmlFor="requireEnrollment" className="ml-2">Require Enrollment</label>
              </div>
            </div>
          </TabPanel>

          {/* Courses Tab (only in edit mode) */}
          {isEditMode && (
            <TabPanel header="Courses">
              <div className="mb-3">
                <Button
                  label="Assign Course"
                  icon="pi pi-plus"
                  onClick={openCourseDialog}
                  disabled={availableCourses.length === 0}
                />
              </div>

              {assignedCourses.length === 0 ? (
                <div className="text-center p-4 text-color-secondary">
                  No courses assigned yet. Click "Assign Course" to add courses.
                </div>
              ) : (
                <div className="border-1 border-round surface-border">
                  {assignedCourses.map((course, index) => (
                    <div key={course.courseId} className={index > 0 ? 'border-top-1 surface-border' : ''}>
                      {courseItemTemplate(course)}
                    </div>
                  ))}
                </div>
              )}
            </TabPanel>
          )}
        </TabView>
      </Dialog>

      {/* Assign Course Dialog */}
      <Dialog
        visible={courseDialog}
        style={{ width: '500px' }}
        header="Assign Course"
        modal
        footer={courseDialogFooter}
        onHide={hideCourseDialog}
      >
        <div className="p-fluid">
          <div className="field mb-4">
            <label htmlFor="course" className="font-bold">Select Course</label>
            <Dropdown
              id="course"
              value={selectedCourse}
              options={availableCourses}
              onChange={(e) => setSelectedCourse(e.value)}
              optionLabel="title"
              optionValue="id"
              placeholder="Select a course"
              filter
              showClear
            />
          </div>
        </div>
      </Dialog>
    </AdminLayout>
  );
}
