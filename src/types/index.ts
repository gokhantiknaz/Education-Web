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
