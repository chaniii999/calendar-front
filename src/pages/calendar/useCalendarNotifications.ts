import { useEffect, useRef, useState } from 'react'
import type { ReminderEventPayload, TestEventPayload } from '@lib/sse/types'
import { useNotificationsSSE } from '@lib/sse/useNotificationsSSE'

export interface CalendarNotificationData {
  title: string
  message?: string
  scheduleDate?: string
  startTime?: string
  endTime?: string
}

export interface UseCalendarNotificationsOptions {
  handleShowMessage?: (message: string) => void
}

export function useCalendarNotifications(options: UseCalendarNotificationsOptions = {}) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifData, setNotifData] = useState<CalendarNotificationData | null>(null)

  const audioCtxRef = useRef<AudioContext | null>(null)
  const beepIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const beepStopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeOscillatorsRef = useRef<OscillatorNode[]>([])

  function stopAllAudio() {
    if (beepIntervalRef.current) { 
      clearInterval(beepIntervalRef.current); 
      beepIntervalRef.current = null 
    }
    if (beepStopTimeoutRef.current) { 
      clearTimeout(beepStopTimeoutRef.current); 
      beepStopTimeoutRef.current = null 
    }
    // 모든 활성 오실레이터 즉시 중단
    activeOscillatorsRef.current.forEach(osc => {
      try {
        osc.stop()
      } catch (_e) {}
    })
    activeOscillatorsRef.current = []
    
    if (audioCtxRef.current) {
      try { 
        audioCtxRef.current.close() 
      } catch (_e) {}
      audioCtxRef.current = null
    }
  }

  function handleNotificationDialogCloseButtonClick() {
    stopAllAudio()
    setNotifOpen(false)
  }

  function playMelodyOnce() {
    try {
      const Ctx: any = (window as any).AudioContext || (window as any).webkitAudioContext
      const ctx: AudioContext = new Ctx()
      const melody: Array<{ f: number, d: number }> = [
        { f: 880.0, d: 0.45 },
        { f: 987.77, d: 0.45 },
        { f: 1108.73, d: 0.45 },
        { f: 1318.51, d: 0.6 },
        { f: 0, d: 0.2 },
        { f: 880.0, d: 0.45 },
        { f: 1318.51, d: 0.45 },
        { f: 1108.73, d: 0.45 },
        { f: 987.77, d: 0.6 },
      ]
      let t = ctx.currentTime
      const oscillators: OscillatorNode[] = []
      
      for (const note of melody) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        const isRest = note.f === 0
        if (!isRest) osc.frequency.setValueAtTime(note.f, t)
        gain.gain.setValueAtTime(0.0001, t)
        if (!isRest) gain.gain.exponentialRampToValueAtTime(0.15, t + 0.05)
        gain.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.1, note.d - 0.05))
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + note.d)
        if (!isRest) {
          oscillators.push(osc)
          activeOscillatorsRef.current.push(osc)
        }
        t += note.d + 0.05
      }
      
      audioCtxRef.current = ctx
      const totalMs = (t - ctx.currentTime + 0.2) * 1000
      
      // 완료된 오실레이터들을 activeOscillatorsRef에서 제거
      setTimeout(() => {
        oscillators.forEach(osc => {
          const index = activeOscillatorsRef.current.indexOf(osc)
          if (index > -1) {
            activeOscillatorsRef.current.splice(index, 1)
          }
        })
        try { ctx.close() } catch (_e) {}
        if (audioCtxRef.current === ctx) audioCtxRef.current = null
      }, totalMs)
    } catch (_e) {}
  }

  useEffect(() => {
    if (!notifOpen) {
      stopAllAudio()
      return
    }
    playMelodyOnce()
    beepIntervalRef.current = setInterval(() => { playMelodyOnce() }, 6000)
    beepStopTimeoutRef.current = setTimeout(() => {
      if (beepIntervalRef.current) { clearInterval(beepIntervalRef.current); beepIntervalRef.current = null }
    }, 60000)
    return () => {
      if (beepIntervalRef.current) { clearInterval(beepIntervalRef.current); beepIntervalRef.current = null }
      if (beepStopTimeoutRef.current) { clearTimeout(beepStopTimeoutRef.current); beepStopTimeoutRef.current = null }
    }
  }, [notifOpen])

  function handleReminderEvent(payload: ReminderEventPayload) {
    const title = payload.title || '일정 알림'
    const message = payload.message && payload.message.trim().length > 0 ? payload.message : ''
    const startTime = payload.startTime
    const scheduleDate = payload.scheduleDate
    setNotifData({ title, message, scheduleDate, startTime, endTime: undefined })
    setNotifOpen(true)
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification(title, { body: message || '' }) } catch (_e) {}
    }
  }

  function handleTestEvent(payload: TestEventPayload) {
    const msg = payload.message || 'test'
    if (options.handleShowMessage) options.handleShowMessage(`테스트: ${msg}`)
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification('테스트 알림', { body: msg }) } catch (_e) {}
    }
  }

  function handleSseOpen() {
    if ('Notification' in window && Notification.permission === 'default') {
      try { Notification.requestPermission().catch(() => {}) } catch (_e) {}
    }
    if (options.handleShowMessage) options.handleShowMessage('알림 채널에 연결되었습니다')
  }

  function handleSseError(_msg: string) {
    if (options.handleShowMessage) options.handleShowMessage('알림 채널 연결에 문제가 있습니다')
  }

  useNotificationsSSE({ handleReminderEvent, handleTestEvent, handleOpen: handleSseOpen, handleError: handleSseError })

  return {
    notifOpen,
    notifData,
    handleNotificationDialogCloseButtonClick,
  }
}


