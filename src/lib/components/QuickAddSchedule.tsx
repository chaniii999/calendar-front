import React, { useState } from 'react'
import { Stack, TextField, Button } from '@mui/material'
import { ScheduleApi, type ScheduleRequest, type ScheduleResponse } from '@lib/api/schedule'

export interface QuickAddScheduleProps {
	defaultDate: string
	onCreated: (item: ScheduleResponse) => void
}

export function QuickAddSchedule({ defaultDate, onCreated }: QuickAddScheduleProps) {
	const [title, setTitle] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	function handleTitleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
		setTitle(e.target.value)
	}

	async function handleAddButtonClick() {
		if (!title.trim() || isSubmitting) return
		setIsSubmitting(true)
		const payload: ScheduleRequest = { title: title.trim(), scheduleDate: defaultDate }
		try {
			const created = await ScheduleApi.create(payload)
			onCreated(created)
			setTitle('')
		} finally {
			setIsSubmitting(false)
		}
	}

	function handleTitleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
		if (e.key === 'Enter') {
			e.preventDefault()
			handleAddButtonClick()
		}
	}

	return (
		<Stack spacing={1}>
			<TextField
				label="빠른 일정 추가"
				placeholder="제목 입력 후 Enter"
				size="small"
				value={title}
				onChange={handleTitleInputChange}
				onKeyDown={handleTitleInputKeyDown}
				disabled={isSubmitting}
			/>
			<Button onClick={handleAddButtonClick} disabled={isSubmitting || !title.trim()} variant="outlined">추가</Button>
		</Stack>
	)
}


