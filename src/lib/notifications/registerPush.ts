import { NotificationApi } from '../api/notification'

export async function ensureServiceWorkerRegistered(): Promise<ServiceWorkerRegistration | null> {
	if (!('serviceWorker' in navigator)) return null
	try {
		const reg = await navigator.serviceWorker.register('/sw.js')
		return reg
	} catch (_e) {
		return null
	}
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
	if (!('Notification' in window)) return 'denied'
	const permission = await Notification.requestPermission()
	return permission
}

export async function subscribePush(): Promise<PushSubscription | null> {
	const reg = await ensureServiceWorkerRegistered()
	if (!reg) return null
	if (!('PushManager' in window)) return null
	const permission = await requestNotificationPermission()
	if (permission !== 'granted') return null
	try {
		const key = await NotificationApi.getVapidPublicKey()
		const sub = await reg.pushManager.subscribe({
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(key),
		})
		await NotificationApi.saveSubscription(sub)
		return sub
	} catch (_e) {
		return null
	}
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
	const reg = await ensureServiceWorkerRegistered()
	if (!reg) return null
	return reg.pushManager.getSubscription()
}

export async function unsubscribePush(): Promise<boolean> {
	const reg = await ensureServiceWorkerRegistered()
	if (!reg) return false
	const sub = await reg.pushManager.getSubscription()
	if (!sub) return true
	try {
		await NotificationApi.deleteSubscription(sub.endpoint)
		const ok = await sub.unsubscribe()
		return ok
	} catch (_e) {
		return false
	}
}

function urlBase64ToUint8Array(base64String: string) {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
	const rawData = atob(base64)
	const outputArray = new Uint8Array(rawData.length)
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i)
	}
	return outputArray
}


