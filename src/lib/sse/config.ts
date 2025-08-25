import { API_BASE, SSE_NOTIFICATIONS_PATH } from '@lib/api/config'
export const sseConfig = {
	notificationsPath: SSE_NOTIFICATIONS_PATH || `${API_BASE}/api/notifications/stream`,
}


