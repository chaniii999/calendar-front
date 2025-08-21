import { NotificationsSSEHandlers, ReminderEventPayload, StartSSEOptions, TestEventPayload } from './types'

function delay(ms: number): Promise<void> {
	return new Promise(res => setTimeout(res, ms))
}

export function startNotificationsSSE(
	url: string,
	options: StartSSEOptions,
	handlers: NotificationsSSEHandlers = {}
): { stop: () => void } {
	let stopped = false
	let es: EventSource | null = null
	let reconnectDelay = options.initialReconnectDelayMs ?? 1000
	const maxReconnectDelay = options.maxReconnectDelayMs ?? 30000

	// de-dupe cache
	const ttl = options.deDuplicationTtlMs ?? 60_000
	const recentMap: Map<string, number> = new Map()

	function evictExpired(now: number) {
		for (const [key, ts] of recentMap.entries()) {
			if (now - ts > ttl) recentMap.delete(key)
		}
	}

	function rememberOnce(id: string): boolean {
		const now = Date.now()
		evictExpired(now)
		if (recentMap.has(id)) return false
		recentMap.set(id, now)
		return true
	}

	function bindEventHandlers(target: EventSource) {
		const onOpen = () => {
			reconnectDelay = options.initialReconnectDelayMs ?? 1000
			if (handlers.handleOpen) handlers.handleOpen()
		}

		const onError = () => {
			if (handlers.handleError) handlers.handleError('SSE connection error')
			target.close()
			es = null
		}

		function onReminder(e: MessageEvent) {
			try {
				const payload = JSON.parse(e.data) as ReminderEventPayload
				if (payload.scheduleId && rememberOnce(payload.scheduleId)) {
					if (handlers.handleReminderEvent) handlers.handleReminderEvent(payload)
				}
			} catch (_e) {}
		}

		function onTest(e: MessageEvent) {
			try {
				const payload = JSON.parse(e.data) as TestEventPayload
				if (handlers.handleTestEvent) handlers.handleTestEvent(payload)
			} catch (_e) {}
		}

		target.onopen = onOpen
		target.onerror = onError
		target.addEventListener('reminder', onReminder)
		target.addEventListener('test', onTest)
	}

	function buildConnector(): string | null {
		const token = options.getAccessToken ? options.getAccessToken() : (options.accessToken ?? null)
		if (!token) return null
		return `${url}?token=${encodeURIComponent(token)}`
	}

	async function connect() {
		if (stopped) return
		try {
			// 토큰을 쿼리로 부착 (EventSource는 기본 Authorization 헤더 미지원)
			const connector = buildConnector()
			if (!connector) throw new Error('No access token')
			es = new EventSource(connector, { withCredentials: false })
			bindEventHandlers(es)
		} catch (_e) {
			if (handlers.handleError) handlers.handleError('SSE init failure')
		}

		// 재연결 루프
		while (!stopped) {
			await delay(reconnectDelay)
			if (stopped) break
			if (es == null || es.readyState === EventSource.CLOSED) {
				try {
					const connector = buildConnector()
					if (!connector) throw new Error('No access token')
					es = new EventSource(connector, { withCredentials: false })
					bindEventHandlers(es)
					reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay)
				} catch (_e) {
					reconnectDelay = Math.min(reconnectDelay * 2, maxReconnectDelay)
				}
			}
		}
	}

	connect()

	return {
		stop() {
			stopped = true
			if (es) es.close()
			es = null
		}
	}
}


