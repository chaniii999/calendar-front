/* eslint-disable no-restricted-globals */

self.addEventListener('install', (event) => {
	event.waitUntil(self.skipWaiting())
})

self.addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim())
})

// push/notificationclick 제거됨


