import React, { useEffect, useMemo, useState } from 'react'
import { Box, Button, Card, CardContent, Stack, TextField, Typography } from '@mui/material'
import { DateCalendar, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'
import dayjs, { Dayjs } from 'dayjs'
import { ScheduleApi, ScheduleRequest, ScheduleResponse } from '../../lib/api/schedule'
import { CalendarMonth, CalendarMonthEvent } from '../../lib/components/CalendarMonth'
import { CalendarToolbar, type ViewMode } from '../../lib/components/CalendarToolbar'
import { ScheduleCreateDialog } from '../../lib/components/ScheduleCreateDialog'

interface CalendarEvent {
  id: string
  date: string
  title: string
}

export function CalendarPage() {
  const [cursor, setCursor] = useState<Dayjs>(dayjs())
  const [selected, setSelected] = useState<Dayjs>(dayjs())
  const [dialogOpen, setDialogOpen] = useState(false)
  const [view, setView] = useState<ViewMode>('month')
  const [eventsByDate, setEventsByDate] = useState<Record<string, CalendarMonthEvent[]>>({})

  useEffect(() => {
    const start = cursor.startOf('month').format('YYYY-MM-DD')
    const end = cursor.endOf('month').format('YYYY-MM-DD')
    ScheduleApi.getRange(start, end).then((list) => {
      const grouped: Record<string, CalendarMonthEvent[]> = {}
      list.forEach((it: ScheduleResponse) => {
        const key = it.scheduleDate
        if (!grouped[key]) grouped[key] = []
        grouped[key].push({ id: it.id, title: it.title, scheduleDate: it.scheduleDate, color: it.color })
      })
      setEventsByDate(grouped)
    })
  }, [cursor])

  const handleCalendarValueChange = (newValue: Dayjs | null) => { if (newValue) setSelected(newValue) }
  const handlePrevMonthButtonClick = () => setCursor(prev => prev.add(-1, 'month'))
  const handleNextMonthButtonClick = () => setCursor(prev => prev.add(1, 'month'))
  const handleAddScheduleButtonClick = () => setDialogOpen(true)
  const handleDialogClose = () => setDialogOpen(false)
  const handleDialogCreated = (item: ScheduleResponse) => {
    setEventsByDate(prev => {
      const key = item.scheduleDate
      const next = { ...prev }
      next[key] = [{ id: item.id, title: item.title, scheduleDate: key, color: item.color }, ...(next[key] ?? [])]
      return next
    })
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Stack spacing={2}>
        <CalendarToolbar
          cursor={cursor}
          view={view}
          onViewChange={setView}
          onPrev={handlePrevMonthButtonClick}
          onNext={handleNextMonthButtonClick}
          onAdd={handleAddScheduleButtonClick}
        />
        <DateCalendar value={selected} onChange={handleCalendarValueChange} views={[ 'day', 'month', 'year' ]} />
        {view === 'month' && (
          <CalendarMonth month={cursor} eventsByDate={eventsByDate} />
        )}
        {view !== 'month' && (
          <Typography variant="body2" color="text.secondary">주/일 보기 컴포넌트는 참고 레포 구조에 맞춰 추가 구현 가능합니다.</Typography>
        )}
      </Stack>
      <ScheduleCreateDialog open={dialogOpen} defaultDate={selected.format('YYYY-MM-DD')} onClose={handleDialogClose} onCreated={handleDialogCreated} />
    </LocalizationProvider>
  )
}


