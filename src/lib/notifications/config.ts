interface NotificationEndpointsConfig {
	publicKeyPath: string
	subscribePath: string
	unsubscribePath: string
}

export const notificationEndpoints: NotificationEndpointsConfig = {
	publicKeyPath: import.meta.env.VITE_PUSH_PUBLIC_KEY_PATH || '/api/notifications/public-key',
	subscribePath: import.meta.env.VITE_PUSH_SUBSCRIBE_PATH || '/api/notifications/subscribe',
	unsubscribePath: import.meta.env.VITE_PUSH_UNSUBSCRIBE_PATH || '/api/notifications/unsubscribe',
}

export const notificationConfig = {
	publicKeyOverride: (import.meta.env.VITE_PUSH_PUBLIC_KEY as string | undefined) || undefined,
}


