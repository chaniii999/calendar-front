import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography } from '@mui/material'
import dayjs from 'dayjs'
import type { ScheduleListItem } from '../../ui/pages/calendar/types'

export interface ScheduleDetailDialogProps {
	open: boolean
	schedule: ScheduleListItem | null
	onClose: () => void
	onEdit?: (scheduleId: string) => void
	onDelete?: (scheduleId: string) => void
	onDuplicate?: (scheduleId: string) => void
}

function formatTime(schedule: ScheduleListItem | null): string {
	if (!schedule) return ''
	if (schedule.isAllDay) return '종일'
	if (schedule.startTime && schedule.endTime) return `${schedule.startTime} - ${schedule.endTime}`
	if (schedule.startTime) return `${schedule.startTime}`
	return ''
}

export function ScheduleDetailDialog({ open, schedule, onClose, onEdit, onDelete, onDuplicate }: ScheduleDetailDialogProps) {
	function handleCloseButtonClick() { onClose() }

	function handleEditButtonClick() {
		if (schedule && onEdit) onEdit(schedule.id)
		onClose()
	}

	function handleDeleteButtonClick() {
		if (schedule && onDelete) onDelete(schedule.id)
		onClose()
	}

	function handleDuplicateButtonClick() {
		if (schedule && onDuplicate) onDuplicate(schedule.id)
		onClose()
	}

	return (
		<Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
			<DialogTitle>일정 상세</DialogTitle>
			<DialogContent>
				{schedule && (
					<Stack spacing={1.25} sx={{ mt: 0.5 }}>
						<Typography variant="h6" sx={{ fontWeight: 700 }}>{schedule.title}</Typography>
						<Typography variant="body2" color="text.secondary">{dayjs(schedule.scheduleDate).format('YYYY-MM-DD (ddd)')}</Typography>
						<Typography variant="body2" color="text.secondary">{formatTime(schedule)}</Typography>
						{schedule.description && (
							<Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{schedule.description}</Typography>
						)}
						{/* 색상 텍스트 표시는 제거 */}
					</Stack>
				)}
			</DialogContent>
			<DialogActions>
				<Button color="primary" onClick={handleEditButtonClick}>수정</Button>
				<Button color="secondary" onClick={handleDuplicateButtonClick}>복제</Button>
				<Button color="error" onClick={handleDeleteButtonClick}>삭제</Button>
				<Button color="inherit" onClick={handleCloseButtonClick}>닫기</Button>
			</DialogActions>
		</Dialog>
	)
}


