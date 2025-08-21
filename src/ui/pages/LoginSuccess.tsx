import React, { useEffect } from 'react'
import { setTokens } from '../../lib/api/http'
import { saveTokensToStorage } from '../../lib/auth/session'
import { Box, CircularProgress, Typography } from '@mui/material'

export default function LoginSuccess() {
  useEffect(() => {
    function readParam(params: URLSearchParams, keys: string[]): string | null {
      for (const key of keys) {
        const v = params.get(key)
        if (v) return v
      }
      return null
    }

    const search = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '')
    const accessToken = readParam(search, ['accessToken', 'access_token']) || readParam(hash, ['accessToken', 'access_token'])
    const refreshToken = readParam(search, ['refreshToken', 'refresh_token']) || readParam(hash, ['refreshToken', 'refresh_token'])

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

