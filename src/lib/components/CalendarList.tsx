import React from 'react'
import { List, ListItem, ListItemText, Chip, Stack, Typography, Divider } from '@mui/material'
import dayjs from 'dayjs'
import type { ScheduleListItem } from '../../ui/pages/calendar/types'

export interface CalendarListProps {
	items: ScheduleListItem[]
	groupByDate?: boolean
}

function formatTimeRange(item: ScheduleListItem): string {
	if (item.isAllDay) return '종일'
	if (item.startTime && item.endTime) return `${item.startTime} - ${item.endTime}`
	if (item.startTime) return `${item.startTime}`
	return ''
}

export function CalendarList({ items, groupByDate = true }: CalendarListProps) {
	if (!items.length) {
		return <Typography variant="body2" color="text.secondary">표시할 일정이 없습니다.</Typography>
	}

	if (!groupByDate) {
		return (
			<List>
				{items.map(it => (
					<ListItem key={it.id} sx={{ px: 1 }}>
						<ListItemText
							primary={it.title}
							secondary={
								<Stack spacing={0.25}>
									<Typography variant="caption" color="text.secondary">{formatTimeRange(it)}</Typography>
									{it.description && (
										<Typography variant="caption" color="text.secondary">{it.description}</Typography>
									)}
								</Stack>
							}
						/>
						{it.color && <Chip size="small" label={it.color} sx={{ ml: 1 }} />}
					</ListItem>
				))}
			</List>
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
						<List>
							{grouped[date].map(it => (
								<ListItem key={it.id} sx={{ px: 1 }}>
									<ListItemText
										primary={it.title}
										secondary={
											<Stack spacing={0.25}>
												<Typography variant="caption" color="text.secondary">{formatTimeRange(it)}</Typography>
												{it.description && (
													<Typography variant="caption" color="text.secondary">{it.description}</Typography>
												)}
											</Stack>
										}
									/>
									{it.color && <Chip size="small" label={it.color} sx={{ ml: 1 }} />}
								</ListItem>
							))}
						</List>
					</Stack>
					{idx < keys.length - 1 && <Divider />}
				</React.Fragment>
			))}
		</Stack>
	)
}


