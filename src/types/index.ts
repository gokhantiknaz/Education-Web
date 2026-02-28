// User types
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  profileImageUrl?: string;
  role: 'Admin' | 'ContentManager' | 'Student';
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  bio?: string;
  profession?: string;
  company?: string;
  location?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: 'Admin' | 'ContentManager' | 'Student';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// Course types
export interface Course {
  id: string;
  categoryId: string;
  categoryName?: string;
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription?: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  instructorName: string;
  instructorBio?: string;
  instructorImageUrl?: string;
  price: number;
  discountPrice?: number;
  currency: string;
  durationMinutes: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  language: string;
  isFeatured: boolean;
  isPublished: boolean;
  publishedAt?: string;
  viewCount: number;
  enrollmentCount: number;
  averageRating: number;
  createdAt: string;
  updatedAt?: string;
  applications?: CourseApplication[];
}

export interface CourseApplication {
  id: string;
  appId: string;
  name: string;
}

export interface CreateCourseRequest {
  categoryId: string;
  title: string;
  shortDescription: string;
  fullDescription?: string;
  thumbnailUrl?: string;
  previewVideoUrl?: string;
  instructorName: string;
  instructorBio?: string;
  price: number;
  discountPrice?: number;
  durationMinutes: number;
  level: string;
  language: string;
  isFeatured?: boolean;
  applicationIds?: string[];
}

// Category types
export interface Category {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  displayOrder: number;
  isActive: boolean;
  coursesCount?: number;
}

// Dashboard types
export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalEnrollments: number;
  totalRevenue: number;
  recentUsers: User[];
  recentEnrollments: {
    userName: string;
    courseName: string;
    enrolledAt: string;
  }[];
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Application types (Multi-tenant)
export interface Application {
  id: string;
  appId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  splashImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  androidPackageName?: string;
  iosBundleId?: string;
  isActive: boolean;
  allowRegistration: boolean;
  requireEnrollment: boolean;
  createdAt: string;
  updatedAt?: string;
  courseCount?: number;
  courses?: ApplicationCourse[];
}

export interface ApplicationCourse {
  id: string;
  courseId: string;
  courseTitle: string;
  courseThumbnailUrl?: string;
  displayOrder: number;
  isDefault: boolean;
}

export interface CreateApplicationRequest {
  appId: string;
  name: string;
  description?: string;
  logoUrl?: string;
  splashImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  androidPackageName?: string;
  iosBundleId?: string;
  isActive?: boolean;
  allowRegistration?: boolean;
  requireEnrollment?: boolean;
}

export interface UpdateApplicationRequest {
  name?: string;
  description?: string;
  logoUrl?: string;
  splashImageUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  androidPackageName?: string;
  iosBundleId?: string;
  isActive?: boolean;
  allowRegistration?: boolean;
  requireEnrollment?: boolean;
}

export interface AssignCourseRequest {
  courseId: string;
  displayOrder?: number;
  isDefault?: boolean;
}

// Quiz types
export interface Quiz {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  description?: string;
  passingScore: number;
  timeLimit?: number;
  maxAttempts: number;
  isActive: boolean;
  isPublished: boolean;
  questionCount: number;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quizId: string;
  questionText: string;
  questionType: 'SingleChoice' | 'MultipleChoice' | 'FillInBlank';
  points: number;
  displayOrder: number;
  correctAnswer?: string;
  explanation?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  questionId: string;
  optionText: string;
  isCorrect: boolean;
  displayOrder: number;
}

export interface CreateQuizRequest {
  courseId: string;
  title: string;
  description?: string;
  passingScore?: number;
  timeLimit?: number;
  maxAttempts?: number;
  isActive?: boolean;
}

export interface UpdateQuizRequest {
  title: string;
  description?: string;
  passingScore?: number;
  timeLimit?: number;
  maxAttempts?: number;
  isActive?: boolean;
}

export interface CreateQuestionRequest {
  quizId: string;
  questionText: string;
  questionType: string;
  points?: number;
  displayOrder?: number;
  correctAnswer?: string;
  explanation?: string;
  imageUrl?: string;
  options: CreateOptionRequest[];
}

export interface UpdateQuestionRequest {
  questionText: string;
  questionType: string;
  points?: number;
  displayOrder?: number;
  correctAnswer?: string;
  explanation?: string;
  imageUrl?: string;
  options: CreateOptionRequest[];
}

export interface CreateOptionRequest {
  optionText: string;
  isCorrect?: boolean;
  displayOrder?: number;
}

export interface QuizStats {
  quizId: string;
  quizTitle: string;
  totalAttempts: number;
  passedAttempts: number;
  failedAttempts: number;
  averageScore: number;
  passRate: number;
  averageTimeSeconds: number;
}

// Lesson types
export interface Lesson {
  id: string;
  title: string;
  description?: string;
  durationSeconds?: number;
  isFree: boolean;
  displayOrder: number;
  isPublished: boolean;
  videoUrl?: string;
  videoId?: string;
  // Document fields
  documentUrl?: string;
  documentName?: string;
  documentType?: string;
  documentSize?: number;
  isDocumentUploaded: boolean;
  contentType: 'Video' | 'Document' | 'VideoAndDocument';
  hasVideo: boolean;
  hasDocument: boolean;
  sectionId: string;
  sectionTitle: string;
  courseId: string;
  courseTitle: string;
  createdAt: string;
  updatedAt: string;
  completionCount?: number;
  averageWatchPercentage?: number;
}

