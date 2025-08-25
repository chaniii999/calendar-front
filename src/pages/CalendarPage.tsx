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
import { useCalendarNotifications } from './calendar/useCalendarNotifications'
import { useCalendarData } from './calendar/useCalendarData'

export function CalendarPage() {
  const [cursor, setCursor] = useState<Dayjs>(dayjs())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [view, setView] = useState<ViewMode>('month')
  const { listItems, isLoading, query, setQuery, filteredItems, handleListItemReminderToggle, handleListItemDelete, handleDialogCreated, handleEditDialogUpdated } = useCalendarData({
    startDate: dayjs(cursor).startOf('month').format('YYYY-MM-DD'),
    endDate: dayjs(cursor).endOf('month').format('YYYY-MM-DD'),
    handleShowMessage: (m: string) => { setSnackbarMessage(m); setSnackbarOpen(true) }
  })
  const [editTarget, setEditTarget] = useState<ScheduleListItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState<ScheduleListItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [snackbarOpen, setSnackbarOpen] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState('')
  
  
  const { notifOpen, notifData, handleNotificationDialogCloseButtonClick } = useCalendarNotifications({
    handleShowMessage: (m: string) => { setSnackbarMessage(m); setSnackbarOpen(true) }
  })

  function normalizeEnabled(value: unknown): boolean {
    if (typeof value === 'boolean') return value
    if (typeof value === 'number') return value !== 0
    if (typeof value === 'string') return value.toLowerCase() === 'true' || value === '1'
    return false
  }


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

  

  useEffect(() => {
    const { start, end } = getRangeByView(cursor, view)
    // 훅은 month 기반으로 fetch하므로 view 변경 시 cursor만 업데이트되면 자동 반영됨.
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
  // 삭제는 useCalendarData에 위임되며 여기서는 래핑만 유지 (필요 시 추가 UI 처리)
  const handleEditDialogClose = () => setEditOpen(false)
  const handleEditDialogUpdatedLocal = (item: ScheduleResponse) => { handleEditDialogUpdated(item) }
  const handleListItemClick = (scheduleId: string) => {
    const target = listItems.find(it => it.id === scheduleId) || null
    setDetailTarget(target)
    setDetailOpen(Boolean(target))
  }
  const handleDetailDialogClose = () => setDetailOpen(false)
  const handleDetailEdit = (scheduleId: string) => {
    handleListItemEdit(scheduleId)
  }
  const handleDetailDelete = (scheduleId: string) => { handleListItemDelete(scheduleId) }
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
      handleDialogCreatedLocal(created)
    } catch (_e) {}
  }
  const handleDialogCreatedLocal = (item: ScheduleResponse) => { handleDialogCreated(item) }

  // 리마인더 토글은 useCalendarData로 위임됨

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

  // 필터링은 useCalendarData에서 제공됨

  function handleSearchInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value)
  }

  function handleSnackbarClose(_e?: React.SyntheticEvent | Event, reason?: string) {
    if (reason === 'clickaway') return
    setSnackbarOpen(false)
  }

  function handleSnackbarUndoButtonClick() { /* TODO: wire undo from useCalendarData if needed */ setSnackbarOpen(false) }

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
        onClose={(_e, _r) => {}}
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


