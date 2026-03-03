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
import { TabView, TabPanel } from 'primereact/tabview';
import { OrderList } from 'primereact/orderlist';
import { Message } from 'primereact/message';
import { Divider } from 'primereact/divider';
import api, { ApiResponse } from '@/lib/api';
import { Quiz, QuizQuestion, QuizOption, Course, CreateOptionRequest, TestCase, CreateTestCaseRequest, ValidationResult } from '@/types';
import { MultiSelect } from 'primereact/multiselect';
import { ProgressSpinner } from 'primereact/progressspinner';

interface CourseOption {
  id: string;
  title: string;
}

const emptyQuiz = {
  title: '',
  description: '',
  courseId: '',
  passingScore: 70,
  timeLimit: undefined as number | undefined,
  maxAttempts: 3,
  isActive: true,
};

const emptyQuestion = {
  quizId: '',
  questionText: '',
  questionType: 'SingleChoice',
  points: 1,
  displayOrder: 0,
  correctAnswer: '',
  explanation: '',
  imageUrl: '',
  options: [] as CreateOptionRequest[],
  // CodeChallenge fields
  starterCode: '',
  solutionCode: '',
  timeLimitSeconds: 5,
  memoryLimitKb: 128000,
  functionSignature: '',
  allowedLanguages: ['python', 'javascript'] as string[],
  testCases: [] as CreateTestCaseRequest[],
};

