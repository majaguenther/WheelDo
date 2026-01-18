import type { Task, Category, User, Urgency, Effort, TaskStatus, RecurrenceType } from '@/generated/prisma/client'

// Re-export Prisma types
export type { Task, Category, User, Urgency, Effort, TaskStatus, RecurrenceType }

// Extended task type with relations
export type TaskWithRelations = Task & {
  category: Category | null
  parent: Task | null
  children: Task[]
  user: Pick<User, 'id' | 'name' | 'image'>
}

// Task creation input
export type CreateTaskInput = {
  title: string
  body?: string
  duration?: number
  location?: string
  effort?: Effort
  urgency?: Urgency
  deadline?: Date
  recurrenceType?: RecurrenceType
  recurrenceRule?: string
  parentId?: string
  categoryId?: string
}

// Task update input
export type UpdateTaskInput = Partial<CreateTaskInput> & {
  status?: TaskStatus
}

// Filter options for task list
export type TaskFilters = {
  status?: TaskStatus[]
  urgency?: Urgency[]
  effort?: Effort[]
  categoryId?: string
  maxDuration?: number
  hasDeadline?: boolean
  search?: string
}

// Location data from Geoapify
export type LocationData = {
  formatted: string
  lat: number
  lon: number
  city?: string
  country?: string
}

// Theme settings
export type ThemeSettings = {
  primaryColor: string
  secondaryColor: string
  accentColor: string
}

