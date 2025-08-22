export interface ReminderEventPayload {
	scheduleId: string
	title: string
	scheduleDate?: string
	startTime?: string
	isAllDay?: boolean
	message?: string
	triggerAtEpochMs?: number
}

export interface TestEventPayload {
	message: string
}

export interface NotificationsSSEHandlers {
	handleOpen?(): void
	handleError?(errorMessage: string): void
	handleReminderEvent?(payload: ReminderEventPayload): void
	handleTestEvent?(payload: TestEventPayload): void
}

export interface StartSSEOptions {
	accessToken?: string
	getAccessToken?: () => string | null
	deDuplicationTtlMs?: number
	maxReconnectDelayMs?: number
	initialReconnectDelayMs?: number
}