const emptyTestCase: CreateTestCaseRequest = {
  input: '',
  expectedOutput: '',
  isHidden: false,
  displayOrder: 0,
  points: 1,
};

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);

  // Quiz Dialog
  const [quizDialog, setQuizDialog] = useState(false);
  const [quiz, setQuiz] = useState(emptyQuiz);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Question Dialog
  const [questionDialog, setQuestionDialog] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [question, setQuestion] = useState(emptyQuestion);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);

  // Questions Management Dialog
  const [questionsDialog, setQuestionsDialog] = useState(false);
  const [questionsLoading, setQuestionsLoading] = useState(false);

  // CodeChallenge state
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [validationLanguage, setValidationLanguage] = useState('python');

  const toast = useRef<Toast>(null);

  const [lazyState, setLazyState] = useState({
    first: 0,
    rows: 10,
    page: 1,
  });

  const questionTypes = [
    { label: 'Tek Secim', value: 'SingleChoice' },
    { label: 'Coktan Secmeli', value: 'MultipleChoice' },
    { label: 'Bosluk Doldurma', value: 'FillInBlank' },
    { label: 'Kod Yazma', value: 'CodeChallenge' },
  ];

  const supportedLanguages = [
    { label: 'Python', value: 'python' },
    { label: 'JavaScript', value: 'javascript' },
    { label: 'C#', value: 'csharp' },
    { label: 'C', value: 'c' },
  ];

  useEffect(() => {
    loadQuizzes();
    loadCourses();
  }, [lazyState]);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const response = await api.get<ApiResponse<{ items: Quiz[]; pagination: { totalItems: number } }>>(
        `/web/quizzes?pageNumber=${lazyState.page}&pageSize=${lazyState.rows}`
      );
      setQuizzes(response.data.data.items || []);
      setTotalRecords(response.data.data.pagination?.totalItems || 0);
    } catch (error) {
      console.error('Quizzes load error:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Quiz listesi yuklenemedi',
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

  const onPage = (event: { first: number; rows: number; page?: number }) => {
    setLazyState({
      ...lazyState,
      first: event.first,
      rows: event.rows,
      page: (event.page ?? 0) + 1,
    });
  };

  // Quiz CRUD
  const openNewQuiz = () => {
    setQuiz(emptyQuiz);
    setSubmitted(false);
    setIsEditMode(false);
    setEditingQuizId(null);
    setQuizDialog(true);
  };

  const editQuiz = (quizData: Quiz) => {
    setQuiz({
      title: quizData.title,
      description: quizData.description || '',
      courseId: quizData.courseId,
      passingScore: quizData.passingScore,
      timeLimit: quizData.timeLimit,
      maxAttempts: quizData.maxAttempts,
      isActive: quizData.isActive,
    });
    setIsEditMode(true);
    setEditingQuizId(quizData.id);
    setQuizDialog(true);
  };

  const hideQuizDialog = () => {
    setSubmitted(false);
    setQuizDialog(false);
  };

  const saveQuiz = async () => {
    setSubmitted(true);

    if (!quiz.title?.trim() || !quiz.courseId) {
      return;
    }

    try {
      if (isEditMode && editingQuizId) {
        await api.put(`/web/quizzes/${editingQuizId}`, {
          title: quiz.title,
          description: quiz.description,
          passingScore: quiz.passingScore,
          timeLimit: quiz.timeLimit,
          maxAttempts: quiz.maxAttempts,
          isActive: quiz.isActive,
        });
        toast.current?.show({
          severity: 'success',
          summary: 'Basarili',
          detail: 'Quiz guncellendi',
        });
      } else {
        await api.post('/web/quizzes', quiz);
        toast.current?.show({
          severity: 'success',
          summary: 'Basarili',
          detail: 'Quiz olusturuldu',
        });
      }
      setQuizDialog(false);
      loadQuizzes();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Islem basarisiz',
      });
    }
  };

  const confirmDeleteQuiz = (quizData: Quiz) => {
    confirmDialog({
      message: `"${quizData.title}" quizini silmek istediginize emin misiniz?`,
      header: 'Silme Onay',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Evet',
      rejectLabel: 'Hayir',
      accept: () => deleteQuiz(quizData),
    });
  };

  const deleteQuiz = async (quizData: Quiz) => {
    try {
      await api.delete(`/web/quizzes/${quizData.id}`);
      toast.current?.show({
        severity: 'success',
        summary: 'Basarili',
        detail: 'Quiz silindi',
      });
      loadQuizzes();
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Quiz silinemedi',
      });
    }
  };

  const togglePublish = async (quizData: Quiz) => {
    try {
      const endpoint = quizData.isPublished
        ? `/web/quizzes/${quizData.id}/unpublish`
        : `/web/quizzes/${quizData.id}/publish`;
      await api.put(endpoint);
      toast.current?.show({
        severity: 'success',
        summary: 'Basarili',
        detail: quizData.isPublished ? 'Quiz yayindan kaldirildi' : 'Quiz yayinlandi',
      });
      loadQuizzes();
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: error.response?.data?.message || 'Islem basarisiz',
      });
    }
  };

  // Questions Management
  const openQuestionsDialog = async (quizData: Quiz) => {
    setQuestionsLoading(true);
    setQuestionsDialog(true);
    try {
      const response = await api.get<ApiResponse<Quiz>>(`/web/quizzes/${quizData.id}`);
      setCurrentQuiz(response.data.data);
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Quiz detaylari yuklenemedi',
      });
    } finally {
      setQuestionsLoading(false);
    }
  };

  const hideQuestionsDialog = () => {
    setQuestionsDialog(false);
    setCurrentQuiz(null);
    loadQuizzes(); // Refresh list to update question counts
  };

  // Question CRUD
  const openNewQuestion = () => {
    if (!currentQuiz) return;
    setQuestion({
      ...emptyQuestion,
      quizId: currentQuiz.id,
      options: [
        { optionText: '', isCorrect: false, displayOrder: 0 },
        { optionText: '', isCorrect: false, displayOrder: 1 },
        { optionText: '', isCorrect: false, displayOrder: 2 },
        { optionText: '', isCorrect: false, displayOrder: 3 },
      ],
      testCases: [],
    });
    setIsEditingQuestion(false);
    setEditingQuestionId(null);
    setValidationResult(null);
    setQuestionDialog(true);
  };

  const editQuestion = (questionData: QuizQuestion) => {
    const allowedLangs = questionData.allowedLanguages || ['python', 'javascript'];
    setQuestion({
      quizId: questionData.quizId,
      questionText: questionData.questionText,
      questionType: questionData.questionType,
      points: questionData.points,
      displayOrder: questionData.displayOrder,
      correctAnswer: questionData.correctAnswer || '',
      explanation: questionData.explanation || '',
      imageUrl: questionData.imageUrl || '',
      options: questionData.options.map(o => ({
        optionText: o.optionText,
        isCorrect: o.isCorrect,
        displayOrder: o.displayOrder,
      })),
      // CodeChallenge fields
      starterCode: questionData.starterCode || '',
      solutionCode: questionData.solutionCode || '',
      timeLimitSeconds: questionData.timeLimitSeconds || 5,
      memoryLimitKb: questionData.memoryLimitKb || 128000,
      functionSignature: questionData.functionSignature || '',
      allowedLanguages: allowedLangs,
      testCases: questionData.testCases?.map(tc => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden,
        displayOrder: tc.displayOrder,
        points: tc.points,
      })) || [],
    });
    setIsEditingQuestion(true);
    setEditingQuestionId(questionData.id);
    setValidationResult(null);
    // Auto-select validation language if only one is allowed
    if (allowedLangs.length === 1) {
      setValidationLanguage(allowedLangs[0]);
    } else if (allowedLangs.length > 0 && !allowedLangs.includes(validationLanguage)) {
      setValidationLanguage(allowedLangs[0]);
    }
    setQuestionDialog(true);
  };

  const hideQuestionDialog = () => {
    setQuestionDialog(false);
  };

  const saveQuestion = async () => {
    if (!question.questionText?.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Uyari',
        detail: 'Soru metni gerekli',
      });
      return;
    }

    // Validate based on question type
    if (question.questionType === 'CodeChallenge') {
      // CodeChallenge validation
      if (!question.allowedLanguages || question.allowedLanguages.length === 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Uyari',
          detail: 'En az bir programlama dili secilmeli',
        });
        return;
      }
      if (!question.testCases || question.testCases.length === 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Uyari',
          detail: 'En az bir test case eklenmeli',
        });
        return;
      }
      const validTestCases = question.testCases.filter(tc => tc.input.trim() || tc.expectedOutput.trim());
      if (validTestCases.length === 0) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Uyari',
          detail: 'Test case icerigi bos olamaz',
        });
        return;
      }
    } else if (question.questionType === 'FillInBlank') {
      // FillInBlank: either options (drag-drop) or correctAnswer (text input) required
      const validOptions = question.options.filter(o => o.optionText.trim());
      const hasCorrectOption = validOptions.some(o => o.isCorrect);
      const hasTextAnswer = question.correctAnswer?.trim();

      if (validOptions.length === 0 && !hasTextAnswer) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Uyari',
          detail: 'Secenekler veya metin cevap girilmeli',
        });
        return;
      }

      if (validOptions.length > 0 && !hasCorrectOption) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Uyari',
          detail: 'Dogru secenek isaretlenmeli',
        });
        return;
      }
    } else {
      // SingleChoice/MultipleChoice
      const validOptions = question.options.filter(o => o.optionText.trim());
      if (validOptions.length < 2) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Uyari',
          detail: 'En az 2 secenek girilmeli',
        });
        return;
      }
      const hasCorrect = validOptions.some(o => o.isCorrect);
      if (!hasCorrect) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Uyari',
          detail: 'En az bir dogru cevap secilmeli',
        });
        return;
      }
    }

    try {
      if (question.questionType === 'CodeChallenge') {
        // Use CodeChallenge specific endpoints
        const payload = {
          quizId: question.quizId,
          questionText: question.questionText,
          points: question.points,
          displayOrder: question.displayOrder,
          explanation: question.explanation,
          imageUrl: question.imageUrl,
          starterCode: question.starterCode,
          solutionCode: question.solutionCode,
          timeLimitSeconds: question.timeLimitSeconds,
          memoryLimitKb: question.memoryLimitKb,
          functionSignature: question.functionSignature,
          allowedLanguages: question.allowedLanguages,
          testCases: question.testCases,
        };

        if (isEditingQuestion && editingQuestionId) {
          await api.put(`/web/quizzes/questions/${editingQuestionId}/code-challenge`, payload);
          toast.current?.show({
            severity: 'success',
            summary: 'Basarili',
            detail: 'Kod sorusu guncellendi',
          });
        } else {
          await api.post('/web/quizzes/questions/code-challenge', payload);
          toast.current?.show({
            severity: 'success',
            summary: 'Basarili',
            detail: 'Kod sorusu eklendi',
          });
        }
      } else {
        const payload = {
          ...question,
          options: question.options.filter(o => o.optionText.trim()),
        };

        if (isEditingQuestion && editingQuestionId) {
          await api.put(`/web/quizzes/questions/${editingQuestionId}`, payload);
          toast.current?.show({
            severity: 'success',
            summary: 'Basarili',
            detail: 'Soru guncellendi',
          });
        } else {
          await api.post('/web/quizzes/questions', payload);
          toast.current?.show({
            severity: 'success',
            summary: 'Basarili',
            detail: 'Soru eklendi',
          });
        }
      }

      setQuestionDialog(false);
      // Reload quiz details
      if (currentQuiz) {
        const response = await api.get<ApiResponse<Quiz>>(`/web/quizzes/${currentQuiz.id}`);
        setCurrentQuiz(response.data.data);
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Islem basarisiz',
      });
    }
  };

  // Test Case Management
  const addTestCase = () => {
    setQuestion({
      ...question,
      testCases: [...(question.testCases || []), { ...emptyTestCase, displayOrder: (question.testCases?.length || 0) }],
    });
  };

  const removeTestCase = (index: number) => {
    const newTestCases = question.testCases?.filter((_, i) => i !== index) || [];
    setQuestion({ ...question, testCases: newTestCases });
  };

  const updateTestCase = (index: number, field: string, value: any) => {
    const newTestCases = [...(question.testCases || [])];
    newTestCases[index] = { ...newTestCases[index], [field]: value };
    setQuestion({ ...question, testCases: newTestCases });
  };

  // Solution Validation
  const validateSolution = async () => {
    if (!question.solutionCode?.trim()) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Uyari',
        detail: 'Cozum kodu girilmeli',
      });
      return;
    }

    if (!editingQuestionId) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Uyari',
        detail: 'Oncelikle soruyu kaydedin',
      });
      return;
    }

    setValidating(true);
    setValidationResult(null);

    try {
      const response = await api.post<ApiResponse<ValidationResult>>(
        `/web/quizzes/questions/${editingQuestionId}/validate`,
        {
          solutionCode: question.solutionCode,
          language: validationLanguage,
        }
      );
      setValidationResult(response.data.data);

      if (response.data.data.allPassed) {
        toast.current?.show({
          severity: 'success',
          summary: 'Basarili',
          detail: 'Tum test caseler gecti!',
        });
      } else {
        toast.current?.show({
          severity: 'warn',
          summary: 'Uyari',
          detail: `${response.data.data.testCasesPassed}/${response.data.data.totalTestCases} test case gecti`,
        });
      }
    } catch (error: any) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: error.response?.data?.message || 'Dogrulama basarisiz',
      });
    } finally {
      setValidating(false);
    }
  };

  const confirmDeleteQuestion = (questionData: QuizQuestion) => {
    confirmDialog({
      message: 'Bu soruyu silmek istediginize emin misiniz?',
      header: 'Silme Onay',
      icon: 'pi pi-exclamation-triangle',
      acceptClassName: 'p-button-danger',
      acceptLabel: 'Evet',
      rejectLabel: 'Hayir',
      accept: () => deleteQuestion(questionData),
    });
  };

  const deleteQuestion = async (questionData: QuizQuestion) => {
    try {
      await api.delete(`/web/quizzes/questions/${questionData.id}`);
      toast.current?.show({
        severity: 'success',
        summary: 'Basarili',
        detail: 'Soru silindi',
      });
      // Reload quiz details
      if (currentQuiz) {
        const response = await api.get<ApiResponse<Quiz>>(`/web/quizzes/${currentQuiz.id}`);
        setCurrentQuiz(response.data.data);
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Hata',
        detail: 'Soru silinemedi',
      });
    }
  };

  // Option management
  const addOption = () => {
    setQuestion({
      ...question,
      options: [...question.options, { optionText: '', isCorrect: false, displayOrder: question.options.length }],
    });
  };

  const removeOption = (index: number) => {
    const newOptions = question.options.filter((_, i) => i !== index);
    setQuestion({ ...question, options: newOptions });
  };

  const updateOption = (index: number, field: string, value: any) => {
    const newOptions = [...question.options];

    if (field === 'isCorrect' && value && question.questionType === 'SingleChoice') {
      // For single choice, uncheck other options
      newOptions.forEach((o, i) => {
        if (i !== index) o.isCorrect = false;
      });
    }

    newOptions[index] = { ...newOptions[index], [field]: value };
    setQuestion({ ...question, options: newOptions });
  };

  // Templates
  const statusBodyTemplate = (rowData: Quiz) => {
    return (
      <Tag
        value={rowData.isPublished ? 'Yayinda' : 'Taslak'}
        severity={rowData.isPublished ? 'success' : 'warning'}
      />
    );
  };

  const courseBodyTemplate = (rowData: Quiz) => {
    return rowData.courseName;
  };

  const questionsBodyTemplate = (rowData: Quiz) => {
    return (
      <Button
        label={`${rowData.questionCount} Soru`}
        className="p-button-text p-button-sm"
        icon="pi pi-list"
        onClick={() => openQuestionsDialog(rowData)}
      />
    );
  };

  const actionsBodyTemplate = (rowData: Quiz) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-pencil"
          className="p-button-rounded p-button-text p-button-info"
          onClick={() => editQuiz(rowData)}
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
          onClick={() => confirmDeleteQuiz(rowData)}
          tooltip="Sil"
        />
      </div>
    );
  };

  const questionTypeTemplate = (questionData: QuizQuestion) => {
    const labels: Record<string, string> = {
      SingleChoice: 'Tek Secim',
      MultipleChoice: 'Coktan Secmeli',
      FillInBlank: 'Bosluk Doldurma',
      CodeChallenge: 'Kod Yazma',
    };
    const severities: Record<string, 'success' | 'info' | 'warning' | 'danger' | undefined> = {
      SingleChoice: undefined,
      MultipleChoice: 'info',
      FillInBlank: 'warning',
      CodeChallenge: 'success',
    };
    return <Tag value={labels[questionData.questionType] || questionData.questionType} severity={severities[questionData.questionType]} />;
  };

  const header = (
    <div className="flex justify-content-between align-items-center">
      <h5 className="m-0">Quizler</h5>
      <Button label="Yeni Quiz" icon="pi pi-plus" onClick={openNewQuiz} />
    </div>
  );

  const quizDialogFooter = (
    <>
      <Button label="Iptal" icon="pi pi-times" className="p-button-text" onClick={hideQuizDialog} />
      <Button label="Kaydet" icon="pi pi-check" onClick={saveQuiz} />
    </>
  );

  const questionDialogFooter = (
    <>
      <Button label="Iptal" icon="pi pi-times" className="p-button-text" onClick={hideQuestionDialog} />
      <Button label="Kaydet" icon="pi pi-check" onClick={saveQuestion} />
    </>
  );

  return (
    <AdminLayout>
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="card">
        <DataTable
          value={quizzes}
          lazy
          paginator
          first={lazyState.first}
          rows={lazyState.rows}
          totalRecords={totalRecords}
          onPage={onPage}
          loading={loading}
          header={header}
          emptyMessage="Quiz bulunamadi"
          rowsPerPageOptions={[10, 25, 50]}
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="{first} - {last} / {totalRecords}"
        >
          <Column field="title" header="Baslik" sortable style={{ minWidth: '200px' }} />
          <Column header="Kurs" body={courseBodyTemplate} style={{ minWidth: '200px' }} />
          <Column field="passingScore" header="Gecme Puani" sortable style={{ width: '120px' }} />
          <Column header="Sorular" body={questionsBodyTemplate} style={{ width: '120px' }} />
          <Column field="attemptCount" header="Deneme" sortable style={{ width: '100px' }} />
          <Column header="Durum" body={statusBodyTemplate} style={{ width: '100px' }} />
          <Column body={actionsBodyTemplate} header="Islemler" style={{ width: '12rem' }} />
        </DataTable>
      </div>

      {/* Quiz Dialog */}
      <Dialog
        visible={quizDialog}
        style={{ width: '550px' }}
        header={isEditMode ? 'Quiz Duzenle' : 'Yeni Quiz'}
        modal
        footer={quizDialogFooter}
        onHide={hideQuizDialog}
      >
        <div className="p-fluid">
          <div className="field mb-4">
            <label htmlFor="title" className="font-bold">Baslik *</label>
            <InputText
              id="title"
              value={quiz.title}
              onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
              required
              className={submitted && !quiz.title ? 'p-invalid' : ''}
            />
          </div>

          <div className="field mb-4">
            <label htmlFor="course" className="font-bold">Kurs *</label>
            <Dropdown
              id="course"
              value={quiz.courseId}
              options={courses}
              onChange={(e) => setQuiz({ ...quiz, courseId: e.value })}
              optionLabel="title"
              optionValue="id"
              placeholder="Kurs secin"
              className={submitted && !quiz.courseId ? 'p-invalid' : ''}
              disabled={isEditMode}
            />
          </div>

          <div className="field mb-4">
            <label htmlFor="description" className="font-bold">Aciklama</label>
            <InputTextarea
              id="description"
              value={quiz.description}
              onChange={(e) => setQuiz({ ...quiz, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="formgrid grid">
            <div className="field col-4 mb-4">
              <label htmlFor="passingScore" className="font-bold">Gecme Puani</label>
              <InputNumber
                id="passingScore"
                value={quiz.passingScore}
                onValueChange={(e) => setQuiz({ ...quiz, passingScore: e.value || 70 })}
                min={0}
                max={100}
                suffix="%"
              />
            </div>
            <div className="field col-4 mb-4">
              <label htmlFor="timeLimit" className="font-bold">Sure (dk)</label>
              <InputNumber
                id="timeLimit"
                value={quiz.timeLimit}
                onValueChange={(e) => setQuiz({ ...quiz, timeLimit: e.value || undefined })}
                min={0}
                placeholder="Sinirsiz"
              />
            </div>
            <div className="field col-4 mb-4">
              <label htmlFor="maxAttempts" className="font-bold">Max Deneme</label>
              <InputNumber
                id="maxAttempts"
                value={quiz.maxAttempts}
                onValueChange={(e) => setQuiz({ ...quiz, maxAttempts: e.value || 3 })}
                min={1}
              />
            </div>
          </div>

          <div className="field-checkbox mb-4">
            <Checkbox
              inputId="isActive"
              checked={quiz.isActive}
              onChange={(e) => setQuiz({ ...quiz, isActive: e.checked || false })}
            />
            <label htmlFor="isActive" className="ml-2">Aktif</label>
          </div>
        </div>
      </Dialog>

      {/* Questions Management Dialog */}
      <Dialog
        visible={questionsDialog}
        style={{ width: '900px' }}
        header={currentQuiz ? `${currentQuiz.title} - Sorular` : 'Sorular'}
        modal
        onHide={hideQuestionsDialog}
      >
        <div className="mb-3 flex justify-content-end">
          <Button label="Yeni Soru" icon="pi pi-plus" onClick={openNewQuestion} />
        </div>

        {questionsLoading ? (
          <div className="flex justify-content-center p-4">
            <i className="pi pi-spin pi-spinner" style={{ fontSize: '2rem' }}></i>
          </div>
        ) : (
          <DataTable
            value={currentQuiz?.questions || []}
            emptyMessage="Soru bulunamadi"
            sortField="displayOrder"
            sortOrder={1}
          >
            <Column field="displayOrder" header="#" style={{ width: '50px' }} />
            <Column
              field="questionText"
              header="Soru"
              style={{ minWidth: '300px' }}
              body={(row) => (
                <div style={{ maxWidth: '400px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.questionText}
                </div>
              )}
            />
            <Column header="Tip" body={questionTypeTemplate} style={{ width: '130px' }} />
            <Column field="points" header="Puan" style={{ width: '80px' }} />
            <Column
              header="Islemler"
              style={{ width: '120px' }}
              body={(row: QuizQuestion) => (
                <div className="flex gap-2">
                  <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-text p-button-info p-button-sm"
                    onClick={() => editQuestion(row)}
                  />
                  <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-text p-button-danger p-button-sm"
                    onClick={() => confirmDeleteQuestion(row)}
                  />
                </div>
              )}
            />
          </DataTable>
        )}
      </Dialog>

      {/* Question Dialog */}
      <Dialog
        visible={questionDialog}
        style={{ width: question.questionType === 'CodeChallenge' ? '900px' : '700px' }}
        header={isEditingQuestion ? 'Soru Duzenle' : 'Yeni Soru'}
        modal
        footer={questionDialogFooter}
        onHide={hideQuestionDialog}
      >
        <div className="p-fluid">
          <div className="field mb-4">
            <label htmlFor="questionType" className="font-bold">Soru Tipi *</label>
            <Dropdown
              id="questionType"
              value={question.questionType}
              options={questionTypes}
              onChange={(e) => setQuestion({ ...question, questionType: e.value })}
              optionLabel="label"
              optionValue="value"
            />
          </div>

          <div className="field mb-4">
            <label htmlFor="questionText" className="font-bold">Soru Metni *</label>
            <InputTextarea
              id="questionText"
              value={question.questionText}
              onChange={(e) => setQuestion({ ...question, questionText: e.target.value })}
              rows={3}
            />
          </div>

          {/* CodeChallenge specific fields */}
          {question.questionType === 'CodeChallenge' && (
            <div className="mb-4">
              <Message
                severity="info"
                className="mb-3 w-full"
                content={
                  <div className="flex flex-column gap-1">
                    <span className="font-bold">Kod Yazma Sorusu</span>
                    <span>Ogrenciler kod yazacak ve Judge0 ile otomatik degerlendirilecek.</span>
                  </div>
                }
              />

              <div className="field mb-4">
                <label className="font-bold">Izin Verilen Diller *</label>
                <MultiSelect
                  value={question.allowedLanguages}
                  options={supportedLanguages}
                  onChange={(e) => setQuestion({ ...question, allowedLanguages: e.value })}
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Dil secin"
                  display="chip"
                  className="w-full"
                />
              </div>

              <div className="field mb-4">
                <label htmlFor="functionSignature" className="font-bold">Fonksiyon Imzasi (Opsiyonel)</label>
                <InputText
                  id="functionSignature"
                  value={question.functionSignature}
                  onChange={(e) => setQuestion({ ...question, functionSignature: e.target.value })}
                  placeholder="Ornek: def sum(a: int, b: int) -> int"
                />
              </div>

              <div className="formgrid grid mb-4">
                <div className="field col-6">
                  <label htmlFor="timeLimitSeconds" className="font-bold">Sure Limiti (sn)</label>
                  <InputNumber
                    id="timeLimitSeconds"
                    value={question.timeLimitSeconds}
                    onValueChange={(e) => setQuestion({ ...question, timeLimitSeconds: e.value || 5 })}
                    min={1}
                    max={30}
                  />
                </div>
                <div className="field col-6">
                  <label htmlFor="memoryLimitKb" className="font-bold">Bellek Limiti (KB)</label>
                  <InputNumber
                    id="memoryLimitKb"
                    value={question.memoryLimitKb}
                    onValueChange={(e) => setQuestion({ ...question, memoryLimitKb: e.value || 128000 })}
                    min={16000}
                    max={512000}
                  />
                </div>
              </div>

              <div className="field mb-4">
                <label htmlFor="starterCode" className="font-bold">Baslangic Kodu (Opsiyonel)</label>
                <InputTextarea
                  id="starterCode"
                  value={question.starterCode}
                  onChange={(e) => setQuestion({ ...question, starterCode: e.target.value })}
                  rows={4}
                  placeholder="Ogrenciye gosterilecek baslangic kodu..."
                  style={{ fontFamily: 'monospace' }}
                />
              </div>

              <div className="field mb-4">
                <label htmlFor="solutionCode" className="font-bold">Cozum Kodu (Admin Referans)</label>
                <InputTextarea
                  id="solutionCode"
                  value={question.solutionCode}
                  onChange={(e) => setQuestion({ ...question, solutionCode: e.target.value })}
                  rows={6}
                  placeholder="Dogru cozum kodu..."
                  style={{ fontFamily: 'monospace' }}
                />
                {isEditingQuestion && editingQuestionId && (
                  <div className="flex align-items-center gap-2 mt-2">
                    <Dropdown
                      value={validationLanguage}
                      options={question.allowedLanguages?.map(l => ({ label: supportedLanguages.find(sl => sl.value === l)?.label || l, value: l })) || []}
                      onChange={(e) => setValidationLanguage(e.value)}
                      placeholder="Dil sec"
                      className="w-8rem"
                    />
                    <Button
                      label={validating ? 'Dogruluyor...' : 'Cozumu Dogrula'}
                      icon={validating ? 'pi pi-spin pi-spinner' : 'pi pi-play'}
                      onClick={validateSolution}
                      disabled={validating || !question.solutionCode?.trim()}
                      className="p-button-sm"
                    />
                  </div>
                )}
              </div>

              {/* Validation Results */}
              {validationResult && (
                <div className={`p-3 border-round mb-4 ${validationResult.allPassed ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <div className="flex align-items-center gap-2 mb-2">
                    <i className={`pi ${validationResult.allPassed ? 'pi-check-circle text-green-600' : 'pi-exclamation-circle text-yellow-600'}`}></i>
                    <span className="font-bold">
                      {validationResult.testCasesPassed}/{validationResult.totalTestCases} Test Case Gecti
                    </span>
                    {validationResult.totalExecutionTimeMs && (
                      <span className="text-color-secondary">({validationResult.totalExecutionTimeMs.toFixed(2)} ms)</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {validationResult.testResults.map((tr, idx) => (
                      <Tag
                        key={idx}
                        value={`#${tr.testCaseNumber}: ${tr.passed ? 'Gecti' : tr.status}`}
                        severity={tr.passed ? 'success' : 'danger'}
                      />
                    ))}
                  </div>
                </div>
              )}

              <Divider />

              {/* Test Cases */}
              <div className="field mb-4">
                <div className="flex justify-content-between align-items-center mb-3">
                  <label className="font-bold">Test Caseler *</label>
                  <Button
                    label="Test Case Ekle"
                    icon="pi pi-plus"
                    className="p-button-sm p-button-outlined"
                    onClick={addTestCase}
                  />
                </div>

                {(!question.testCases || question.testCases.length === 0) && (
                  <Message severity="warn" text="En az bir test case eklenmeli" className="w-full mb-3" />
                )}

                {question.testCases?.map((tc, index) => (
                  <div key={index} className="surface-100 border-round p-3 mb-3">
                    <div className="flex justify-content-between align-items-center mb-2">
                      <span className="font-bold">Test Case #{index + 1}</span>
                      <div className="flex align-items-center gap-2">
                        <Checkbox
                          inputId={`hidden-${index}`}
                          checked={tc.isHidden || false}
                          onChange={(e) => updateTestCase(index, 'isHidden', e.checked)}
                        />
                        <label htmlFor={`hidden-${index}`} className="text-sm">Gizli</label>
                        <InputNumber
                          value={tc.points}
                          onValueChange={(e) => updateTestCase(index, 'points', e.value || 1)}
                          min={1}
                          suffix=" puan"
                          className="w-6rem"
                          inputStyle={{ width: '100%' }}
                        />
                        <Button
                          icon="pi pi-trash"
                          className="p-button-rounded p-button-text p-button-danger p-button-sm"
                          onClick={() => removeTestCase(index)}
                        />
                      </div>
                    </div>
                    <div className="formgrid grid">
                      <div className="field col-6">
                        <label className="text-sm font-medium">Girdi (Input)</label>
                        <InputTextarea
                          value={tc.input}
                          onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                          rows={2}
                          style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                          placeholder="Ornek: 5\n3"
                        />
                      </div>
                      <div className="field col-6">
                        <label className="text-sm font-medium">Beklenen Cikti</label>
                        <InputTextarea
                          value={tc.expectedOutput}
                          onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                          rows={2}
                          style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                          placeholder="Ornek: 8"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {question.questionType === 'FillInBlank' && (
            <div className="mb-4">
              <Message
                severity="info"
                className="mb-3 w-full"
                content={
                  <div className="flex flex-column gap-1">
                    <span className="font-bold">Surukle-Birak Modu</span>
                    <span>Soru metninde bosluk icin <code className="bg-gray-200 px-1 border-round">{'{{blank}}'}</code> kullanin.</span>
                    <span>Ornek: "Turkiye'nin baskenti {'{{blank}}'} sehridir."</span>
                  </div>
                }
              />

              <div className="field mb-4">
                <label className="font-bold mb-2 block">Secenekler *</label>
                <small className="text-color-secondary block mb-3">
                  Dogru cevabi isaretleyin. Diger secenekler yanlis secenek olarak gosterilecek.
                </small>

                {question.options.map((option, index) => (
                  <div key={index} className="flex align-items-center gap-2 mb-2">
                    <Checkbox
                      checked={option.isCorrect || false}
                      onChange={(e) => {
                        // For FillInBlank, only one option can be correct
                        const newOptions = question.options.map((opt, i) => ({
                          ...opt,
                          isCorrect: i === index ? e.checked : false
                        }));
                        setQuestion({ ...question, options: newOptions });
                      }}
                    />
                    <InputText
                      value={option.optionText}
                      onChange={(e) => updateOption(index, 'optionText', e.target.value)}
                      placeholder={`Secenek ${index + 1}`}
                      className="flex-grow-1"
                    />
                    {question.options.length > 2 && (
                      <Button
                        icon="pi pi-times"
                        className="p-button-rounded p-button-text p-button-danger p-button-sm"
                        onClick={() => removeOption(index)}
                      />
                    )}
                  </div>
                ))}

                <Button
                  label="Secenek Ekle"
                  icon="pi pi-plus"
                  className="p-button-text p-button-sm mt-2"
                  onClick={addOption}
                />
              </div>

              <Divider />

              <div className="field mb-4">
                <label htmlFor="correctAnswer" className="font-bold">Metin Cevap (Opsiyonel)</label>
                <InputText
                  id="correctAnswer"
                  value={question.correctAnswer}
                  onChange={(e) => setQuestion({ ...question, correctAnswer: e.target.value })}
                  placeholder="Metin girisi modu icin dogru cevap"
                />
                <small className="text-color-secondary">Secenek yoksa veya metin girisi isteniyorsa kullanilir</small>
              </div>
            </div>
          )}

          {(question.questionType === 'SingleChoice' || question.questionType === 'MultipleChoice') && (
            <div className="field mb-4">
              <label className="font-bold mb-2 block">Secenekler *</label>
              <small className="text-color-secondary block mb-3">
                {question.questionType === 'SingleChoice'
                  ? 'Dogru cevabi isaretleyin (tek secenek)'
                  : 'Dogru cevaplari isaretleyin (birden fazla secilebilir)'}
              </small>

              {question.options.map((option, index) => (
                <div key={index} className="flex align-items-center gap-2 mb-2">
                  <Checkbox
                    checked={option.isCorrect || false}
                    onChange={(e) => updateOption(index, 'isCorrect', e.checked)}
                  />
                  <InputText
                    value={option.optionText}
                    onChange={(e) => updateOption(index, 'optionText', e.target.value)}
                    placeholder={`Secenek ${index + 1}`}
                    className="flex-grow-1"
                  />
                  {question.options.length > 2 && (
                    <Button
                      icon="pi pi-times"
                      className="p-button-rounded p-button-text p-button-danger p-button-sm"
                      onClick={() => removeOption(index)}
                    />
                  )}
                </div>
              ))}

              <Button
                label="Secenek Ekle"
                icon="pi pi-plus"
                className="p-button-text p-button-sm mt-2"
                onClick={addOption}
              />
            </div>
          )}

          <div className="formgrid grid">
            <div className="field col-6 mb-4">
              <label htmlFor="points" className="font-bold">Puan</label>
              <InputNumber
                id="points"
                value={question.points}
                onValueChange={(e) => setQuestion({ ...question, points: e.value || 1 })}
                min={1}
              />
            </div>
            <div className="field col-6 mb-4">
              <label htmlFor="displayOrder" className="font-bold">Siralama</label>
              <InputNumber
                id="displayOrder"
                value={question.displayOrder}
                onValueChange={(e) => setQuestion({ ...question, displayOrder: e.value || 0 })}
                min={0}
              />
            </div>
          </div>

          <div className="field mb-4">
            <label htmlFor="explanation" className="font-bold">Aciklama (Opsiyonel)</label>
            <InputTextarea
              id="explanation"
              value={question.explanation}
              onChange={(e) => setQuestion({ ...question, explanation: e.target.value })}
              rows={2}
              placeholder="Cevap sonrasi gosterilecek aciklama"
            />
          </div>

          <div className="field mb-4">
            <label htmlFor="imageUrl" className="font-bold">Gorsel URL (Opsiyonel)</label>
            <InputText
              id="imageUrl"
              value={question.imageUrl}
              onChange={(e) => setQuestion({ ...question, imageUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </Dialog>
    </AdminLayout>
  );
}
