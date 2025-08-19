import React from 'react'
import { Stack, Button, Typography, Paper } from '@mui/material'
import { DateCalendar } from '@mui/x-date-pickers'
import type { Dayjs } from 'dayjs'

export interface CalendarSidebarProps {
	cursor: Dayjs
	onDateChange: (next: Dayjs) => void
	onTodayClick: () => void
}

export function CalendarSidebar({ cursor, onDateChange, onTodayClick }: CalendarSidebarProps) {
	function handleMiniCalendarChange(next: Dayjs | null) {
		if (!next) return
		onDateChange(next)
	}

	function handleTodayButtonClick() {
		onTodayClick()
	}

	return (
		<Paper>
			<Stack spacing={1.5}>
				<Typography variant="subtitle1">달력</Typography>
				<DateCalendar value={cursor} onChange={handleMiniCalendarChange} views={[ 'day', 'month', 'year' ]} />
				<Button onClick={handleTodayButtonClick}>오늘</Button>
			</Stack>
		</Paper>
	)
}


