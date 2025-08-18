import React from 'react'
import dayjs from 'dayjs'
import { Card, CardContent, Typography, Grid, Stack, IconButton } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

export interface CalendarMonthEvent {
  id: string
  title: string
  scheduleDate: string
  color?: string
}

export interface CalendarMonthProps {
  month: dayjs.Dayjs
  eventsByDate: Record<string, CalendarMonthEvent[]>
}

export function CalendarMonth({ month, eventsByDate }: CalendarMonthProps) {
  const start = month.startOf('month')
  const end = month.endOf('month')
  const days: string[] = []
  for (let d = start; d.isBefore(end) || d.isSame(end, 'day'); d = d.add(1, 'day')) {
    days.push(d.format('YYYY-MM-DD'))
  }
  return (
    <Grid container spacing={1} columns={7}>
      {days.map(d => {
        const list = eventsByDate[d] ?? []
        return (
          <Grid key={d} item xs={1}>
            <Card variant="outlined">
              <CardContent sx={{ p: 1.5 }}>
                <Typography variant="caption" color="text.secondary">{dayjs(d).format('D')}</Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {list.slice(0, 3).map(ev => (
                    <Stack key={ev.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ '&:hover .evt-actions': { opacity: 1 } }}>
                      <Typography variant="caption" noWrap>{ev.title}</Typography>
                      <span className="evt-actions" style={{ opacity: 0 }}>
                        <IconButton size="small" sx={{ p: 0.5 }} data-id={ev.id}><EditIcon fontSize="inherit" /></IconButton>
                        <IconButton size="small" sx={{ p: 0.5 }} data-id={ev.id}><DeleteIcon fontSize="inherit" /></IconButton>
                      </span>
                    </Stack>
                  ))}
                  {list.length > 3 && (
                    <Typography variant="caption" color="text.disabled">+{list.length - 3}</Typography>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        )
      })}
    </Grid>
  )
}

