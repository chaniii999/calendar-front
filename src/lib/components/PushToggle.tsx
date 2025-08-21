import React from 'react'
import { IconButton, Tooltip } from '@mui/material'
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive'
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff'

export interface PushToggleProps {
	isEnabled: boolean
	onToggle: () => void
}

export function PushToggle({ isEnabled, onToggle }: PushToggleProps) {
	return (
		<Tooltip title={isEnabled ? '푸시 알림 끄기' : '푸시 알림 켜기'}>
			<IconButton color={isEnabled ? 'primary' : 'default'} onClick={onToggle} aria-label="push-toggle">
				{isEnabled ? <NotificationsActiveIcon /> : <NotificationsOffIcon />}
			</IconButton>
		</Tooltip>
	)
}


