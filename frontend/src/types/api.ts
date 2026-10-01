export type Role = 'ADMIN' | 'USER'

export type AuthenticatedUser = {
  id: string
  email: string
  role: Role
  companyId: string
}

export type LoginResponse = {
  accessToken: string
  user: AuthenticatedUser
}

export type UserSummary = {
  id: string
  email: string
  role: Role
  companyId: string
  createdAt: string
  hasActiveLicense: boolean
}

export type License = {
  id: string
  userId: string
  companyId: string
  status: 'ACTIVE' | 'REVOKED'
  assignedAt: string
}

export type DailyUsage = {
  date: string
  count: number
}

export type UsageSummary = {
  totalCalls: number
  usageLimit: number
  percentage: number
  alertThreshold: number
  history: DailyUsage[]
}

export type ApiErrorBody = {
  statusCode: number
  message: string | string[]
  error: string
  timestamp: string
  path: string
}
