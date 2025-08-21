import { http } from './http'
import { notificationEndpoints } from '../notifications/config'

export interface PushPublicKeyResponse {
	publicKey: string
}

export interface SaveSubscriptionRequest {
	endpoint: string
	keys: { p256dh: string, auth: string }
}

export const NotificationApi = {
	async getVapidPublicKey(): Promise<string> {
		const res = await http<{ success: boolean, data: PushPublicKeyResponse }>(notificationEndpoints.publicKeyPath)
		return res.data.publicKey
	},
	async saveSubscription(subscription: PushSubscription): Promise<void> {
		const payload: SaveSubscriptionRequest = {
			endpoint: subscription.endpoint,
			keys: {
				p256dh: arrayBufferToBase64Url(subscription.getKey('p256dh')),
				auth: arrayBufferToBase64Url(subscription.getKey('auth')),
			},
		}
		await http<{ success: boolean, data: null }>(notificationEndpoints.subscribePath, {
			method: 'POST',
			body: JSON.stringify(payload),
		})
	},
	async deleteSubscription(endpoint: string): Promise<void> {
		await http<{ success: boolean, data: null }>(notificationEndpoints.unsubscribePath, {
			method: 'POST',
			body: JSON.stringify({ endpoint }),
		})
	}
}

function arrayBufferToBase64Url(buf: ArrayBuffer | null): string {
	if (!buf) return ''
	const bytes = new Uint8Array(buf)
	let binary = ''
	for (let i = 0; i < bytes.byteLength; i += 1) {
		binary += String.fromCharCode(bytes[i])
	}
	const base64 = btoa(binary)
	return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}


