// Common types used across the application

export type Status = 'active' | 'completed' | 'failed' | 'running' | 'pending'

export type Severity = 'info' | 'warning' | 'error' | 'success'

export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt?: Date
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface FilterParams {
  searchQuery?: string
  status?: Status[]
  dateFrom?: Date
  dateTo?: Date
}
