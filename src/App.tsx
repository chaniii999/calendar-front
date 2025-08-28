import React, { useEffect, useMemo, useState } from 'react'
import { AppBar, Avatar, Box, Button, Container, Divider, Paper, Tab, Tabs, Toolbar, Typography } from '@mui/material'
import { BrowserRouter, Route, Routes, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { CalendarPage } from '@pages/CalendarPage'
import LoginSuccess from '@pages/LoginSuccess'
import { readTokensFromStorage, clearTokensFromStorage, saveTokensToStorage } from '@lib/auth/session'
import { setTokens, clearAuthTokens } from '@lib/api/http'
import { API_BASE, OAUTH2_LOGIN_URL } from '@lib/api/config'
import { useAutoTokenRefresh } from '@lib/auth/useAutoTokenRefresh'

function NavTabs() {
  const navigate = useNavigate()
  const location = useLocation()
  const [tab, setTab] = useState(0)
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported'>('unsupported')

  function handleTabsChange(_e: unknown, newValue: number) {
    setTab(newValue)
    navigate('/calendar')
  }

  // 알림 상단 버튼/테스트 로직 제거됨

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
    if (import.meta.env.DEV) {
      console.log('🔐 OAuth2 로그인 시작:', OAUTH2_LOGIN_URL)
    }
    window.location.href = OAUTH2_LOGIN_URL
  }
  const handleLogoutButtonClick = () => {
    clearAuthTokens()
    clearTokensFromStorage()
    // 환경별 로그아웃 리다이렉트
    const logoutUrl = import.meta.env.DEV ? 'http://localhost:5173/' : 'https://everyplan.site/'
    window.location.replace(logoutUrl)
  }
  const shouldShowButtons = false

  return (
    <>
      <Paper elevation={0} sx={{ position: 'sticky', top: 0, zIndex: 1100 }}>
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar sx={{ gap: 2 }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}>C</Avatar>
            {false && <></>}
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

  // 토큰 자동 갱신 Hook 사용
  const { getTokenStatus } = useAutoTokenRefresh({
    onTokenRefresh: (newToken) => {
      if (import.meta.env.DEV) {
        console.log('토큰이 자동으로 갱신되었습니다:', newToken.substring(0, 20) + '...')
      }
    },
    onTokenExpired: () => {
      if (import.meta.env.DEV) {
        console.log('토큰이 만료되어 로그아웃됩니다.')
      }
      clearAuthTokens()
      clearTokensFromStorage()
      setIsAuthed(false)
      window.location.replace('/')
    },
    checkInterval: 10000, // 10초마다 확인 (더 자주 확인)
    expirationThreshold: 2, // 2분 전에 만료 예정 (더 일찍 갱신)
  })

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
    if (import.meta.env.DEV) {
      console.log('🔐 OAuth2 로그인 시작:', OAUTH2_LOGIN_URL)
    }
    window.location.href = OAUTH2_LOGIN_URL
  }
  return (
    <Paper sx={{ p: 4, textAlign: 'center' }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>로그인이 필요합니다</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Google 계정으로 로그인하세요.</Typography>
      <Button onClick={handleLoginButtonClick}>Google Login</Button>
    </Paper>
  )
}


