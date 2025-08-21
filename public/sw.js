/* eslint-disable no-restricted-globals */

self.addEventListener('install', (event) => {
	event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
	if (!event.data) return
	let payload
	try {
		payload = event.data.json()
	} catch (_e) {
		payload = { title: '알림', body: event.data.text() }
	}
	const title = payload.title || '캘린더 알림'
	const options = {
		body: payload.body || '',
		icon: payload.icon || '/icons/icon-192.png',
		badge: payload.badge || '/icons/badge-72.png',
		data: payload.data || {},
		tag: payload.tag || undefined,
		renotify: Boolean(payload.tag),
	}
	event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
	event.notification.close()
	const targetUrl = (event.notification && event.notification.data && event.notification.data.url) || '/calendar'
	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			for (const client of clientList) {
				if ('focus' in client) {
					client.focus()
					if ('navigate' in client && targetUrl) {
						return client.navigate(targetUrl)
					}
					return
				}
			}
			if (self.clients.openWindow) {
				return self.clients.openWindow(targetUrl)
			}
			return undefined
		})
	)
})


