// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.1.98:52563/api';

// API Endpoints - Web Admin Panel
export const API_ENDPOINTS = {
  // Auth (Web)
  LOGIN: '/web/auth/login',
  REFRESH_TOKEN: '/web/auth/refresh-token',
  CURRENT_USER: '/web/auth/me',

  // Users
  USERS: '/web/users',
  CREATE_USER: '/web/users',
  USER_DETAIL: (id: string) => `/web/users/${id}`,
  USER_ACTIVATE: (id: string) => `/web/users/${id}/activate`,
  USER_DEACTIVATE: (id: string) => `/web/users/${id}/deactivate`,

  // Courses
  COURSES: '/web/courses',
  COURSE_DETAIL: (id: string) => `/web/courses/${id}`,
  COURSE_PUBLISH: (id: string) => `/web/courses/${id}/publish`,
  COURSE_UNPUBLISH: (id: string) => `/web/courses/${id}/unpublish`,

  // Categories
  CATEGORIES: '/web/categories',
  CATEGORY_DETAIL: (id: string) => `/web/categories/${id}`,

  // Analytics
  DASHBOARD: '/web/analytics/dashboard',
  REVENUE: '/web/analytics/revenue',
  COURSE_STATS: (id: string) => `/web/analytics/course-stats/${id}`,

  // Applications (Multi-tenant)
  APPLICATIONS: '/web/applications',
  APPLICATION_DETAIL: (id: string) => `/web/applications/${id}`,
  APPLICATION_COURSES: (id: string) => `/web/applications/${id}/courses`,
  APPLICATION_COURSE: (appId: string, courseId: string) => `/web/applications/${appId}/courses/${courseId}`,

  // Quizzes
  QUIZZES: '/web/quizzes',
  QUIZ_DETAIL: (id: string) => `/web/quizzes/${id}`,
  QUIZ_PUBLISH: (id: string) => `/web/quizzes/${id}/publish`,
  QUIZ_UNPUBLISH: (id: string) => `/web/quizzes/${id}/unpublish`,
  QUIZ_STATS: (id: string) => `/web/quizzes/${id}/stats`,
  QUIZ_QUESTIONS_REORDER: (id: string) => `/web/quizzes/${id}/questions/reorder`,
  QUIZ_QUESTIONS: '/web/quizzes/questions',
  QUIZ_QUESTION_DETAIL: (id: string) => `/web/quizzes/questions/${id}`,

  // Lessons
  LESSONS: '/web/lessons',
  LESSON_DETAIL: (id: string) => `/web/lessons/${id}`,
  LESSON_PUBLISH: (id: string) => `/web/lessons/${id}/publish`,
  LESSON_UNPUBLISH: (id: string) => `/web/lessons/${id}/unpublish`,
  LESSONS_BY_SECTION: (sectionId: string) => `/web/lessons/section/${sectionId}`,
  LESSONS_REORDER: (sectionId: string) => `/web/lessons/section/${sectionId}/reorder`,
  LESSONS_BULK_UPDATE: '/web/lessons/bulk-update',
};
