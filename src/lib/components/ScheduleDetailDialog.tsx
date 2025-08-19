import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography, Chip } from '@mui/material'
import dayjs from 'dayjs'
import type { ScheduleListItem } from '../../ui/pages/calendar/types'

export interface ScheduleDetailDialogProps {
	open: boolean
	schedule: ScheduleListItem | null
	onClose: () => void
}

function formatTime(schedule: ScheduleListItem | null): string {
	if (!schedule) return ''
	if (schedule.isAllDay) return '종일'
	if (schedule.startTime && schedule.endTime) return `${schedule.startTime} - ${schedule.endTime}`
	if (schedule.startTime) return `${schedule.startTime}`
	return ''
}

export function ScheduleDetailDialog({ open, schedule, onClose }: ScheduleDetailDialogProps) {
	function handleCloseButtonClick() { onClose() }

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
						{schedule.color && <Chip label={schedule.color} size="small" />}
					</Stack>
				)}
			</DialogContent>
			<DialogActions>
				<Button onClick={handleCloseButtonClick}>닫기</Button>
			</DialogActions>
		</Dialog>
	)
}


