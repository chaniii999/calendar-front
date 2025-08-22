export interface ScheduleListItem {
	id: string
	title: string
	scheduleDate: string
	startTime?: string
	endTime?: string
	color?: string
	isAllDay?: boolean
	description?: string
	reminderMinutes?: number
	isReminderEnabled?: boolean
}


// PushSubscriptionInfo removed as push domain is deprecated
