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
		const res = await http<unknown>(notificationEndpoints.publicKeyPath)
		const key = extractPublicKey(res)
		if (!key) {
			throw new Error('Invalid public key response')
		}
		return key
	},
	async saveSubscription(subscription: PushSubscription): Promise<void> {
		const payload: SaveSubscriptionRequest = {
			endpoint: subscription.endpoint,
			keys: {
				p256dh: arrayBufferToBase64Url(subscription.getKey('p256dh')),
				auth: arrayBufferToBase64Url(subscription.getKey('auth')),
			},
		}
		await http<unknown>(notificationEndpoints.subscribePath, {
			method: 'POST',
			body: JSON.stringify(payload),
		})
	},
	async deleteSubscription(endpoint: string): Promise<void> {
		await http<unknown>(notificationEndpoints.unsubscribePath, {
			method: 'POST',
			body: JSON.stringify({ endpoint }),
		})
	}
}

function extractPublicKey(res: unknown): string | null {
	// 허용 포맷:
	// 1) { success: true, data: { publicKey: '...' } }
	// 2) { publicKey: '...' }
	// 3) '...'(그 자체)
	if (typeof res === 'string') return res
	if (res && typeof res === 'object') {
		const obj = res as Record<string, unknown>
		if (typeof obj.publicKey === 'string') return obj.publicKey
		if (obj.data && typeof (obj as any).data.publicKey === 'string') return (obj as any).data.publicKey
	}
	return null
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


