import React from 'react'
import { Stack, ToggleButton, ToggleButtonGroup, Typography, Button, IconButton } from '@mui/material'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import AddIcon from '@mui/icons-material/Add'
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
  function handleViewModeChange(_e: unknown, next: ViewMode | null) {
    if (next) onViewChange(next)
  }
  function handlePrevButtonClick() { onPrev() }
  function handleNextButtonClick() { onNext() }
  function handleAddButtonClick() { onAdd() }

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems="center" justifyContent="space-between">
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="h5">{cursor.format('YYYY년 M월')}</Typography>
        <IconButton color="primary" onClick={handlePrevButtonClick} size="small"><ChevronLeftIcon /></IconButton>
        <IconButton color="primary" onClick={handleNextButtonClick} size="small"><ChevronRightIcon /></IconButton>
      </Stack>
      <Stack direction="row" spacing={1}>
        <ToggleButtonGroup exclusive value={view} onChange={handleViewModeChange} size="small">
          <ToggleButton value="month">월</ToggleButton>
          <ToggleButton value="week">주</ToggleButton>
          <ToggleButton value="day">일</ToggleButton>
        </ToggleButtonGroup>
        <IconButton color="primary" onClick={handleAddButtonClick} size="small" aria-label="일정 추가">
          <AddIcon />
        </IconButton>
      </Stack>
    </Stack>
  )
}

