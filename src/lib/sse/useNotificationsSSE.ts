import { useEffect, useRef } from 'react'
import { startNotificationsSSE } from './notifications'
import { sseConfig } from './config'
import type { NotificationsSSEHandlers } from './types'
import { readTokensFromStorage } from '../auth/session'

export function useNotificationsSSE(handlers: NotificationsSSEHandlers = {}) {
	const stopRef = useRef<null | (() => void)>(null)

	useEffect(() => {
		const { stop } = startNotificationsSSE(sseConfig.notificationsPath, {
			getAccessToken: () => readTokensFromStorage().accessToken,
			deDuplicationTtlMs: 60_000,
			initialReconnectDelayMs: 1000,
			maxReconnectDelayMs: 30_000,
		}, handlers)
		stopRef.current = stop
		return () => {
			if (stopRef.current) stopRef.current()
			stopRef.current = null
		}
	}, [])
}


