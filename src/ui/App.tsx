import React, { useEffect, useMemo, useState } from 'react'
import { AppBar, Avatar, Box, Button, Container, Divider, Paper, Tab, Tabs, Toolbar, Typography } from '@mui/material'
import { BrowserRouter, Route, Routes, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { CalendarPage } from './pages/CalendarPage'
import LoginSuccess from './pages/LoginSuccess'
import { readTokensFromStorage, clearTokensFromStorage, saveTokensToStorage } from '../lib/auth/session'
import { setTokens, clearAuthTokens } from '../lib/api/http'

function NavTabs() {
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(0)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')

  function handleTabsChange(_e: unknown, newValue: number) {
    setTab(newValue)
    navigate('/calendar')
  }

  function handleAllowNotificationsButtonClick() {
    if (!('Notification' in window)) return
    ;(async () => {
      try {
        // 현재 상태에 따라 안내
        if (Notification.permission === 'granted') {
          try { alert('알림이 이미 허용되어 있습니다.') } catch (_e) {}
          setNotificationPermission('granted')
          return
        }
        if (Notification.permission === 'denied') {
          try { alert('브라우저 사이트 권한에서 알림을 직접 허용해 주세요.') } catch (_e) {}
          setNotificationPermission('denied')
          return
        }
        const perm = await Notification.requestPermission()
        setNotificationPermission(perm)
        if (perm === 'granted') {
          try { new Notification('알림이 허용되었습니다', { body: '테스트 알림입니다.' }) } catch (_e) {}
        } else if (perm === 'denied') {
          try { alert('알림이 차단되었습니다. 브라우저 설정에서 허용해 주세요.') } catch (_e) {}
        }
      } catch (_e) {}
    })()
  }

  async function handlePushTestButtonClick() {
    try {
      const tokens = readTokensFromStorage()
      await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(tokens.accessToken ? { Authorization: `Bearer ${tokens.accessToken}` } : {}),
        },
        body: JSON.stringify({ message: 'ping' }),
      })
      try { alert('테스트 이벤트를 전송했습니다. 알림 채널이 연결되어 있어야 수신됩니다.') } catch (_e) {}
    } catch (_e) {}
  }

  function handleMockPushButtonClick() {
    const title = '모의 알림'
    const body = '프론트에서 발생한 테스트 알림입니다.'
    if (!('Notification' in window)) {
      try { alert(body) } catch (_e) {}
      return
    }
    if (Notification.permission === 'granted') {
      try { new Notification(title, { body }) } catch (_e) {}
      try { alert('네이티브 알림을 확인해 주세요.') } catch (__e) {}
      return
    }
    ;(async () => {
      try {
        const perm = await Notification.requestPermission()
        if (perm === 'granted') {
          try { new Notification(title, { body }) } catch (_e) {}
        } else {
          try { alert(body) } catch (_e) {}
        }
      } catch (_e) {
        try { alert(body) } catch (__e) {}
      }
    })()
  }

  useEffect(() => {
    // 캘린더만 사용
    setTab(0)
  }, [location.pathname])

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission)
      // 권한 변경 감지 (지원 브라우저 한정)
      try {
        const anyNav = navigator as unknown as { permissions?: { query: (opts: any) => Promise<any> } }
        anyNav.permissions?.query({ name: 'notifications' as any })
          .then((status: any) => {
            try { status.onchange = () => setNotificationPermission(Notification.permission) } catch (_e) {}
          })
          .catch(() => {})
      } catch (_e) {}
    } else {
      setNotificationPermission('unsupported')
    }
  }, [])

  const tokens = readTokensFromStorage()
  const isAuthed = Boolean(tokens.accessToken && tokens.refreshToken)
  const handleLoginButtonClick = () => {
    window.location.href = '/api/auth/login/google'
  }
  const handleLogoutButtonClick = () => {
    clearAuthTokens()
    clearTokensFromStorage()
    window.location.replace('/')
  }
  const shouldShowButtons = isAuthed && notificationPermission !== 'unsupported'

  return (
    <>
      <Paper elevation={0} sx={{ position: 'sticky', top: 0, zIndex: 1100 }}>
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar sx={{ gap: 2 }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}>C</Avatar>
            {shouldShowButtons && (
              <>
                <Button onClick={handleAllowNotificationsButtonClick} size="small" variant="outlined">알림 허용</Button>
                <Button onClick={handlePushTestButtonClick} size="small" variant="outlined">테스트</Button>
                <Button onClick={handleMockPushButtonClick} size="small" variant="outlined">모의 알림</Button>
              </>
            )}
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>애브리플랜</Typography>
            <Tabs value={tab} onChange={handleTabsChange} textColor="inherit" indicatorColor="secondary">
              <Tab label="Calendar" />
            </Tabs>
            {isAuthed ? (
              <Button onClick={handleLogoutButtonClick} color="inherit" variant="outlined">Logout</Button>
            ) : (
              <Button onClick={handleLoginButtonClick}>Google Login</Button>
            )}
          </Toolbar>
        </AppBar>
        <Divider />
      </Paper>
    </>
  )
}

export default function App() {
  const [isAuthChecking, setIsAuthChecking] = useState(true)
  const [isAuthed, setIsAuthed] = useState(false)

  function handleAppInitValidateAuth() {
    const tokens = readTokensFromStorage()
    if (!(tokens.accessToken && tokens.refreshToken)) {
      clearAuthTokens()
      setIsAuthed(false)
      setIsAuthChecking(false)
      return
    }

    function isLikelyJwt(token: string | null): boolean {
      if (!token) return false
      // header.payload.signature 형태(점 2개)이며 이메일 같은 '@' 포함 안 됨
      return token.split('.').length === 3 && token.indexOf('@') === -1
    }

    // 저장된 토큰이 JWT 형태가 아니면 안전하게 초기화
    if (!isLikelyJwt(tokens.accessToken) || !isLikelyJwt(tokens.refreshToken)) {
      clearAuthTokens()
      clearTokensFromStorage()
      setIsAuthed(false)
      setIsAuthChecking(false)
      return
    }

    setTokens(tokens.accessToken, tokens.refreshToken)
    setIsAuthed(true)
    setIsAuthChecking(false)
  }

  useEffect(handleAppInitValidateAuth, [])

  return (
    <BrowserRouter>
      {isAuthed && <NavTabs />}
      <Container sx={{ py: 3 }}>
        {isAuthChecking ? (
          <Routes>
            <Route path="/login/success" element={<LoginSuccess />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/calendar" replace />} />
            <Route path="/calendar" element={isAuthed ? <CalendarPage /> : <LoginGate />} />
            <Route path="/login/success" element={<LoginSuccess />} />
          </Routes>
        )}
      </Container>
    </BrowserRouter>
  )
}

function LoginGate() {
  const handleLoginButtonClick = () => {
    window.location.href = '/api/auth/login/google'
  }
  return (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>로그인이 필요합니다</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Google 계정으로 로그인하세요.</Typography>
      <Button onClick={handleLoginButtonClick}>Google Login</Button>
    </Paper>
  )
}


