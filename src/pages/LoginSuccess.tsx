import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { setTokens } from '@lib/api/http'
import { saveTokensToStorage } from '@lib/auth/session'
import { Box, CircularProgress, Typography } from '@mui/material'

export default function LoginSuccess() {
  const navigate = useNavigate()
  useEffect(() => {
    function readParam(params: URLSearchParams, keys: string[]): string | null {
      for (const key of keys) {
        const v = params.get(key)
        if (v) return v
      }
      return null
    }

    if (import.meta.env.DEV) {
      console.log('🔐 OAuth2 로그인 성공 페이지 로드:', {
        url: window.location.href,
        search: window.location.search,
        hash: window.location.hash,
      })
    }

    const search = new URLSearchParams(window.location.search)
    const hash = new URLSearchParams(window.location.hash.startsWith('#') ? window.location.hash.slice(1) : '')
    const accessToken = readParam(search, ['accessToken', 'access_token']) || readParam(hash, ['accessToken', 'access_token'])
    const refreshToken = readParam(search, ['refreshToken', 'refresh_token']) || readParam(hash, ['refreshToken', 'refresh_token'])

    if (import.meta.env.DEV) {
      console.log('🔐 토큰 확인:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        accessTokenLength: accessToken?.length,
        refreshTokenLength: refreshToken?.length,
      })
    }

    if (accessToken && refreshToken) {
      if (import.meta.env.DEV) {
        console.log('✅ 토큰 저장 및 리다이렉트 시작')
      }
      setTokens(accessToken, refreshToken)
      saveTokensToStorage(accessToken, refreshToken)
      navigate('/calendar', { replace: true })
    } else {
      if (import.meta.env.DEV) {
        console.error('❌ 토큰이 없습니다. 로그인 실패')
      }
    }
  }, [])
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
      <CircularProgress size={20} />
      <Typography variant="body2" color="text.secondary">로그인 처리 중...</Typography>
    </Box>
  )
}


