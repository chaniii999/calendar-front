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

	// verbose logging toggle (dev 모드 또는 VITE_LOG_SSE=true)
	const _env = (import.meta as unknown as { env?: Record<string, unknown> }).env ?? {}
	const isDebugLoggingEnabled = (_env['DEV'] === true) || (_env['VITE_LOG_SSE'] === 'true')

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
			if (isDebugLoggingEnabled) { try { console.info('[SSE] connected') } catch (_e) {} }
		}

		const onError = () => {
			if (handlers.handleError) handlers.handleError('SSE connection error')
			target.close()
			es = null
			// always warn on errors
			try { console.warn('[SSE] error, connection closed; will retry') } catch (_e) {}
		}

		function onReminder(e: MessageEvent) {
			try {
				const payload = JSON.parse(e.data) as ReminderEventPayload
				if (payload.scheduleId && rememberOnce(payload.scheduleId)) {
					if (handlers.handleReminderEvent) handlers.handleReminderEvent(payload)
					if (isDebugLoggingEnabled) { try { console.info('[SSE] schedule-reminder', { scheduleId: payload.scheduleId }) } catch (_e) {} }
				}
			} catch (_e) {
				if (handlers.handleError) handlers.handleError('잘못된 알림 이벤트 데이터 형식')
				try { console.error('[SSE] invalid schedule-reminder payload', { raw: e.data }) } catch (__e) {}
			}
		}

		function onTest(e: MessageEvent) {
			try {
				const payload = JSON.parse(e.data) as TestEventPayload
				if (handlers.handleTestEvent) handlers.handleTestEvent(payload)
				if (isDebugLoggingEnabled) { try { console.info('[SSE] test', payload) } catch (_e) {} }
			} catch (_e) {
				if (handlers.handleError) handlers.handleError('잘못된 테스트 이벤트 데이터 형식')
				try { console.error('[SSE] invalid test payload', { raw: e.data }) } catch (__e) {}
			}
		}

		target.onopen = onOpen
		target.onerror = onError
		target.addEventListener('schedule-reminder', onReminder)
		target.addEventListener('test', onTest)
	}

	function buildConnector(): string | null {
		// 세션 기반 연결을 우선 시도 (토큰 노출 없음)
		if (url.includes('/subscribe')) {
			return url // 세션 기반 엔드포인트는 토큰 없이 연결
		}
		
		// 기존 토큰 기반 연결 (하위 호환성)
		const token = options.getAccessToken ? options.getAccessToken() : (options.accessToken ?? null)
		if (!token) return null
		// lightweight JWT check: header.payload.signature (two dots) and not an email
		const looksLikeJwt = typeof token === 'string' && token.split('.').length === 3 && token.indexOf('@') === -1
		if (!looksLikeJwt) {
			// skip connecting with invalid token; let reconnection loop fetch a refreshed token later
			try { console.warn('[SSE] invalid token format; waiting for refresh') } catch (_e) {} 
			return null
		}
		return `${url}?token=${encodeURIComponent(token)}`
	}

	async function connect() {
		if (stopped) return
		try {
			const connector = buildConnector()
			if (!connector) throw new Error('No access token')
			if (isDebugLoggingEnabled) { try { console.info('[SSE] connecting', { url: connector }) } catch (_e) {} }
			
			// 세션 기반 연결인지 확인하여 withCredentials 설정
			const isSessionBased = connector.includes('/subscribe') && !connector.includes('token=')
			es = new EventSource(connector, { withCredentials: isSessionBased })
			
			bindEventHandlers(es)
		} catch (_e) {
			if (handlers.handleError) handlers.handleError('SSE init failure')
			// always log init failure
			try { console.error('[SSE] init failure') } catch (__e) {}
		}

		// 재연결 루프
		while (!stopped) {
			await delay(reconnectDelay)
			if (stopped) break
			if (es == null || es.readyState === EventSource.CLOSED) {
				try {
					const connector = buildConnector()
					if (!connector) throw new Error('No access token')
					if (isDebugLoggingEnabled) { try { console.info('[SSE] reconnecting') } catch (_e) {} }
					
					// 세션 기반 연결인지 확인하여 withCredentials 설정
					const isSessionBased = connector.includes('/subscribe') && !connector.includes('token=')
					es = new EventSource(connector, { withCredentials: isSessionBased })
					
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
			if (isDebugLoggingEnabled) { try { console.info('[SSE] stopped') } catch (_e) {} }
		}
	}
}


