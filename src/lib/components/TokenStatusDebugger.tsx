import React, { useState, useEffect } from 'react'
import { Paper, Typography, Box, Button, Chip, CircularProgress } from '@mui/material'
import { checkCurrentTokenStatus, decodeToken } from '@lib/auth/tokenUtils'
import { getAccessToken, getRefreshToken } from '@lib/api/http'

interface TokenStatusDebuggerProps {
  show?: boolean
}

export const TokenStatusDebugger: React.FC<TokenStatusDebuggerProps> = ({ show = false }) => {
  const [tokenStatus, setTokenStatus] = useState(checkCurrentTokenStatus())
  const [decodedToken, setDecodedToken] = useState<any>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const updateStatus = () => {
    setTokenStatus(checkCurrentTokenStatus())
    const accessToken = getAccessToken()
    if (accessToken) {
      setDecodedToken(decodeToken(accessToken))
    }
  }

  const handleRefreshToken = async () => {
    setIsRefreshing(true)
    try {
      const { API_BASE } = await import('@lib/api/config')
      const refreshToken = getRefreshToken()
      
      if (!refreshToken) {
        if (import.meta.env.DEV) {
          console.error('리프레시 토큰이 없습니다.')
        }
        return
      }

      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })

      if (response.ok) {
        const body = await response.json()
        const next = body.data as { accessToken: string, refreshToken: string }
        
        // 토큰 저장
        const { setTokens } = await import('@lib/api/http')
        const { saveTokensToStorage } = await import('@lib/auth/session')
        setTokens(next.accessToken, next.refreshToken)
        saveTokensToStorage(next.accessToken, next.refreshToken)
        
        if (import.meta.env.DEV) {
          console.log('✅ 토큰 수동 갱신 성공')
        }
        
        // 상태 업데이트
        updateStatus()
      } else {
        if (import.meta.env.DEV) {
          console.error('❌ 토큰 수동 갱신 실패:', response.status)
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ 토큰 수동 갱신 중 오류:', error)
      }
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    updateStatus()
    const interval = setInterval(updateStatus, 5000) // 5초마다 업데이트
    return () => clearInterval(interval)
  }, [])

  if (!show || import.meta.env.PROD) {
    return null
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('ko-KR')
  }

  const getRemainingTimeText = (seconds: number) => {
    if (seconds < 60) return `${seconds}초`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}분 ${seconds % 60}초`
    return `${Math.floor(seconds / 3600)}시간 ${Math.floor((seconds % 3600) / 60)}분`
  }

  return (
    <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
      <Typography variant="h6" sx={{ mb: 2, color: '#666' }}>
        🔍 토큰 상태 디버거 (개발 모드)
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
        <Chip 
          label={tokenStatus.hasToken ? '토큰 있음' : '토큰 없음'} 
          color={tokenStatus.hasToken ? 'success' : 'error'} 
          size="small" 
        />
        <Chip 
          label={tokenStatus.isExpired ? '만료됨' : '유효함'} 
          color={tokenStatus.isExpired ? 'error' : 'success'} 
          size="small" 
        />
        <Chip 
          label={tokenStatus.isExpiringSoon ? '곧 만료' : '안전'} 
          color={tokenStatus.isExpiringSoon ? 'warning' : 'success'} 
          size="small" 
        />
      </Box>

      {tokenStatus.hasToken && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>남은 시간:</strong> {getRemainingTimeText(tokenStatus.remainingTime)}
          </Typography>
          {tokenStatus.expirationTime && (
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>만료 시간:</strong> {tokenStatus.expirationTime.toLocaleString('ko-KR')}
            </Typography>
          )}
        </Box>
      )}

      {decodedToken && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            <strong>토큰 페이로드:</strong>
          </Typography>
          <Paper sx={{ p: 1, backgroundColor: '#fff', fontSize: '0.75rem' }}>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
              {JSON.stringify(decodedToken, null, 2)}
            </pre>
          </Paper>
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button 
          variant="outlined" 
          size="small" 
          onClick={updateStatus}
        >
          상태 새로고침
        </Button>
        
        <Button 
          variant="outlined" 
          size="small" 
          onClick={() => {
            const accessToken = getAccessToken()
            const refreshToken = getRefreshToken()
            if (import.meta.env.DEV) {
              console.log('현재 토큰:', { accessToken, refreshToken })
            }
          }}
        >
          콘솔에 출력
        </Button>

        <Button 
          variant="contained" 
          color="primary"
          size="small" 
          onClick={handleRefreshToken}
          disabled={isRefreshing || !tokenStatus.hasToken}
          startIcon={isRefreshing ? <CircularProgress size={16} /> : null}
        >
          {isRefreshing ? '갱신 중...' : '토큰 바로 갱신'}
        </Button>
      </Box>
    </Paper>
  )
}
