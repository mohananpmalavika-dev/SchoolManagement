/**
 * Common Types used across the application
 */

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  filters?: Record<string, any>;
}

export interface DateRangeFilter {
  startDate?: string | Date;
  endDate?: string | Date;
}

export interface TenantContext {
  tenantId: string;
  subdomain: string;
  customDomain?: string;
}

export interface UserContext {
  userId: string;
  email: string;
  role: string;
  permissions?: string[];
  tenantId: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface FileUpload {
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}

export interface Address {
  street?: string;
  city: string;
  county: string;
  postalCode?: string;
  country: string;
}

export interface Money {
  amount: number; // In minor units (cents)
  currency: string;
}

export interface Contact {
  email?: string;
  phone: string;
  alternatePhone?: string;
}
