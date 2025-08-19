import React from 'react'
import { Stack, Button, Paper, IconButton } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import { DateCalendar } from '@mui/x-date-pickers'
import type { Dayjs } from 'dayjs'

export interface CalendarSidebarProps {
	cursor: Dayjs
	onDateChange: (next: Dayjs) => void
	onTodayClick: () => void
	onAddClick?: () => void
}

export function CalendarSidebar({ cursor, onDateChange, onTodayClick, onAddClick }: CalendarSidebarProps) {
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

	return (
		<Paper>
			<Stack spacing={1.5}>
				<DateCalendar value={cursor} onChange={handleMiniCalendarChange} views={[ 'day', 'month', 'year' ]} />
				<Button onClick={handleTodayButtonClick}>오늘</Button>
				<IconButton color="primary" onClick={handleAddButtonClick} aria-label="일정 추가">
					<AddIcon />
				</IconButton>
			</Stack>
		</Paper>
	)
}


