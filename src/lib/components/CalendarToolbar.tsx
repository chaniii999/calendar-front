import React from 'react'
import { Stack, ToggleButton, ToggleButtonGroup, Typography, Button } from '@mui/material'
import dayjs from 'dayjs'

export type ViewMode = 'month' | 'week' | 'day'

export interface CalendarToolbarProps {
  cursor: dayjs.Dayjs
  view: ViewMode
  onViewChange: (next: ViewMode) => void
  onPrev: () => void
  onNext: () => void
  onAdd: () => void
}

export function CalendarToolbar({ cursor, view, onViewChange, onPrev, onNext, onAdd }: CalendarToolbarProps) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" justifyContent="space-between">
      <Typography variant="h5">{cursor.format('YYYY년 M월')}</Typography>
      <Stack direction="row" spacing={1}>
        <ToggleButtonGroup exclusive value={view} onChange={(_, v)=> v && onViewChange(v)} size="small">
          <ToggleButton value="month">월</ToggleButton>
          <ToggleButton value="week">주</ToggleButton>
          <ToggleButton value="day">일</ToggleButton>
        </ToggleButtonGroup>
        <Button onClick={onPrev}>이전</Button>
        <Button onClick={onNext}>다음</Button>
        <Button variant="contained" onClick={onAdd}>일정 추가</Button>
      </Stack>
    </Stack>
  )
}

