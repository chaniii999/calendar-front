export interface ScheduleListItem {
	id: string
	title: string
	scheduleDate: string
	startTime?: string
	endTime?: string
	color?: string
	isAllDay?: boolean
	description?: string
}


export interface PushSubscriptionInfo {
	endpoint: string
	p256dh: string
	auth: string
}


