import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { ScheduleApi, type ScheduleResponse } from '@lib/api/schedule'
import type { ScheduleListItem } from './types'
import dayjs from 'dayjs'

// 레거시 필드를 포함한 타입 정의
interface ScheduleResponseWithLegacyFields extends ScheduleResponse {
  reminderEnabled?: boolean
}

function normalizeEnabled(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1'
  return false
}

// 중복 제거: 데이터 변환 유틸리티 함수
function convertScheduleResponseToListItem(item: ScheduleResponseWithLegacyFields): ScheduleListItem {
  return {
    id: item.id,
    title: item.title,
    scheduleDate: item.scheduleDate,
    startTime: item.startTime,
    endTime: item.endTime,
    color: item.color,
    isAllDay: item.isAllDay,
    description: item.description,
    isReminderEnabled: normalizeEnabled(item.isReminderEnabled ?? item.reminderEnabled),
    reminderMinutes: item.reminderMinutes,
  }
}

function sortListItems(items: ScheduleListItem[]): ScheduleListItem[] {
  const next = [ ...items ]
  next.sort((a, b) => {
    if (a.scheduleDate !== b.scheduleDate) return a.scheduleDate < b.scheduleDate ? -1 : 1
    const aKey = `${a.startTime ?? ''}`
    const bKey = `${b.startTime ?? ''}`
    if (aKey !== bKey) return aKey < bKey ? -1 : 1
    return a.title.localeCompare(b.title)
  })
  return next
}

function isScheduleInPast(item: ScheduleListItem): boolean {
  const now = dayjs()
  const scheduleDateTime = dayjs(`${item.scheduleDate} ${item.startTime || '00:00'}`, 'YYYY-MM-DD HH:mm')
  return scheduleDateTime.isBefore(now)
}

export interface UseCalendarDataOptions {
  startDate: string
  endDate: string
  handleShowMessage?: (message: string) => void
}

export function useCalendarData({ startDate, endDate, handleShowMessage }: UseCalendarDataOptions) {
  const [listItems, setListItems] = useState<ScheduleListItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [togglingReminders, setTogglingReminders] = useState<Set<string>>(new Set())

  function handleBuildStateFromSchedules(items: ScheduleResponse[]) {
    const flat: ScheduleListItem[] = items.map(convertScheduleResponseToListItem)
    setListItems(sortListItems(flat))
  }

  useEffect(() => {
    setIsLoading(true)
    ScheduleApi.getRange(startDate, endDate)
      .then(handleBuildStateFromSchedules)
      .finally(() => setIsLoading(false))
  }, [startDate, endDate])

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return listItems
    return listItems.filter(it =>
      it.title.toLowerCase().includes(q) ||
      (it.description?.toLowerCase().includes(q) ?? false)
    )
  }, [listItems, query])

  // 성능 최적화: useCallback 사용
  const isTogglingReminder = useCallback((scheduleId: string) => {
    return togglingReminders.has(scheduleId)
  }, [togglingReminders])

  // 토글 검증 함수 분리
  function validateReminderToggle(scheduleId: string, enabled: boolean): ScheduleListItem | null {
    const target = listItems.find(it => it.id === scheduleId)
    if (!target || !target.startTime) {
      if (handleShowMessage) handleShowMessage('시작 시간이 있는 일정만 알림을 켤 수 있습니다')
      return null
    }

    if (isScheduleInPast(target)) {
      if (handleShowMessage) handleShowMessage('지난 일정은 알림을 설정할 수 없습니다')
      return null
    }

    return target
  }

  // 상태 업데이트 함수 분리
  function updateReminderState(scheduleId: string, enabled: boolean): void {
    setListItems(prev => prev.map(it => it.id === scheduleId ? { ...it, isReminderEnabled: enabled } : it))
  }

  // 에러 처리 함수 분리
  function handleReminderToggleError(scheduleId: string, enabled: boolean, error: unknown): void {
    updateReminderState(scheduleId, !enabled) // 원래 상태로 복원
    const errorMessage = error instanceof Error ? error.message : '알림 상태 변경에 실패했습니다'
    if (handleShowMessage) handleShowMessage(errorMessage)
    console.error('[REMINDER] toggle failed', { scheduleId, enabled, error })
  }

  async function handleListItemReminderToggle(scheduleId: string, enabled: boolean) {
    // 이미 토글 중인 경우 무시
    if (togglingReminders.has(scheduleId)) {
      return
    }

    // 검증
    const target = validateReminderToggle(scheduleId, enabled)
    if (!target) return

    try {
      // 토글 중 상태 추가
      setTogglingReminders(prev => {
        const next = new Set(prev)
        next.add(scheduleId)
        return next
      })
      
      // UI를 먼저 업데이트 (optimistic update)
      updateReminderState(scheduleId, enabled)
      
      // 서버 API 호출
      await ScheduleApi.setReminderEnabled(scheduleId, enabled)
      
      // 성공 메시지 표시
      if (handleShowMessage) handleShowMessage(enabled ? '알림을 켰습니다' : '알림을 껐습니다')
      
    } catch (error) {
      // 실패 시 에러 처리
      handleReminderToggleError(scheduleId, enabled, error)
    } finally {
      // 토글 중 상태 제거
      setTogglingReminders(prev => {
        const next = new Set(prev)
        next.delete(scheduleId)
        return next
      })
    }
  }

  async function handleListItemDelete(scheduleId: string) {
    const target = listItems.find(it => it.id === scheduleId)
    if (!target) return

    // UI에서 즉시 제거
    setListItems(prev => prev.filter(it => it.id !== scheduleId))
    
    if (handleShowMessage) handleShowMessage('일정을 삭제했습니다')

    try {
      // 즉시 서버에 삭제 요청
      await ScheduleApi.remove(scheduleId)
    } catch (error) {
      // 삭제 실패 시 UI에서 복원
      setListItems(prev => sortListItems([ ...prev, target ]))
      const errorMessage = error instanceof Error ? error.message : '일정 삭제에 실패했습니다'
      if (handleShowMessage) handleShowMessage(errorMessage)
      console.error('[DELETE] failed', { scheduleId, error })
    }
  }

  function handleDialogCreated(item: ScheduleResponse) {
    const newItem = convertScheduleResponseToListItem(item)
    setListItems(prev => [newItem, ...prev])
  }

  function handleEditDialogUpdated(item: ScheduleResponse) {
    const updatedItem = convertScheduleResponseToListItem(item)
    setListItems(prev => prev.map(it => it.id === item.id ? updatedItem : it))
  }

  return {
    listItems,
    isLoading,
    query,
    setQuery,
    filteredItems,
    handleListItemReminderToggle,
    handleListItemDelete,
    handleDialogCreated,
    handleEditDialogUpdated,
    isTogglingReminder,
  }
}


