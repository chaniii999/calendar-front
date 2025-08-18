import React, { useEffect, useMemo, useState } from 'react'
import { AppBar, Avatar, Box, Button, Container, Divider, Paper, Tab, Tabs, Toolbar, Typography } from '@mui/material'
import { BrowserRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { TodoPage } from './pages/TodoPage'
import { CalendarPage } from './pages/CalendarPage'
import LoginSuccess from './pages/LoginSuccess'
import { readTokensFromStorage, clearTokensFromStorage, saveTokensToStorage } from '../lib/auth/session'
import { setTokens, clearAuthTokens } from '../lib/api/http'

function NavTabs() {
  const navigate = useNavigate()
  const [tab, setTab] = useState(0)
  const handleTabChange = (_e: unknown, newValue: number) => {
    setTab(newValue)
    navigate(newValue === 0 ? '/' : '/calendar')
  }
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
  return (
    <>
      <Paper elevation={0} sx={{ position: 'sticky', top: 0, zIndex: 1100 }}>
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar sx={{ gap: 2 }}>
            <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main' }}>C</Avatar>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>Calendar / ToDo</Typography>
            <Tabs value={tab} onChange={handleTabChange} textColor="inherit" indicatorColor="secondary">
              <Tab label="ToDo" />
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

    setTokens(tokens.accessToken, tokens.refreshToken)

    ;(async () => {
      try {
        const res = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        })
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const body = await res.json() as { ok: boolean, data: { accessToken: string, refreshToken: string } }
        const next = body.data
        setTokens(next.accessToken, next.refreshToken)
        saveTokensToStorage(next.accessToken, next.refreshToken)
        setIsAuthed(true)
      } catch (_e) {
        clearAuthTokens()
        clearTokensFromStorage()
        setIsAuthed(false)
      } finally {
        setIsAuthChecking(false)
      }
    })()
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
            <Route path="/" element={isAuthed ? <TodoPage /> : <LoginGate />} />
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


