export const sseConfig = {
	notificationsPath: (import.meta.env.VITE_SSE_NOTIFICATIONS_PATH as string | undefined) || '/api/notifications/subscribe-public',
}