export interface CourseSection {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  displayOrder: number;
  lessonCount?: number;
  lessons?: Lesson[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSectionRequest {
  courseId: string;
  title: string;
  description?: string;
  displayOrder?: number;
}

export interface UpdateSectionRequest {
  title: string;
  description?: string;
  displayOrder?: number;
}

export interface CreateLessonRequest {
  courseId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  videoId?: string;
  durationSeconds?: number;
  isFree?: boolean;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface UpdateLessonRequest {
  title?: string;
  description?: string;
  videoUrl?: string;
  videoId?: string;
  durationSeconds?: number;
  isFree?: boolean;
  displayOrder?: number;
  isPublished?: boolean;
}

export interface BulkUpdateLessonsRequest {
  lessonIds: string[];
  isPublished?: boolean;
  isFree?: boolean;
}

// Promo Code types
export interface PromoCode {
  id: string;
  code: string;
  description?: string;
  discountType: 'Percentage' | 'FixedAmount';
  discountValue: number;
  courseId?: string;
  courseTitle?: string;
  maxUsageCount: number;
  usageCount: number;
  maxUsagePerUser: number;
  minimumOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
  createdAt: string;
  isValid?: boolean;
  remainingUsage?: number;
  usagePercentage?: number;
}

export interface PromoCodeDetail extends PromoCode {
  recentUsages: PromoCodeUsage[];
}

export interface PromoCodeUsage {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderId?: string;
  discountApplied: number;
  usedAt: string;
}

export interface CreatePromoCodeRequest {
  code: string;
  description?: string;
  discountType: 'Percentage' | 'FixedAmount';
  discountValue: number;
  courseId?: string;
  maxUsageCount?: number;
  maxUsagePerUser?: number;
  minimumOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}

export interface UpdatePromoCodeRequest {
  description?: string;
  discountType?: 'Percentage' | 'FixedAmount';
  discountValue?: number;
  courseId?: string;
  maxUsageCount?: number;
  maxUsagePerUser?: number;
  minimumOrderAmount?: number;
  maxDiscountAmount?: number;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}

// Enrollment types
export interface Enrollment {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userProfileImage?: string;
  courseId: string;
  courseTitle: string;
  courseThumbnail?: string;
  progressPercentage: number;
  enrolledAt: string;
  lastAccessedAt?: string;
  completedAt?: string;
  expiresAt?: string;
  isActive: boolean;
  hasCertificate: boolean;
}

export interface CreateEnrollmentRequest {
  userId: string;
  courseId: string;
  expiresAt?: string;
}

export interface UpdateEnrollmentRequest {
  progressPercentage?: number;
  isActive?: boolean;
  expiresAt?: string;
}

// System Settings types
export interface StorageSettings {
  provider: 'Local' | 'AmazonS3' | 'AzureBlob';
  awsAccessKeyId?: string;
  awsSecretAccessKey?: string;
  awsBucketName?: string;
  awsRegion?: string;
  cdnBaseUrl?: string;
  azureConnectionString?: string;
  azureContainerName?: string;
}

export interface AwsRegion {
  value: string;
  label: string;
}

export interface StorageConnectionTestResult {
  success: boolean;
  message?: string;
  bucketLocation?: string;
}

export interface GeneralSettings {
  maxLessonNameLength?: number | null;
  maxCourseNameLength?: number | null;
  maxVideoDuration?: number | null;
  maxDocumentSize?: number | null;
  maxDescriptionLength?: number | null;
}

// Notification types
export type RecipientType = 'All' | 'Role' | 'SpecificUsers';
export type NotificationBatchStatus = 'Pending' | 'Processing' | 'Completed' | 'Failed';

export interface SendNotificationRequest {
  title: string;
  message: string;
  type?: string;
  actionUrl?: string;
  recipientType: RecipientType;
  targetRole?: string;
  targetUserIds?: string[];
  sendPush: boolean;
  relatedCourseId?: string;
  scheduledAt?: string;
}

export interface AnnounceNewCourseRequest {
  courseId: string;
  customTitle?: string;
  customMessage?: string;
  sendPush: boolean;
  recipientType: RecipientType;
  targetRole?: string;
}

export interface NotificationBatch {
  id: string;
  senderId: string;
  senderName?: string;
  title: string;
  message: string;
  type?: string;
  recipientType: RecipientType;
  targetRole?: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: NotificationBatchStatus;
  sendPush: boolean;
  relatedCourseId?: string;
  relatedCourseName?: string;
  createdAt: string;
  completedAt?: string;
}

export interface AdminNotification {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  senderId?: string;
  senderName?: string;
  title: string;
  message: string;
  type?: string;
  actionUrl?: string;
  isRead: boolean;
  readAt?: string;
  isPushSent: boolean;
  pushSentAt?: string;
  isScheduled: boolean;
  scheduledAt?: string;
  isBroadcast: boolean;
  batchId?: string;
  relatedCourseId?: string;
  relatedCourseName?: string;
  createdAt: string;
}

export interface NotificationStats {
  totalSent: number;
  totalRead: number;
  totalUnread: number;
  readRate: number;
  totalPushSent: number;
  pendingScheduled: number;
  totalBatches: number;
  failedBatches: number;
}
