export interface BaseEntity {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status: number;
  success: boolean;
  timestamp: number;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
  };
  status: number;
  timestamp: number;
}

export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: {
    field: string;
    direction: 'asc' | 'desc';
  };
  page?: number;
  pageSize?: number;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface FormState<T = any> {
  data: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
} 