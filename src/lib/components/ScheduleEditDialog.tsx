import React, { useEffect, useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Switch, TextField } from '@mui/material'
import dayjs from 'dayjs'
import { ScheduleApi, type ScheduleRequest, type ScheduleResponse } from '../api/schedule'

export interface EditableSchedule {
  id: string
  title: string
  description?: string
  scheduleDate: string
  isAllDay?: boolean
  startTime?: string
  endTime?: string
  color?: string
}

export interface ScheduleEditDialogProps {
  open: boolean
  schedule: EditableSchedule | null
  onClose: () => void
  onUpdated: (item: ScheduleResponse) => void
}

export function ScheduleEditDialog({ open, schedule, onClose, onUpdated }: ScheduleEditDialogProps) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')

  useEffect(() => {
    if (!schedule) return
    setTitle(schedule.title ?? '')
    setDesc(schedule.description ?? '')
    setAllDay(Boolean(schedule.isAllDay))
    setStartTime(schedule.startTime ?? '')
    setEndTime(schedule.endTime ?? '')
  }, [schedule])

  function handleTitleInputChange(e: React.ChangeEvent<HTMLInputElement>) { setTitle(e.target.value) }
  function handleDescriptionInputChange(e: React.ChangeEvent<HTMLInputElement>) { setDesc(e.target.value) }
  function handleAllDaySwitchChange(_e: React.ChangeEvent<HTMLInputElement>, value: boolean) { setAllDay(value) }
  function handleStartTimeInputChange(e: React.ChangeEvent<HTMLInputElement>) { setStartTime(e.target.value) }
  function handleEndTimeInputChange(e: React.ChangeEvent<HTMLInputElement>) { setEndTime(e.target.value) }
  function handleCancelButtonClick() { onClose() }

  async function handleSaveButtonClick() {
    if (!schedule) return
    if (!title.trim()) return
    const payload: ScheduleRequest = {
      title: title.trim(),
      description: desc.trim() || undefined,
      scheduleDate: schedule.scheduleDate,
      isAllDay: allDay || undefined,
      startTime: allDay ? undefined : (startTime || undefined),
      endTime: allDay ? undefined : (endTime || undefined),
      color: schedule.color,
    }
    const updated = await ScheduleApi.update(schedule.id, payload)
    onUpdated(updated)
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>일정 수정 {schedule ? `(${dayjs(schedule.scheduleDate).format('YYYY-MM-DD')})` : ''}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="제목" value={title} onChange={handleTitleInputChange} autoFocus fullWidth size="small" />
          <TextField label="설명" value={desc} onChange={handleDescriptionInputChange} fullWidth size="small" />
          <FormControlLabel control={<Switch checked={allDay} onChange={handleAllDaySwitchChange} />} label="종일" />
          {!allDay && (
            <Stack direction="row" spacing={1}>
              <TextField label="시작" type="time" size="small" value={startTime} onChange={handleStartTimeInputChange} />
              <TextField label="종료" type="time" size="small" value={endTime} onChange={handleEndTimeInputChange} />
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancelButtonClick}>취소</Button>
        <Button variant="contained" onClick={handleSaveButtonClick}>저장</Button>
      </DialogActions>
    </Dialog>
  )
}


