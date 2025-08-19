import React, { useEffect } from 'react'
import { setTokens } from '../../lib/api/http'
import { saveTokensToStorage } from '../../lib/auth/session'
import { Box, CircularProgress, Typography } from '@mui/material'

export default function LoginSuccess() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const accessToken = params.get('accessToken')
    const refreshToken = params.get('refreshToken')
    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken)
      saveTokensToStorage(accessToken, refreshToken)
      window.location.replace('/calendar')
    }
  }, [])
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <CircularProgress size={20} />
      <Typography variant="body2" color="text.secondary">로그인 처리 중...</Typography>
    </Box>
  )
}

