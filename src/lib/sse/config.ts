const BASE = (import.meta as unknown as { env?: Record<string, string> }).env?.['VITE_API_BASE'] || ''
export const sseConfig = {
	notificationsPath: (import.meta.env.VITE_SSE_NOTIFICATIONS_PATH as string | undefined) || `${BASE}/api/notifications/stream`,
}


