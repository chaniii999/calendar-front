import React from 'react'
import { Stack, Paper, Skeleton, Typography } from '@mui/material'

export interface CalendarListSkeletonProps {
	count?: number
}

export function CalendarListSkeleton({ count = 6 }: CalendarListSkeletonProps) {
	const items = Array.from({ length: count })
	return (
		<Stack spacing={1}>
			{items.map((_, idx) => (
				<Paper key={idx} variant="outlined" sx={{ p: 1.25 }}>
					<Stack spacing={0.75}>
						<Skeleton variant="text" width={140} height={18} />
						<Skeleton variant="text" width="60%" height={16} />
						<Skeleton variant="text" width="80%" height={14} />
					</Stack>
				</Paper>
			))}
		</Stack>
	)
}


