import { http } from './http'

export interface CommonResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface ScheduleRequest {
  title: string
  description?: string
  color?: string
  scheduleDate: string
  startTime?: string
  endTime?: string
  isAllDay?: boolean
  isRecurring?: boolean
  recurrenceRule?: string
  reminderMinutes?: number
  isReminderEnabled?: boolean
}

export interface ScheduleResponse {
  id: string
  title: string
  description?: string
  color?: string
  scheduleDate: string
  startTime?: string
  endTime?: string
  isAllDay: boolean
  isRecurring: boolean
  recurrenceRule?: string
  status: string
  completionRate?: number
  isOverdue: boolean
  reminderMinutes?: number
  isReminderEnabled: boolean
  createdAt: string
  updatedAt: string
}

export const ScheduleApi = {
  async getRange(startDate: string, endDate: string): Promise<ScheduleResponse[]> {
    const url = `/api/schedule/range?startDate=${startDate}&endDate=${endDate}`
    const res = await http<CommonResponse<ScheduleResponse[]>>(url)
    return res.data
  },
  async getByDate(date: string): Promise<ScheduleResponse[]> {
    const res = await http<CommonResponse<ScheduleResponse[]>>(`/api/schedule/date/${date}`)
    return res.data
  },
  async create(payload: ScheduleRequest): Promise<ScheduleResponse> {
    const res = await http<CommonResponse<ScheduleResponse>>('/api/schedule', {
      method: 'POST',
      body: JSON.stringify(payload)
    })
    return res.data
  },
  async update(scheduleId: string, payload: ScheduleRequest): Promise<ScheduleResponse> {
    const res = await http<CommonResponse<ScheduleResponse>>(`/api/schedule/${scheduleId}`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    })
    return res.data
  },
  async remove(scheduleId: string): Promise<void> {
    const res = await http<CommonResponse<void>>(`/api/schedule/${scheduleId}`, {
      method: 'DELETE'
    })
    return res.data
  },
}

