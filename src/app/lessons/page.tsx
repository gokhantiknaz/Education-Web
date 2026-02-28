'use client';

import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Dialog } from 'primereact/dialog';
import { Toolbar } from 'primereact/toolbar';
import { FileUpload, FileUploadHandlerEvent } from 'primereact/fileupload';
import { ProgressBar } from 'primereact/progressbar';
import api, { ApiResponse } from '@/lib/api';
import { Lesson, Course, GeneralSettings } from '@/types';

interface CourseOption {
  id: string;
  title: string;
}

interface SectionOption {
  id: string;
  title: string;
  courseId: string;
}

const emptyLesson = {
  sectionId: '',
  title: '',
  description: '',
  videoUrl: '',
  durationSeconds: null as number | null,
  // Document fields
  documentUrl: '',
  documentName: '',
  documentType: '',
  documentSize: null as number | null,
  isFree: false,
  displayOrder: 0,
  isPublished: true,
};

export default function LessonsPage() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [filteredSections, setFilteredSections] = useState<SectionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [selectedCourseFilter, setSelectedCourseFilter] = useState<string | null>(null);
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Lesson Dialog
  const [lessonDialog, setLessonDialog] = useState(false);
  const [lesson, setLesson] = useState(emptyLesson);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Document upload
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileUploadRef = useRef<FileUpload>(null);

  // Selected Course for Section dropdown in dialog
  const [dialogSelectedCourse, setDialogSelectedCourse] = useState<string | null>(null);
  const [dialogSections, setDialogSections] = useState<SectionOption[]>([]);

  // Bulk operations
  const [selectedLessons, setSelectedLessons] = useState<Lesson[]>([]);

  // General settings (limits)
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings | null>(null);

  const toast = useRef<Toast>(null);

  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    page: 1,
  });

  useEffect(() => {
    loadCourses();
    loadSections();
    loadGeneralSettings();
  }, []);

  useEffect(() => {
    loadLessons();
  }, [lazyState, selectedCourseFilter, selectedSectionFilter, searchQuery]);

  useEffect(() => {
    if (selectedCourseFilter) {
      setFilteredSections(sections.filter(s => s.courseId === selectedCourseFilter));
    } else {
      setFilteredSections(sections);
    }
    setSelectedSectionFilter(null);
  }, [selectedCourseFilter, sections]);

  useEffect(() => {
    if (dialogSelectedCourse) {
      setDialogSections(sections.filter(s => s.courseId === dialogSelectedCourse));
    } else {
      setDialogSections([]);
    }
  }, [dialogSelectedCourse, sections]);

  const loadLessons = async () => {
    setLoading(true);
    try {
      let url = `/web/lessons?page=${lazyState.page}&pageSize=${lazyState.rows}`;
      if (selectedCourseFilter) url += `&courseId=${selectedCourseFilter}`;
      if (selectedSectionFilter) url += `&sectionId=${selectedSectionFilter}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const response = await api.get<ApiResponse<{ items: Lesson[]; pagination: { totalItems: number } }>>(url);
      setLessons(response.data.data.items || []);
      setTotalRecords(response.data.data.pagination?.totalItems || 0);
    } catch (error) {
      console.error('Lessons load error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Ders listesi yuklenemedi',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const response = await api.get<ApiResponse<{ items: Course[] }>>('/web/courses?pageSize=100');
      setCourses(response.data.data.items?.map(c => ({ id: c.id, title: c.title })) || []);
    } catch (error) {
      console.error('Courses load error:', error);
    }
  };

  const loadSections = async () => {
    try {
      const response = await api.get<ApiResponse<SectionOption[]>>('/web/courses/sections');
      const allSections = (response.data.data || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        courseId: s.courseId,
      }));
      setSections(allSections);
    } catch (error) {
      console.error('Sections load error:', error);
    }
  };

  const loadGeneralSettings = async () => {
    try {
      const response = await api.get<ApiResponse<GeneralSettings>>('/web/settings/general');
      if (response.data?.data) {
        setGeneralSettings(response.data.data);
      }
    } catch (error) {
      console.error('General settings load error:', error);
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

  // Lesson CRUD
  const openNewLesson = () => {
    setLesson(emptyLesson);
    setSubmitted(false);
    setIsEditMode(false);
    setEditingLessonId(null);
    setLessonDialog(true);
  };

  const editLesson = (lessonData: Lesson) => {
    // First set the course so sections can load
    setDialogSelectedCourse(lessonData.courseId);

    setLesson({
      sectionId: lessonData.sectionId,
      title: lessonData.title,
      description: lessonData.description || '',
      videoUrl: lessonData.videoUrl || '',
      durationSeconds: lessonData.durationSeconds ?? null,
      documentUrl: lessonData.documentUrl || '',
      documentName: lessonData.documentName || '',
      documentType: lessonData.documentType || '',
      documentSize: lessonData.documentSize ?? null,
      isFree: lessonData.isFree,
      displayOrder: lessonData.displayOrder,
      isPublished: lessonData.isPublished,
    });
    setIsEditMode(true);
    setEditingLessonId(lessonData.id);
    setLessonDialog(true);
  };

  const hideLessonDialog = () => {
    setSubmitted(false);
    setLessonDialog(false);
    setDocumentFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    fileUploadRef.current?.clear();
  };

  const saveLesson = async () => {
    setSubmitted(true);

    if (!lesson.title?.trim() || !lesson.sectionId) {
      return;
    }

    try {
      let lessonData = {
        title: lesson.title,
        description: lesson.description || null,
        videoUrl: lesson.videoUrl || null,
        durationSeconds: lesson.durationSeconds,
        documentUrl: lesson.documentUrl || null,
        documentName: lesson.documentName || null,
        documentType: lesson.documentType || null,
        documentSize: lesson.documentSize,
        isFree: lesson.isFree,
        displayOrder: lesson.displayOrder,
        isPublished: lesson.isPublished,
        sectionId: lesson.sectionId,
      };

      let savedLessonId = editingLessonId;

      // First create/update the lesson
      if (isEditMode && editingLessonId) {
        await api.put(`/web/lessons/${editingLessonId}`, lessonData);
      } else {
        const response = await api.post<ApiResponse<{ id: string }>>('/web/lessons', lessonData);
        savedLessonId = response.data?.data?.id || null;
      }

      // If there's a file to upload, upload it after lesson is created/updated
      if (documentFile && savedLessonId) {
        setIsUploading(true);
        setUploadProgress(0);

        const formData = new FormData();
        formData.append('file', documentFile);

        try {
          await api.post(`/web/courses/lessons/${savedLessonId}/upload-document`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
              setUploadProgress(percentCompleted);
            },
          });
        } catch (uploadError: any) {
          toast.current?.show({
            severity: 'warn',
            summary: 'Uyari',
            detail: 'Ders kaydedildi fakat belge yuklenemedi: ' + (uploadError.response?.data?.message || 'Bilinmeyen hata'),
          });
        }

        setIsUploading(false);
        setUploadProgress(0);
      }

      toast.current?.show({
        severity: 'success',
        summary: 'Basarili',
        detail: isEditMode ? 'Ders guncellendi' : 'Ders olusturuldu',
      });

      setLessonDialog(false);
      setDocumentFile(null);
      loadLessons();
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: error.response?.data?.message || 'Islem basarisiz',
      });
    }
  };

  const confirmDeleteLesson = (lessonData: Lesson) => {
    confirmDialog({
      message: `"${lessonData.title}" dersini silmek istediginize emin misiniz?`,
      header: 'Silme Onay',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Evet',
      rejectLabel: 'Hayir',
      accept: () => deleteLesson(lessonData),
    });
  };

  const deleteLesson = async (lessonData: Lesson) => {
    try {
      await api.delete(`/web/lessons/${lessonData.id}`);
      toast.current?.show({
        severity: 'success',
        summary: 'Basarili',
        detail: 'Ders silindi',
      });
      loadLessons();
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: error.response?.data?.message || 'Ders silinemedi',
      });
    }
  };

  const togglePublish = async (lessonData: Lesson) => {
    try {
      const endpoint = lessonData.isPublished
        ? `/web/lessons/${lessonData.id}/unpublish`
        : `/web/lessons/${lessonData.id}/publish`;
      await api.post(endpoint);
      toast.current?.show({
        severity: 'success',
        summary: 'Basarili',
        detail: lessonData.isPublished ? 'Ders yayindan kaldirildi' : 'Ders yayinlandi',
      });
      loadLessons();
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: error.response?.data?.message || 'Islem basarisiz',
      });
    }
  };

  // Bulk operations
  const bulkPublish = async () => {
    if (selectedLessons.length === 0) return;
    try {
      await api.post('/web/lessons/bulk-update', {
        lessonIds: selectedLessons.map(l => l.id),
        isPublished: true,
      });
      toast.current?.show({
        severity: 'success',
        summary: 'Basarili',
        detail: `${selectedLessons.length} ders yayinlandi`,
      });
      setSelectedLessons([]);
      loadLessons();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Toplu yayinlama basarisiz',
      });
    }
  };

  const bulkUnpublish = async () => {
    if (selectedLessons.length === 0) return;
    try {
      await api.post('/web/lessons/bulk-update', {
        lessonIds: selectedLessons.map(l => l.id),
        isPublished: false,
      });
      toast.current?.show({
        severity: 'success',
        summary: 'Basarili',
        detail: `${selectedLessons.length} ders yayindan kaldirildi`,
      });
      setSelectedLessons([]);
      loadLessons();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Toplu yayindan kaldirma basarisiz',
      });
    }
  };

  // Format duration
  const formatDuration = (seconds: number | undefined) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Templates
  const statusBodyTemplate = (rowData: Lesson) => {
    return (
      <Tag
        value={rowData.isPublished ? 'Yayinda' : 'Taslak'}
        severity={rowData.isPublished ? 'success' : 'warning'}
      />
    );
  };

  const freeBodyTemplate = (rowData: Lesson) => {
    return rowData.isFree ? (
      <Tag value="Ucretsiz" severity="info" />
    ) : (
      <Tag value="Ucretli" severity="secondary" />
    );
  };

  const durationBodyTemplate = (rowData: Lesson) => {
    return formatDuration(rowData.durationSeconds);
  };

  const contentTypeBodyTemplate = (rowData: Lesson) => {
    const hasVideo = rowData.hasVideo;
    const hasDocument = rowData.hasDocument;

    return (
      <div className="flex gap-2 align-items-center">
        {hasVideo && (
          <i className="pi pi-video text-blue-500" title="Video" style={{ fontSize: '1.2rem' }} />
        )}
        {hasDocument && (
          <i className="pi pi-file-pdf text-red-500" title={rowData.documentType?.toUpperCase() || 'Belge'} style={{ fontSize: '1.2rem' }} />
        )}
        {!hasVideo && !hasDocument && (
          <span className="text-500">-</span>
        )}
      </div>
    );
  };

  const courseBodyTemplate = (rowData: Lesson) => {
    return (
      <div>
        <div className="font-semibold">{rowData.courseTitle}</div>
        <div className="text-sm text-color-secondary">{rowData.sectionTitle}</div>
      </div>
    );
  };

  const actionsBodyTemplate = (rowData: Lesson) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => editLesson(rowData)}
          tooltip="Duzenle"
        />
        <Button
          icon={rowData.isPublished ? 'pi pi-eye-slash' : 'pi pi-eye'}
          className={`p-button-rounded p-button-text ${rowData.isPublished ? 'p-button-warning' : 'p-button-success'}`}
          onClick={() => togglePublish(rowData)}
          tooltip={rowData.isPublished ? 'Yayindan Kaldir' : 'Yayinla'}
        />
        <Button
          icon="pi pi-trash"
          className="p-button-rounded p-button-text p-button-danger"
          onClick={() => confirmDeleteLesson(rowData)}
          tooltip="Sil"
        />
      </div>
    );
  };

  const leftToolbarTemplate = () => {
    return (
      <div className="flex gap-2 flex-wrap">
        <Dropdown
          value={selectedCourseFilter}
          options={courses}
          onChange={(e) => setSelectedCourseFilter(e.value)}
          optionLabel="title"
          optionValue="id"
          placeholder="Kurs Filtrele"
          showClear
          className="w-15rem"
        />
        <Dropdown
          value={selectedSectionFilter}
          options={filteredSections}
          onChange={(e) => setSelectedSectionFilter(e.value)}
          optionLabel="title"
          optionValue="id"
          placeholder="Bolum Filtrele"
          showClear
          className="w-15rem"
          disabled={!selectedCourseFilter}
        />
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ara..."
            className="w-12rem"
          />
        </span>
      </div>
    );
  };

  const rightToolbarTemplate = () => {
    return (
      <div className="flex gap-2">
        {selectedLessons.length > 0 && (
          <>
            <Button
              label="Yayinla"
              icon="pi pi-eye"
              className="p-button-success"
              onClick={bulkPublish}
            />
            <Button
              label="Yayindan Kaldir"
              icon="pi pi-eye-slash"
              className="p-button-warning"
              onClick={bulkUnpublish}
            />
          </>
        )}
        <Button label="Yeni Ders" icon="pi pi-plus" onClick={openNewLesson} />
      </div>
    );
  };

  const lessonDialogFooter = (
    <>
      <Button label="Iptal" icon="pi pi-times" className="p-button-text" onClick={hideLessonDialog} />
      <Button label="Kaydet" icon="pi pi-check" onClick={saveLesson} />
    </>
  );

  return (
    <AdminLayout>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <h5 className="mb-4">Dersler</h5>

        <Toolbar className="mb-4" left={leftToolbarTemplate} right={rightToolbarTemplate} />

        <DataTable
          value={lessons}
          lazy
          paginator
          first={lazyState.first}
          rows={lazyState.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          emptyMessage="Ders bulunamadi"
          rowsPerPageOptions={[10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="{first} - {last} / {totalRecords}"
          selection={selectedLessons}
          onSelectionChange={(e) => setSelectedLessons(e.value)}
          selectionMode="checkbox"
          dataKey="id"
        >
          <Column selectionMode="multiple" headerStyle={{ width: '3rem' }} />
          <Column field="displayOrder" header="#" sortable style={{ width: '60px' }} />
          <Column field="title" header="Ders Adi" sortable style={{ minWidth: '200px' }} />
          <Column header="Kurs / Bolum" body={courseBodyTemplate} style={{ minWidth: '200px' }} />
          <Column header="Icerik" body={contentTypeBodyTemplate} style={{ width: '80px' }} />
          <Column header="Sure" body={durationBodyTemplate} style={{ width: '100px' }} />
          <Column header="Ucretsiz" body={freeBodyTemplate} style={{ width: '100px' }} />
          <Column header="Durum" body={statusBodyTemplate} style={{ width: '100px' }} />
          <Column body={actionsBodyTemplate} header="Islemler" style={{ width: '12rem' }} />
        </DataTable>
      </div>

      {/* Lesson Dialog */}
      <Dialog
        visible={lessonDialog}
        style={{ width: '650px' }}
        header={isEditMode ? 'Ders Duzenle' : 'Yeni Ders'}
        modal
        footer={lessonDialogFooter}
        onHide={hideLessonDialog}
      >
        <div className="p-fluid">
          <div className="formgrid grid">
            <div className="field col-6 mb-4">
              <label htmlFor="dialogCourse" className="font-bold">Kurs *</label>
              <Dropdown
                id="dialogCourse"
                value={dialogSelectedCourse}
                options={courses}
                onChange={(e) => {
                  setDialogSelectedCourse(e.value);
                  setLesson({ ...lesson, sectionId: '' });
                }}
                optionLabel="title"
                optionValue="id"
                placeholder="Kurs secin"
                disabled={isEditMode}
              />
            </div>
            <div className="field col-6 mb-4">
              <label htmlFor="section" className="font-bold">Bolum *</label>
              <Dropdown
                id="section"
                value={lesson.sectionId}
                options={dialogSections}
                onChange={(e) => setLesson({ ...lesson, sectionId: e.value })}
                optionLabel="title"
                optionValue="id"
                placeholder="Bolum secin"
                className={submitted && !lesson.sectionId ? 'p-invalid' : ''}
                disabled={!dialogSelectedCourse}
              />
            </div>
          </div>

          <div className="field mb-4">
            <label htmlFor="title" className="font-bold">
              Ders Adi *
              {generalSettings?.maxLessonNameLength && (
                <span className="font-normal text-500 ml-2">(maks {generalSettings.maxLessonNameLength} karakter)</span>
              )}
            </label>
            <InputText
              id="title"
              value={lesson.title}
              onChange={(e) => setLesson({ ...lesson, title: e.target.value })}
              required
              maxLength={generalSettings?.maxLessonNameLength || undefined}
              className={submitted && !lesson.title ? 'p-invalid' : ''}
            />
            {generalSettings?.maxLessonNameLength && (
              <small className={`block mt-1 ${lesson.title.length > generalSettings.maxLessonNameLength ? 'text-red-500' : 'text-500'}`}>
                {generalSettings.maxLessonNameLength - lesson.title.length} karakter kaldi
              </small>
            )}
          </div>

          <div className="field mb-4">
            <label htmlFor="description" className="font-bold">
              Aciklama
              {generalSettings?.maxDescriptionLength && (
                <span className="font-normal text-500 ml-2">(maks {generalSettings.maxDescriptionLength} karakter)</span>
              )}
            </label>
            <InputTextarea
              id="description"
              value={lesson.description}
              onChange={(e) => setLesson({ ...lesson, description: e.target.value })}
              rows={3}
              maxLength={generalSettings?.maxDescriptionLength || undefined}
            />
            {generalSettings?.maxDescriptionLength && (
              <small className={`block mt-1 ${lesson.description.length > generalSettings.maxDescriptionLength ? 'text-red-500' : 'text-500'}`}>
                {generalSettings.maxDescriptionLength - lesson.description.length} karakter kaldi
              </small>
            )}
          </div>

          <div className="field mb-4">
            <label htmlFor="videoUrl" className="font-bold">Video URL</label>
            <InputText
              id="videoUrl"
              value={lesson.videoUrl}
              onChange={(e) => setLesson({ ...lesson, videoUrl: e.target.value })}
              placeholder="https://..."
            />
            <small className="text-500">Video dosyasi URL'si (opsiyonel)</small>
          </div>

          <div className="surface-100 border-round p-3 mb-4">
            <h6 className="mt-0 mb-3 flex align-items-center gap-2">
              <i className="pi pi-file-pdf text-red-500" />
              Belge / PDF
            </h6>

            {/* File Upload */}
            <div className="field mb-3">
              <label className="font-bold">
                Belge Yukle
                {generalSettings?.maxDocumentSize && (
                  <span className="font-normal text-500 ml-2">(maks {generalSettings.maxDocumentSize} MB)</span>
                )}
              </label>
              <FileUpload
                ref={fileUploadRef}
                mode="basic"
                name="file"
                accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx"
                maxFileSize={generalSettings?.maxDocumentSize ? generalSettings.maxDocumentSize * 1024 * 1024 : 50000000}
                chooseLabel={documentFile ? documentFile.name : "Dosya Sec"}
                className="w-full"
                onSelect={(e) => {
                  if (e.files && e.files.length > 0) {
                    const file = e.files[0];
                    setDocumentFile(file);
                    // Auto-fill document name and type
                    setLesson({
                      ...lesson,
                      documentName: file.name,
                      documentType: file.name.split('.').pop()?.toLowerCase() || '',
                      documentSize: file.size
                    });
                  }
                }}
                onClear={() => {
                  setDocumentFile(null);
                }}
              />
              {documentFile && (
                <div className="flex align-items-center gap-2 mt-2">
                  <i className="pi pi-file text-primary" />
                  <span className="text-sm">{documentFile.name}</span>
                  <span className="text-sm text-500">({(documentFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                  <Button
                    icon="pi pi-times"
                    className="p-button-rounded p-button-text p-button-danger p-button-sm"
                    onClick={() => {
                      setDocumentFile(null);
                      fileUploadRef.current?.clear();
                    }}
                  />
                </div>
              )}
              {isUploading && (
                <ProgressBar value={uploadProgress} className="mt-2" />
              )}
              <small className="text-500 block mt-1">
                Maks. {generalSettings?.maxDocumentSize || 50}MB (PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX)
              </small>
            </div>

            <div className="flex align-items-center gap-2 mb-3">
              <span className="text-500">veya</span>
            </div>

            <div className="field mb-3">
              <label htmlFor="documentUrl" className="font-bold">Belge URL (Harici Link)</label>
              <InputText
                id="documentUrl"
                value={lesson.documentUrl}
                onChange={(e) => setLesson({ ...lesson, documentUrl: e.target.value })}
                placeholder="https://... (PDF, PPT, DOC, XLS)"
                disabled={!!documentFile}
              />
              <small className="text-500">Harici bir URL kullanmak icin dosya secimini kaldirin</small>
            </div>
            <div className="formgrid grid">
              <div className="field col-6 mb-0">
                <label htmlFor="documentName" className="font-bold">Belge Adi</label>
                <InputText
                  id="documentName"
                  value={lesson.documentName}
                  onChange={(e) => setLesson({ ...lesson, documentName: e.target.value })}
                  placeholder="Ornek: Ders Notlari.pdf"
                />
              </div>
              <div className="field col-6 mb-0">
                <label htmlFor="documentType" className="font-bold">Belge Tipi</label>
                <Dropdown
                  id="documentType"
                  value={lesson.documentType}
                  options={[
                    { label: 'PDF', value: 'pdf' },
                    { label: 'PowerPoint', value: 'ppt' },
                    { label: 'PowerPoint (PPTX)', value: 'pptx' },
                    { label: 'Word', value: 'doc' },
                    { label: 'Word (DOCX)', value: 'docx' },
                    { label: 'Excel', value: 'xls' },
                    { label: 'Excel (XLSX)', value: 'xlsx' },
                  ]}
                  onChange={(e) => setLesson({ ...lesson, documentType: e.value })}
                  placeholder="Tip secin"
                  showClear
                />
              </div>
            </div>
            <small className="text-500 mt-2 block">Bir ders sadece belge, sadece video veya her ikisini de icerebilir.</small>
          </div>

          <div className="field mb-4">
            <label htmlFor="durationSeconds" className="font-bold">
              Sure (saniye)
              {generalSettings?.maxVideoDuration && (
                <span className="font-normal text-500 ml-2">(maks {generalSettings.maxVideoDuration} dk = {generalSettings.maxVideoDuration * 60} sn)</span>
              )}
            </label>
            <InputNumber
              id="durationSeconds"
              value={lesson.durationSeconds}
              onValueChange={(e) => setLesson({ ...lesson, durationSeconds: e.value })}
              min={0}
              max={generalSettings?.maxVideoDuration ? generalSettings.maxVideoDuration * 60 : undefined}
              placeholder="Ornek: 600 (10 dk)"
            />
          </div>

          <div className="formgrid grid">
            <div className="field col-6 mb-4">
              <label htmlFor="displayOrder" className="font-bold">Siralama</label>
              <InputNumber
                id="displayOrder"
                value={lesson.displayOrder}
                onValueChange={(e) => setLesson({ ...lesson, displayOrder: e.value || 0 })}
                min={0}
              />
            </div>
          </div>

          <div className="flex gap-4 mb-4">
            <div className="field-checkbox">
              <Checkbox
                inputId="isFree"
                checked={lesson.isFree}
                onChange={(e) => setLesson({ ...lesson, isFree: e.checked || false })}
              />
              <label htmlFor="isFree" className="ml-2">Ucretsiz Ders</label>
            </div>
            <div className="field-checkbox">
              <Checkbox
                inputId="isPublished"
                checked={lesson.isPublished}
                onChange={(e) => setLesson({ ...lesson, isPublished: e.checked || false })}
              />
              <label htmlFor="isPublished" className="ml-2">Yayinla</label>
            </div>
          </div>
        </div>
      </Dialog>
    </AdminLayout>
  );
}
