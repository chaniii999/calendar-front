import React from 'react'
import { Button, Stack } from '@mui/material'

export interface PushControlsProps {
	isEnabled: boolean
	onSubscribe: () => void
	onUnsubscribe: () => void
}

export function PushControls({ isEnabled, onSubscribe, onUnsubscribe }: PushControlsProps) {
	return (
		<Stack direction="row" spacing={2}>
			<Button variant="outlined" onClick={onSubscribe} disabled={isEnabled}>
				푸시 알림 켜기
			</Button>
			<Button variant="outlined" onClick={onUnsubscribe} disabled={!isEnabled}>
				푸시 알림 끄기
			</Button>
		</Stack>
	)
}


