import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Button, Card, CardContent, Snackbar, Stack, TextField, Typography } from '@mui/material'
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
    }, ...prev])
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
            />
          </Stack>
          <Stack sx={{ flex: 1 }} spacing={2}>
            {isLoading ? (
              <CalendarListSkeleton count={8} />
            ) : (
              <CalendarList
                items={listItems}
                groupByDate={true}
                onEdit={handleListItemEdit}
                onDelete={handleListItemDelete}
                onItemClick={handleListItemClick}
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


