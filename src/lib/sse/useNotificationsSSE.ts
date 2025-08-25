import { useEffect, useRef } from 'react'
import { startNotificationsSSE } from '@lib/sse/notifications'
import { sseConfig } from '@lib/sse/config'
import type { NotificationsSSEHandlers } from '@lib/sse/types'
import { readTokensFromStorage } from '@lib/auth/session'

export function useNotificationsSSE(handlers: NotificationsSSEHandlers = {}) {
	const stopRef = useRef<null | (() => void)>(null)

	useEffect(() => {
		const { stop } = startNotificationsSSE(sseConfig.notificationsPath, {
			getAccessToken: () => {
				const tokens = readTokensFromStorage()
				return tokens.accessToken
			},
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


