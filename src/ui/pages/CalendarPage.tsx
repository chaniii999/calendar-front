import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Button, Snackbar, Stack, TextField, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material'
import { LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import { ScheduleApi, ScheduleRequest, ScheduleResponse } from '@lib/api/schedule'
import { CalendarToolbar, type ViewMode } from '@components/CalendarToolbar'
import { ScheduleCreateDialog } from '@components/ScheduleCreateDialog'
import { ScheduleEditDialog } from '@components/ScheduleEditDialog'
import { ScheduleDetailDialog } from '@components/ScheduleDetailDialog'
import { CalendarList } from '@components/CalendarList'
import { CalendarSidebar } from '@components/CalendarSidebar'
import { CalendarListSkeleton } from '@components/CalendarListSkeleton'
import type { ScheduleListItem } from '@pages/calendar/types'
import { useNotificationsSSE } from '@lib/sse/useNotificationsSSE'
import type { ReminderEventPayload, TestEventPayload } from '@lib/sse/types'

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
  const audioCtxRef = useRef<AudioContext | null>(null)
  const oscillRef = useRef<OscillatorNode | null>(null)
  const beepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const beepStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  function playMelodyOnce() {
    try {
      const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext
      const ctx: AudioContext = new Ctx()
      // 간단한 멜로디(자연스러운 알람 느낌): A5-B5-C#6-E6 | A5-E6-C#6-B5 (총 ~6초)
      const melody: Array<{ f: number, d: number }> = [
        { f: 880.0, d: 0.45 },   // A5
        { f: 987.77, d: 0.45 },  // B5
        { f: 1108.73, d: 0.45 }, // C#6
        { f: 1318.51, d: 0.6 },  // E6 (길게)
        { f: 0, d: 0.2 },
        { f: 880.0, d: 0.45 },
        { f: 1318.51, d: 0.45 },
        { f: 1108.73, d: 0.45 },
        { f: 987.77, d: 0.6 },
      ]
      let t = ctx.currentTime
      for (const note of melody) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        const isRest = note.f === 0
        if (!isRest) osc.frequency.setValueAtTime(note.f, t)
        // 부드러운 어택/릴리즈
        gain.gain.setValueAtTime(0.0001, t)
        if (!isRest) gain.gain.exponentialRampToValueAtTime(0.15, t + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.1, note.d - 0.05))
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + note.d)
        t += note.d + 0.05
      }
      audioCtxRef.current = ctx
      // 컨텍스트 자동 종료
      const totalMs = (t - ctx.currentTime + 0.2) * 1000
      setTimeout(() => {
        try { ctx.close() } catch (_e) {}
        if (audioCtxRef.current === ctx) audioCtxRef.current = null
      }, totalMs)
    } catch (_e) {}
  }

  // 효과음: 알림 창이 열린 동안 1분간 주기적으로 재생
  useEffect(() => {
    if (!notifOpen) {
      if (beepIntervalRef.current) { clearInterval(beepIntervalRef.current); beepIntervalRef.current = null }
      if (beepStopTimeoutRef.current) { clearTimeout(beepStopTimeoutRef.current); beepStopTimeoutRef.current = null }
      try { oscillRef.current?.stop(); oscillRef.current?.disconnect() } catch (_e) {}
      try { audioCtxRef.current?.close() } catch (_e) {}
      oscillRef.current = null
      audioCtxRef.current = null
      return
    }
    // 즉시 1회 재생(멜로디)
    playMelodyOnce()
    // 1분 동안 6초 간격으로 반복 재생(멜로디 길이에 맞춰 자연스럽게)
    beepIntervalRef.current = setInterval(() => {
      playMelodyOnce()
    }, 6000)
    // 1분 후 자동 중단(창이 계속 열려 있어도 더 이상 소리 재생 X)
    beepStopTimeoutRef.current = setTimeout(() => {
      if (beepIntervalRef.current) { clearInterval(beepIntervalRef.current); beepIntervalRef.current = null }
    }, 60000)
    return () => {
      if (beepIntervalRef.current) { clearInterval(beepIntervalRef.current); beepIntervalRef.current = null }
      if (beepStopTimeoutRef.current) { clearTimeout(beepStopTimeoutRef.current); beepStopTimeoutRef.current = null }
    }
  }, [notifOpen])

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
      isReminderEnabled: normalizeEnabled((item as any).isReminderEnabled ?? (item as any).reminderEnabled),
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
      isReminderEnabled: normalizeEnabled((item as any).isReminderEnabled ?? (item as any).reminderEnabled),
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
      // 사용자의 의도(켜기/끄기)에 맞춰 강제 설정 API 사용 (토글 API는 상태 경합에 취약)
      const updated = await ScheduleApi.setReminderEnabled(scheduleId, enabled)
      // 서버 응답으로 최종 동기화 (경합 상황 대비)
      setListItems(prev => prev.map(it => it.id === scheduleId ? { ...it, isReminderEnabled: updated.isReminderEnabled } : it))
      setSnackbarMessage(updated.isReminderEnabled ? '알림을 켰습니다' : '알림을 껐습니다')
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
      <Dialog
        open={notifOpen}
        onClose={(_e, _r) => { /* 강제 버튼 닫기만 허용 */ }}
        fullWidth
        maxWidth="sm"
        disableEscapeKeyDown
        BackdropProps={{
          sx: {
            backgroundColor: 'rgba(0,0,0,0.4)',
            animation: 'alarmPulse 1.2s ease-in-out infinite',
            '@keyframes alarmPulse': {
              '0%': { backgroundColor: 'rgba(0,0,0,0.35)' },
              '50%': { backgroundColor: 'rgba(255,0,0,0.25)' },
              '100%': { backgroundColor: 'rgba(0,0,0,0.35)' },
            },
          }
        }}
      >
        <DialogTitle>{`일정 알림 · ${notifData?.title || ''}`}</DialogTitle>
        <DialogContent sx={{
          borderRadius: 2,
          boxShadow: 6,
          animation: 'alarmRing 700ms ease-in-out infinite alternate',
          '@keyframes alarmRing': {
            '0%': { boxShadow: '0 0 0px rgba(255,0,0,0.6)' },
            '100%': { boxShadow: '0 0 24px rgba(255,0,0,0.9)' },
          },
        }}>
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


