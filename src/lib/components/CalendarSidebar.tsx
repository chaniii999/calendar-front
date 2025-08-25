import React from 'react'
import { Stack, Button, Paper, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { DateCalendar } from '@mui/x-date-pickers'
import type { Dayjs } from 'dayjs'
import { QuickAddSchedule } from '@components/QuickAddSchedule'
import type { ScheduleResponse } from '@lib/api/schedule'

export interface CalendarSidebarProps {
	cursor: Dayjs
	onDateChange: (next: Dayjs) => void
	onTodayClick: () => void
	onAddClick?: () => void
  onQuickCreated?: (item: ScheduleResponse) => void
}

export function CalendarSidebar({ cursor, onDateChange, onTodayClick, onAddClick, onQuickCreated }: CalendarSidebarProps) {
	function handleMiniCalendarChange(next: Dayjs | null) {
		if (!next) return
		onDateChange(next)
	}

	function handleTodayButtonClick() {
		onTodayClick()
	}

	function handleAddButtonClick() {
		if (onAddClick) onAddClick()
	}

	function handleQuickAddCreated(item: ScheduleResponse) {
		if (onQuickCreated) onQuickCreated(item)
	}

	return (
		<Paper>
			<Stack spacing={1.5}>
				<DateCalendar value={cursor} onChange={handleMiniCalendarChange} views={[ 'day', 'month', 'year' ]} />
				<Button onClick={handleTodayButtonClick}>오늘</Button>
				<IconButton color="primary" onClick={handleAddButtonClick} aria-label="일정 추가">
					<AddIcon />
				</IconButton>
				<QuickAddSchedule defaultDate={cursor.format('YYYY-MM-DD')} onCreated={handleQuickAddCreated} />
			</Stack>
		</Paper>
	)
}


