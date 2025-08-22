import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Snackbar, Stack, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import { ScheduleApi, ScheduleRequest, ScheduleResponse } from '../../lib/api/schedule'
import { CalendarToolbar, type ViewMode } from '../../lib/components/CalendarToolbar'
import { ScheduleCreateDialog } from '../../lib/components/ScheduleCreateDialog'
import { ScheduleEditDialog } from '../../lib/components/ScheduleEditDialog'
import { ScheduleDetailDialog } from '../../lib/components/ScheduleDetailDialog'
import { CalendarList } from '../../lib/components/CalendarList'
import { CalendarSidebar } from '../../lib/components/CalendarSidebar'
import { CalendarListSkeleton } from '../../lib/components/CalendarListSkeleton'
import type { ScheduleListItem } from './calendar/types'
import { useNotificationsSSE } from '../../lib/sse/useNotificationsSSE'
import type { ReminderEventPayload, TestEventPayload } from '../../lib/sse/types'

export function CalendarPage() {
  const [cursor, setCursor] = useState<Dayjs>(dayjs())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [view, setView] = useState<ViewMode>('month')
  const [listItems, setListItems] = useState<ScheduleListItem[]>([])
  const [editTarget, setEditTarget] = useState<ScheduleListItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState<ScheduleListItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  const [pendingDelete, setPendingDelete] = useState<ScheduleListItem | null>(null)
  const pendingDeleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [query, setQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifData, setNotifData] = useState<{ title: string, message?: string, scheduleDate?: string, startTime?: string, endTime?: string } | null>(null)

  function normalizeEnabled(value: unknown): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1'
    return false
  }

  function handleReminderEvent(payload: ReminderEventPayload) {
    const local = listItems.find(it => it.id === payload.scheduleId) || null
    const title = payload.title || local?.title || '일정 알림'
    const message = (payload.message && payload.message.trim().length > 0) ? payload.message : (local?.description || '')
    const startTime = payload.startTime || local?.startTime
    const endTime = local?.endTime
    const scheduleDate = payload.scheduleDate || local?.scheduleDate
    setNotifData({ title, message, scheduleDate, startTime, endTime })
    setNotifOpen(true)
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(title, { body: message || '' }) } catch (_e) {}
    }
  }

  function handleNotificationDialogCloseButtonClick() {
    setNotifOpen(false)
  }

  function handleTestEvent(payload: TestEventPayload) {
    const msg = payload.message || 'test'
    // 항상 인앱 스낵바 노출
    setSnackbarMessage(`테스트: ${msg}`)
    setSnackbarOpen(true)
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification('테스트 알림', { body: msg }) } catch (_e) {}
    }
  }

  function handleSseOpen() {
    // 브라우저 알림 권한 요청 (최초 1회)
    if ('Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission().catch(() => {}) } catch (_e) {}
    }
    setSnackbarMessage('알림 채널에 연결되었습니다')
    setSnackbarOpen(true)
  }

  function handleSseError(_msg: string) {
    setSnackbarMessage('알림 채널 연결에 문제가 있습니다')
    setSnackbarOpen(true)
  }

  // 로그인 완료 후에만 실행: 토큰은 App 초기화에서 설정됨
  useNotificationsSSE({ handleReminderEvent, handleTestEvent, handleOpen: handleSseOpen, handleError: handleSseError })

  function getRangeByView(base: Dayjs, mode: ViewMode): { start: string, end: string } {
    if (mode === 'day') {
      const d = base.startOf('day')
      return { start: d.format('YYYY-MM-DD'), end: d.format('YYYY-MM-DD') }
    }
    if (mode === 'week') {
      return {
        start: base.startOf('week').format('YYYY-MM-DD'),
        end: base.endOf('week').format('YYYY-MM-DD')
      }
    }
    return {
      start: base.startOf('month').format('YYYY-MM-DD'),
      end: base.endOf('month').format('YYYY-MM-DD')
    }
  }

  function handleBuildStateFromSchedules(items: ScheduleResponse[]) {
    const flat: ScheduleListItem[] = items.map((it) => ({
      id: it.id,
      title: it.title,
      scheduleDate: it.scheduleDate,
      startTime: it.startTime,
      endTime: it.endTime,
      color: it.color,
      isAllDay: it.isAllDay,
      description: it.description,
      isReminderEnabled: normalizeEnabled((it as any).isReminderEnabled ?? (it as any).reminderEnabled),
      reminderMinutes: it.reminderMinutes,
    }))
    flat.sort((a, b) => {
      if (a.scheduleDate !== b.scheduleDate) return a.scheduleDate < b.scheduleDate ? -1 : 1
      const aKey = `${a.startTime ?? ''}`
      const bKey = `${b.startTime ?? ''}`
      if (aKey !== bKey) return aKey < bKey ? -1 : 1
      return a.title.localeCompare(b.title)
    })
    setListItems(flat)
  }
  

  useEffect(() => {
    const { start, end } = getRangeByView(cursor, view)
    setIsLoading(true)
    ScheduleApi.getRange(start, end)
      .then(handleBuildStateFromSchedules)
      .finally(() => setIsLoading(false))
  }, [cursor, view])

  

  const handlePrevMonthButtonClick = () => setCursor(prev => prev.add(-1, 'month'))
  const handleNextMonthButtonClick = () => setCursor(prev => prev.add(1, 'month'))
  const handleAddScheduleButtonClick = () => setDialogOpen(true)
  const handleDialogClose = () => setDialogOpen(false)
  const handleViewChange = (next: ViewMode) => setView(next)
  const handleSidebarDateChange = (next: Dayjs) => setCursor(next)
  const handleSidebarTodayClick = () => setCursor(dayjs())
  const handleListItemEdit = (scheduleId: string) => {
    const target = listItems.find(it => it.id === scheduleId) || null
    setEditTarget(target)
    setEditOpen(Boolean(target))
  }
  const handleListItemDelete = async (scheduleId: string) => {
    // 이전 보류 삭제가 있으면 즉시 커밋
    if (pendingDelete) {
      try { await ScheduleApi.remove(pendingDelete.id) } catch (_e) { /* noop */ }
      setPendingDelete(null)
      if (pendingDeleteTimerRef.current) { clearTimeout(pendingDeleteTimerRef.current); pendingDeleteTimerRef.current = null }
    }

    const target = listItems.find(it => it.id === scheduleId)
    if (!target) return

    // UI에서 우선 제거 (낙관적)
    setListItems(prev => prev.filter(it => it.id !== scheduleId))
    setPendingDelete(target)
    setSnackbarMessage('일정을 삭제했습니다')
    setSnackbarOpen(true)

    // 시간 경과 후 실제 삭제 확정
    pendingDeleteTimerRef.current = setTimeout(async () => {
      if (!pendingDelete) return
      try {
        await ScheduleApi.remove(target.id)
      } catch (_e) {
        // 실패 시 복구
        setListItems(prev => sortListItems([ ...prev, target ]))
      } finally {
        setPendingDelete(null)
        pendingDeleteTimerRef.current = null
        setSnackbarOpen(false)
      }
    }, 10000)
  }
  const handleEditDialogClose = () => setEditOpen(false)
  const handleEditDialogUpdated = (item: ScheduleResponse) => {
    setListItems(prev => prev.map(it => it.id === item.id ? {
      id: item.id,
      title: item.title,
      scheduleDate: item.scheduleDate,
      startTime: item.startTime,
      endTime: item.endTime,
      color: item.color,
      isAllDay: item.isAllDay,
      description: item.description,
      isReminderEnabled: item.isReminderEnabled,
      reminderMinutes: item.reminderMinutes,
    } : it))
  }
  const handleListItemClick = (scheduleId: string) => {
    const target = listItems.find(it => it.id === scheduleId) || null
    setDetailTarget(target)
    setDetailOpen(Boolean(target))
  }
  const handleDetailDialogClose = () => setDetailOpen(false)
  const handleDetailEdit = (scheduleId: string) => {
    handleListItemEdit(scheduleId)
  }
  const handleDetailDelete = (scheduleId: string) => {
    handleListItemDelete(scheduleId)
  }
  const handleDetailDuplicate = async (scheduleId: string) => {
    const src = listItems.find(it => it.id === scheduleId)
    if (!src) return
    try {
      const payload = {
        title: src.title,
        description: src.description,
        color: src.color,
        scheduleDate: src.scheduleDate,
        startTime: src.isAllDay ? undefined : src.startTime,
        endTime: src.isAllDay ? undefined : src.endTime,
        isAllDay: src.isAllDay,
      } as const
      const created = await ScheduleApi.create(payload)
      setListItems(prev => [{
        id: created.id,
        title: created.title,
        scheduleDate: created.scheduleDate,
        startTime: created.startTime,
        endTime: created.endTime,
        color: created.color,
        isAllDay: created.isAllDay,
        description: created.description,
      }, ...prev])
    } catch (_e) {}
  }
  const handleDialogCreated = (item: ScheduleResponse) => {
    setListItems(prev => [{
      id: item.id,
      title: item.title,
      scheduleDate: item.scheduleDate,
      startTime: item.startTime,
      endTime: item.endTime,
      color: item.color,
      isAllDay: item.isAllDay,
      description: item.description,
      isReminderEnabled: item.isReminderEnabled,
      reminderMinutes: item.reminderMinutes,
    }, ...prev])
  }

  async function handleListItemReminderToggle(scheduleId: string, enabled: boolean) {
    try {
      const target = listItems.find(it => it.id === scheduleId)
      if (!target || !target.startTime) {
        setSnackbarMessage('시작 시간이 있는 일정만 알림을 켤 수 있습니다')
        setSnackbarOpen(true)
        return
      }
      // 낙관적 업데이트: 먼저 UI 상태를 변경해 애니메이션을 자연스럽게 보여줌
      setListItems(prev => prev.map(it => it.id === scheduleId ? { ...it, isReminderEnabled: enabled } : it))
      const toggled = await ScheduleApi.toggleReminderEnabled(scheduleId)
      // 서버 응답으로 최종 동기화 (경합 상황 대비)
      setListItems(prev => prev.map(it => it.id === scheduleId ? { ...it, isReminderEnabled: toggled.enabled } : it))
      setSnackbarMessage(toggled.enabled ? '알림을 켰습니다' : '알림을 껐습니다')
      setSnackbarOpen(true)
    } catch (_e) {
      // 실패 시 롤백
      setListItems(prev => prev.map(it => it.id === scheduleId ? { ...it, isReminderEnabled: !enabled } : it))
      setSnackbarMessage('알림 상태 변경에 실패했습니다')
      setSnackbarOpen(true)
      try { console.error('[REMINDER] toggle failed', { scheduleId }) } catch (__e) {}
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

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return listItems
    return listItems.filter(it =>
      it.title.toLowerCase().includes(q) ||
      (it.description?.toLowerCase().includes(q) ?? false)
    )
  }, [listItems, query])

  function handleSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
  }

  function handleSnackbarClose(_e?: React.SyntheticEvent | Event, reason?: string) {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  function handleSnackbarUndoButtonClick() {
    if (pendingDeleteTimerRef.current) {
      clearTimeout(pendingDeleteTimerRef.current)
      pendingDeleteTimerRef.current = null
    }
    if (pendingDelete) {
      setListItems(prev => sortListItems([ ...prev, pendingDelete ]))
      setPendingDelete(null)
    }
    setSnackbarOpen(false)
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack spacing={2}>
        <CalendarToolbar
          cursor={cursor}
          view={view}
          onViewChange={handleViewChange}
          onPrev={handlePrevMonthButtonClick}
          onNext={handleNextMonthButtonClick}
          onAdd={handleAddScheduleButtonClick}
        />
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Stack sx={{ width: { xs: '100%', md: 320 }, flexShrink: 0 }}>
            <CalendarSidebar
              cursor={cursor}
              onDateChange={handleSidebarDateChange}
              onTodayClick={handleSidebarTodayClick}
              onAddClick={handleAddScheduleButtonClick}
              onQuickCreated={handleDialogCreated}
            />
          </Stack>
          <Stack sx={{ flex: 1 }} spacing={2}>
            <TextField
              size="small"
              placeholder="일정 검색"
              value={query}
              onChange={handleSearchInputChange}
              fullWidth
            />
            
            {isLoading ? (
              <CalendarListSkeleton count={8} />
            ) : (
              <CalendarList
                items={filteredItems}
                groupByDate={true}
                onEdit={handleListItemEdit}
                onDelete={handleListItemDelete}
                onItemClick={handleListItemClick}
                onToggleReminder={handleListItemReminderToggle}
              />
            )}
          </Stack>
        </Stack>
      </Stack>
      <ScheduleCreateDialog open={dialogOpen} defaultDate={cursor.format('YYYY-MM-DD')} onClose={handleDialogClose} onCreated={handleDialogCreated} />
      <ScheduleEditDialog open={editOpen} schedule={editTarget} onClose={handleEditDialogClose} onUpdated={handleEditDialogUpdated} />
      <ScheduleDetailDialog
        open={detailOpen}
        schedule={detailTarget}
        onClose={handleDetailDialogClose}
        onEdit={handleDetailEdit}
        onDelete={handleDetailDelete}
        onDuplicate={handleDetailDuplicate}
      />
      <Dialog open={notifOpen} onClose={(_e, _r) => { /* 강제 버튼 닫기만 허용 */ }} fullWidth maxWidth="sm">
        <DialogTitle>일정 알림</DialogTitle>
        <DialogContent>
          <Stack spacing={1.25} sx={{ mt: 0.5 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{notifData?.title || '일정 알림'}</Typography>
            {notifData?.message && (
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{notifData.message}</Typography>
            )}
            <Stack spacing={0.5}>
              {notifData?.scheduleDate && (
                <Typography variant="body2" color="text.secondary">날짜: {notifData.scheduleDate}</Typography>
              )}
              <Typography variant="body2" color="text.secondary">시간: {(notifData?.startTime || '-')}{notifData?.endTime ? ` ~ ${notifData.endTime}` : ''}</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNotificationDialogCloseButtonClick}>닫기</Button>
        </DialogActions>
      </Dialog>
      <Snackbar
        open={snackbarOpen}
        onClose={handleSnackbarClose}
        autoHideDuration={10000}
        message={snackbarMessage}
        action={
          <Button color="inherit" size="small" onClick={handleSnackbarUndoButtonClick}>
            되돌리기
          </Button>
        }
      />
    </LocalizationProvider>
  )
}


