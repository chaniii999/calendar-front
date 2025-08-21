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


// PushSubscriptionInfo removed as push domain is deprecated
