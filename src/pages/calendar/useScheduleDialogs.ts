import { useState } from 'react'
import type { ScheduleListItem } from '@pages/calendar/types'
import { ScheduleApi, type ScheduleResponse } from '@lib/api/schedule'

export interface UseScheduleDialogsOptions {
  listItems: ScheduleListItem[]
  onCreated: (item: ScheduleResponse) => void
  onUpdated: (item: ScheduleResponse) => void
  onDelete: (scheduleId: string) => void
}

export function useScheduleDialogs({ listItems, onCreated, onUpdated, onDelete }: UseScheduleDialogsOptions) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<ScheduleListItem | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState<ScheduleListItem | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  function handleAddScheduleButtonClick() { setDialogOpen(true) }
  function handleDialogClose() { setDialogOpen(false) }
  function handleDialogCreated(item: ScheduleResponse) { onCreated(item) }

  function handleListItemEdit(scheduleId: string) {
    const target = listItems.find(item => item.id === scheduleId) || null
    setEditTarget(target)
    setEditOpen(Boolean(target))
  }
  function handleEditDialogClose() { setEditOpen(false) }
  function handleEditDialogUpdated(item: ScheduleResponse) { onUpdated(item) }

  function handleListItemClick(scheduleId: string) {
    const target = listItems.find(item => item.id === scheduleId) || null
    setDetailTarget(target)
    setDetailOpen(Boolean(target))
  }
  function handleDetailDialogClose() { setDetailOpen(false) }
  function handleDetailEdit(scheduleId: string) { handleListItemEdit(scheduleId) }
  function handleDetailDelete(scheduleId: string) { onDelete(scheduleId) }
  async function handleDetailDuplicate(scheduleId: string) {
    const src = listItems.find(item => item.id === scheduleId)
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
      onCreated(created)
    } catch (_e) {}
  }

  return {
    dialogOpen,
    editTarget,
    editOpen,
    detailTarget,
    detailOpen,
    handleAddScheduleButtonClick,
    handleDialogClose,
    handleDialogCreated,
    handleListItemEdit,
    handleEditDialogClose,
    handleEditDialogUpdated,
    handleListItemClick,
    handleDetailDialogClose,
    handleDetailEdit,
    handleDetailDelete,
    handleDetailDuplicate,
  }
}


