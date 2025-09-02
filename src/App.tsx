import React, { useEffect, useMemo, useState } from 'react'
import { AppBar, Avatar, Box, Button, Container, Divider, Paper, Tab, Tabs, Toolbar, Typography } from '@mui/material'
import { BrowserRouter, Route, Routes, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { CalendarPage } from '@pages/CalendarPage'
import LoginSuccess from '@pages/LoginSuccess'
import { readTokensFromStorage, clearTokensFromStorage, saveTokensToStorage } from '@lib/auth/session'
import { setTokens, clearAuthTokens } from '@lib/api/http'
import { API_BASE, OAUTH2_LOGIN_URL } from '@lib/api/config'
import { useAutoTokenRefresh } from '@lib/auth/useAutoTokenRefresh'

interface NavTabsProps {
  isAuthed: boolean
  onLogout: () => void
}

function NavTabs({ isAuthed, onLogout }: NavTabsProps) {
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

  const handleLoginButtonClick = () => {
    if (import.meta.env.DEV) {
      console.log('🔐 OAuth2 로그인 시작:', OAUTH2_LOGIN_URL)
    }
    window.location.href = OAUTH2_LOGIN_URL
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
               <Button onClick={onLogout} color="inherit" variant="outlined">Logout</Button>
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
      handleLogout() // 통합된 로그아웃 함수 사용
    },
    checkInterval: 10000, // 10초마다 확인 (더 자주 확인)
    expirationThreshold: 2, // 2분 전에 만료 예정 (더 일찍 갱신)
  })

  // 로그아웃 핸들러 함수
  async function handleLogout() {
    if (import.meta.env.DEV) {
      console.log('🔐 로그아웃 처리 시작')
    }
    
    try {
      // 1. 백엔드 세션 무효화 및 쿠키 삭제
      if (import.meta.env.DEV) {
        console.log('🌐 백엔드 로그아웃 API 호출...')
      }
      
      await fetch(`${API_BASE}/api/notifications/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      if (import.meta.env.DEV) {
        console.log('✅ 백엔드 로그아웃 완료')
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ 백엔드 로그아웃 실패:', error)
        console.log('🔄 프론트엔드만 로그아웃 처리 계속...')
      }
    }
    
    // 2. 프론트엔드 토큰 및 인증 상태 정리
    clearAuthTokens()
    clearTokensFromStorage()
    setIsAuthed(false)
    setIsAuthChecking(false)
    
    if (import.meta.env.DEV) {
      console.log('✅ 프론트엔드 로그아웃 완료, 로그인 페이지로 이동')
    }
    
    // 3. 로그인 페이지로 리다이렉트
    window.location.replace('/')
  }

  async function handleAppInitValidateAuth() {
    // 현재 경로가 로그인 성공 페이지인지 확인
    const isLoginSuccessPage = window.location.pathname === '/login/success'
    
    if (import.meta.env.DEV) {
      console.log('🔍 앱 초기화 - 현재 경로:', window.location.pathname)
      console.log('🔍 로그인 성공 페이지 여부:', isLoginSuccessPage)
    }
    
    // 로그인 성공 페이지에서는 인증 체크를 건너뛰고 LoginSuccess 컴포넌트가 처리하도록 함
    if (isLoginSuccessPage) {
      if (import.meta.env.DEV) {
        console.log('⏭️ 로그인 성공 페이지에서 인증 체크 건너뛰기')
      }
      setIsAuthChecking(false)
      return
    }
    
    // 1. 먼저 메모리에서 토큰 확인 (하위 호환성)
    const storedTokens = readTokensFromStorage()
    
    if (storedTokens.accessToken && storedTokens.refreshToken) {
      if (import.meta.env.DEV) {
        console.log('✅ 저장된 토큰 발견, 기존 방식으로 인증')
      }
      
      setTokens(storedTokens.accessToken, storedTokens.refreshToken)
      setIsAuthed(true)
      setIsAuthChecking(false)
      return
    }

    // 2. 세션에서 토큰 조회 시도 (새로운 방식)
    try {
      if (import.meta.env.DEV) {
        console.log('🔄 세션에서 토큰 조회 시도...')
      }
      
      const { getTokensFromSession } = await import('@lib/auth/session')
      const tokens = await getTokensFromSession()
      
      if (tokens.accessToken && tokens.refreshToken) {
        if (import.meta.env.DEV) {
          console.log('✅ 세션에서 토큰 조회 성공')
        }
        
        setTokens(tokens.accessToken, tokens.refreshToken)
        setIsAuthed(true)
        setIsAuthChecking(false)
        return
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.log('세션에서 토큰 조회 실패:', error)
      }
    }

    // 3. 모든 인증 방식 실패 시 로그아웃 상태
    if (import.meta.env.DEV) {
      console.log('❌ 모든 인증 방식 실패, 로그아웃 상태로 설정')
    }
    
    clearAuthTokens()
    clearTokensFromStorage()
    setIsAuthed(false)
    setIsAuthChecking(false)
  }

  useEffect(() => {
    handleAppInitValidateAuth()
    
    // LoginSuccess에서 전송하는 인증 상태 변경 이벤트 리스너
    const handleAuthStateChanged = (event: CustomEvent) => {
      if (import.meta.env.DEV) {
        console.log('🔔 인증 상태 변경 이벤트 수신:', event.detail)
      }
      
      const { isAuthed: newAuthState, tokens } = event.detail
      
      if (newAuthState && tokens) {
        // 토큰 설정 및 인증 상태 업데이트
        setTokens(tokens.accessToken, tokens.refreshToken)
        setIsAuthed(true)
        setIsAuthChecking(false)
        
        if (import.meta.env.DEV) {
          console.log('✅ 인증 상태 업데이트 완료')
        }
      }
    }
    
    // 이벤트 리스너 등록
    window.addEventListener('authStateChanged', handleAuthStateChanged as EventListener)
    
    // 클린업 함수
    return () => {
      window.removeEventListener('authStateChanged', handleAuthStateChanged as EventListener)
    }
  }, [])

  return (
    <BrowserRouter>
      {isAuthed && <NavTabs isAuthed={isAuthed} onLogout={handleLogout} />}
      <Container sx={{ py: 3 }}>
        <Routes>
          <Route path="/" element={<Navigate to="/calendar" replace />} />
          <Route path="/calendar" element={isAuthed ? <CalendarPage /> : <LoginGate />} />
          <Route path="/login/success" element={<LoginSuccess />} />
        </Routes>
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


