import React from 'react'
import { List, ListItem, ListItemText, Chip, Stack, Typography, Divider, Paper, IconButton } from '@mui/material'
import dayjs from 'dayjs'
import type { ScheduleListItem } from '../../ui/pages/calendar/types'
import { CalendarListItemCard } from './CalendarListItemCard'

export interface CalendarListProps {
	items: ScheduleListItem[]
	groupByDate?: boolean
	onEdit?: (scheduleId: string) => void
	onDelete?: (scheduleId: string) => void
	onItemClick?: (scheduleId: string) => void
	onToggleReminder?: (scheduleId: string, enabled: boolean) => void
}

function formatTimeRange(item: ScheduleListItem): string {
	if (item.isAllDay) return '종일'
	if (item.startTime && item.endTime) return `${item.startTime} - ${item.endTime}`
	if (item.startTime) return `${item.startTime}`
	return ''
}

export function CalendarList({ items, groupByDate = true, onEdit, onDelete, onItemClick, onToggleReminder }: CalendarListProps) {
	if (!items.length) {
		return <Typography variant="body2" color="text.secondary">표시할 일정이 없습니다.</Typography>
	}

	function handleEditButtonClick(e: React.MouseEvent<HTMLButtonElement>) {
		e.stopPropagation()
		const id = e.currentTarget.getAttribute('data-id')
		if (id && onEdit) onEdit(id)
	}

	function handleDeleteButtonClick(e: React.MouseEvent<HTMLButtonElement>) {
		e.stopPropagation()
		const id = e.currentTarget.getAttribute('data-id')
		if (id && onDelete) onDelete(id)
	}

	function handleItemPaperClick(e: React.MouseEvent<HTMLDivElement>) {
		const id = e.currentTarget.getAttribute('data-id')
		if (id && onItemClick) onItemClick(id)
	}

	if (!groupByDate) {
		return (
			<Stack spacing={1}>
				{items.map(it => (
					<CalendarListItemCard key={it.id} item={it} onClick={onItemClick} onEdit={onEdit} onDelete={onDelete} onToggleReminder={onToggleReminder} />
				))}
			</Stack>
		)
	}

	const grouped = items.reduce<Record<string, ScheduleListItem[]>>((acc, it) => {
		const key = it.scheduleDate
		if (!acc[key]) acc[key] = []
		acc[key].push(it)
		return acc
	}, {})

	const keys = Object.keys(grouped).sort()

	return (
		<Stack spacing={1}>
			{keys.map((date, idx) => (
				<React.Fragment key={date}>
					<Stack spacing={0.5}>
						<Typography variant="subtitle2" sx={{ px: 1, py: 0.25, borderRadius: 1, bgcolor: 'primary.main', color: 'primary.contrastText', display: 'inline-block', width: 'fit-content' }}>
							{dayjs(date).format('YYYY-MM-DD (dd)')}
						</Typography>
						<Stack spacing={1}>
							{grouped[date].map(it => (
								<CalendarListItemCard key={it.id} item={it} onClick={onItemClick} onEdit={onEdit} onDelete={onDelete} onToggleReminder={onToggleReminder} />
							))}
						</Stack>
					</Stack>
					{idx < keys.length - 1 && <Divider />}
				</React.Fragment>
			))}
		</Stack>
	)
}


