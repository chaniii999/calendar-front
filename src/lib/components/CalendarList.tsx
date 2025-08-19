import React from 'react'
import { List, ListItem, ListItemText, Chip, Stack, Typography, Divider, Paper, IconButton } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import dayjs from 'dayjs'
import type { ScheduleListItem } from '../../ui/pages/calendar/types'

export interface CalendarListProps {
	items: ScheduleListItem[]
	groupByDate?: boolean
	onEdit?: (scheduleId: string) => void
	onDelete?: (scheduleId: string) => void
}

function formatTimeRange(item: ScheduleListItem): string {
	if (item.isAllDay) return '종일'
	if (item.startTime && item.endTime) return `${item.startTime} - ${item.endTime}`
	if (item.startTime) return `${item.startTime}`
	return ''
}

export function CalendarList({ items, groupByDate = true, onEdit, onDelete }: CalendarListProps) {
	if (!items.length) {
		return <Typography variant="body2" color="text.secondary">표시할 일정이 없습니다.</Typography>
	}

	function handleEditButtonClick(e: React.MouseEvent<HTMLButtonElement>) {
		const id = e.currentTarget.getAttribute('data-id')
		if (id && onEdit) onEdit(id)
	}

	function handleDeleteButtonClick(e: React.MouseEvent<HTMLButtonElement>) {
		const id = e.currentTarget.getAttribute('data-id')
		if (id && onDelete) onDelete(id)
	}

	if (!groupByDate) {
		return (
			<Stack spacing={1}>
				{items.map(it => (
					<Paper key={it.id} variant="outlined" sx={{ p: 1.25 }}>
						<Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
							<Stack spacing={0.25} sx={{ minWidth: 0 }}>
								<Typography variant="subtitle2" noWrap>{it.title}</Typography>
								<Typography variant="caption" color="text.secondary">{formatTimeRange(it)}</Typography>
								{it.description && (
									<Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>{it.description}</Typography>
								)}
								{it.color && <Chip size="small" label={it.color} />}
							</Stack>
							<Stack direction="row" spacing={0.5}>
								<IconButton size="small" color="primary" aria-label="수정" data-id={it.id} onClick={handleEditButtonClick}>
									<EditIcon fontSize="small" />
								</IconButton>
								<IconButton size="small" color="secondary" aria-label="삭제" data-id={it.id} onClick={handleDeleteButtonClick}>
									<DeleteIcon fontSize="small" />
								</IconButton>
							</Stack>
						</Stack>
					</Paper>
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
						<Typography variant="subtitle2">{dayjs(date).format('YYYY-MM-DD (dd)')}</Typography>
						<Stack spacing={1}>
							{grouped[date].map(it => (
								<Paper key={it.id} variant="outlined" sx={{ p: 1.25 }}>
									<Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
										<Stack spacing={0.25} sx={{ minWidth: 0 }}>
											<Typography variant="subtitle2" noWrap>{it.title}</Typography>
											<Typography variant="caption" color="text.secondary">{formatTimeRange(it)}</Typography>
											{it.description && (
												<Typography variant="caption" color="text.secondary" sx={{ wordBreak: 'break-word' }}>{it.description}</Typography>
											)}
											{it.color && <Chip size="small" label={it.color} />}
										</Stack>
										<Stack direction="row" spacing={0.5}>
											<IconButton size="small" color="primary" aria-label="수정" data-id={it.id} onClick={handleEditButtonClick}>
												<EditIcon fontSize="small" />
											</IconButton>
											<IconButton size="small" color="secondary" aria-label="삭제" data-id={it.id} onClick={handleDeleteButtonClick}>
												<DeleteIcon fontSize="small" />
											</IconButton>
										</Stack>
									</Stack>
								</Paper>
							))}
						</Stack>
					</Stack>
					{idx < keys.length - 1 && <Divider />}
				</React.Fragment>
			))}
		</Stack>
	)
}


