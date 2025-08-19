import React, { useState } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Stack, Switch, TextField } from '@mui/material'
import { ColorPalettePicker } from './ColorPalettePicker'
import dayjs from 'dayjs'
import { ScheduleApi, ScheduleRequest, ScheduleResponse } from '../api/schedule'

export interface ScheduleCreateDialogProps {
  open: boolean
  defaultDate: string
  onClose: () => void
  onCreated: (item: ScheduleResponse) => void
}

export function ScheduleCreateDialog({ open, defaultDate, onClose, onCreated }: ScheduleCreateDialogProps) {
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [allDay, setAllDay] = useState(false)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [color, setColor] = useState<string>('')

  const handleTitleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)
  const handleDescriptionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setDesc(e.target.value)
  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setColor(e.target.value)
  const handleCancelButtonClick = () => onClose()
  const handleCreateButtonClick = async () => {
    if (!title.trim()) return
    const payload: ScheduleRequest = {
      title: title.trim(),
      description: desc.trim() || undefined,
      scheduleDate: defaultDate,
      isAllDay: allDay || undefined,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      color: color || undefined,
    }
    const created = await ScheduleApi.create(payload)
    onCreated(created)
    setTitle('')
    setDesc('')
    setColor('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>일정 추가 ({dayjs(defaultDate).format('YYYY-MM-DD')})</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="제목" value={title} onChange={handleTitleInputChange} autoFocus fullWidth size="small" />
          <TextField label="설명" value={desc} onChange={handleDescriptionInputChange} fullWidth size="small" />
          <ColorPalettePicker label="색상 선택" value={color} onChange={setColor} />
          <FormControlLabel control={<Switch checked={allDay} onChange={(_, v)=>setAllDay(v)} />} label="종일" />
          {!allDay && (
            <Stack direction="row" spacing={1}>
              <TextField label="시작" type="time" size="small" value={startTime} onChange={e=>setStartTime(e.target.value)} />
              <TextField label="종료" type="time" size="small" value={endTime} onChange={e=>setEndTime(e.target.value)} />
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancelButtonClick}>취소</Button>
        <Button variant="contained" onClick={handleCreateButtonClick}>추가</Button>
      </DialogActions>
    </Dialog>
  )
}

