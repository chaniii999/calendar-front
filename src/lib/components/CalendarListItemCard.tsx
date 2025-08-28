import React from 'react'
import { Paper, Stack, Typography, Chip, IconButton, Switch, Tooltip } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import dayjs from 'dayjs'
import type { ScheduleListItem } from '@pages/calendar/types'

export interface CalendarListItemCardProps {
	item: ScheduleListItem
	onClick?: (scheduleId: string) => void
	onEdit?: (scheduleId: string) => void
	onDelete?: (scheduleId: string) => void
	showDateChip?: boolean
	onToggleReminder?: (scheduleId: string, enabled: boolean) => void
	isTogglingReminder?: boolean
}

function buildTimeText(item: ScheduleListItem): string {
	if (item.isAllDay) return '종일'
	if (item.startTime && item.endTime) return `${item.startTime} - ${item.endTime}`
	if (item.startTime) return item.startTime
	return ''
}

function isScheduleInPast(item: ScheduleListItem): boolean {
	const now = dayjs()
	const scheduleDateTime = dayjs(`${item.scheduleDate} ${item.startTime || '00:00'}`)
	return scheduleDateTime.isBefore(now)
}

export function CalendarListItemCard({ item, onClick, onEdit, onDelete, showDateChip, onToggleReminder, isTogglingReminder }: CalendarListItemCardProps) {
	function handleRootClick() {
		if (onClick) onClick(item.id)
	}
	function handleEditClick(e: React.MouseEvent<HTMLButtonElement>) {
		e.stopPropagation()
		if (onEdit) onEdit(item.id)
	}
	function handleDeleteClick(e: React.MouseEvent<HTMLButtonElement>) {
		e.stopPropagation()
		if (onDelete) onDelete(item.id)
	}

	function handleReminderSwitchClick(e: React.MouseEvent) {
		e.stopPropagation()
	}

	function handleReminderToggleChange(_e: React.ChangeEvent<HTMLInputElement>, checked: boolean) {
		if (onToggleReminder) onToggleReminder(item.id, checked)
	}

	const timeText = buildTimeText(item)
	const leftBorderColor = item.color || 'primary.main'
	const isPast = isScheduleInPast(item)
	const showReminderToggle = item.startTime && !isPast

	const srOnlyStyle = {
		position: 'absolute' as const,
		width: '1px',
		height: '1px',
		padding: 0,
		margin: '-1px',
		overflow: 'hidden',
		clip: 'rect(0, 0, 0, 0)',
		whiteSpace: 'nowrap' as const,
		border: 0,
	}

	return (
		<Paper
			variant="outlined"
			onClick={handleRootClick}
			sx={{
				p: 1.25,
				borderLeft: 4,
				borderLeftColor: leftBorderColor,
				cursor: 'pointer',
				transition: 'box-shadow 120ms ease, background-color 120ms ease',
				'&:hover': { boxShadow: 1, bgcolor: 'action.hover' },
			}}
		>
			<Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
				<Stack spacing={0.75} sx={{ minWidth: 0 }}>
					<Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>{item.title}</Typography>
					<Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap">
						{showDateChip && (
							<Chip label={dayjs(item.scheduleDate).format('YYYY-MM-DD (dd)')} size="small" />
						)}
						{timeText && <Chip label={timeText} size="small" variant="outlined" />}
					</Stack>
					{item.description && (
						<Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
							{item.description}
						</Typography>
					)}
				</Stack>
				<Stack direction="row" spacing={0.5} alignItems="center">
					{showReminderToggle && (
						<Tooltip title={item.isReminderEnabled ? '알림 켜짐' : '알림 꺼짐'}>
							<Switch
								size="small"
								checked={Boolean(item.isReminderEnabled)}
								onChange={handleReminderToggleChange}
								onClick={handleReminderSwitchClick}
								disabled={isTogglingReminder}
							/>
						</Tooltip>
					)}
					<IconButton size="small" color="primary" aria-label="수정" onClick={handleEditClick}>
						<EditIcon fontSize="small" />
					</IconButton>
					<IconButton size="small" color="secondary" aria-label="삭제" onClick={handleDeleteClick}>
						<DeleteIcon fontSize="small" />
					</IconButton>
				</Stack>
			</Stack>
		</Paper>
	)
}


