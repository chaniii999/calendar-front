import { useEffect, useCallback, useRef } from 'react'
import { setTokens, getAccessToken, getRefreshToken } from '@lib/api/http'
import { readTokensFromStorage, clearTokensFromStorage } from './session'
import { checkCurrentTokenStatus, isTokenExpiringSoon } from './tokenUtils'

interface UseAutoTokenRefreshOptions {
  onTokenRefresh?: (newToken: string) => void
  onTokenExpired?: () => void
  checkInterval?: number // 토큰 상태 확인 간격 (밀리초)
  expirationThreshold?: number // 만료 예정 임계값 (분)
}

export const useAutoTokenRefresh = (options: UseAutoTokenRefreshOptions = {}) => {
  const {
    onTokenRefresh,
    onTokenExpired,
    checkInterval = 60000, // 1분마다 확인
    expirationThreshold = 5, // 5분 전에 만료 예정
  } = options

  // 갱신 시도 횟수를 제한하기 위한 ref
  const refreshAttempts = useRef<Map<string, number>>(new Map())
  const lastRefreshTime = useRef<number>(0)

  // 토큰 상태 확인 및 초기화
  const checkAndInitializeTokens = useCallback(async () => {
    const storedTokens = readTokensFromStorage()
    
    if (storedTokens.accessToken && storedTokens.refreshToken) {
      // 메모리에 토큰이 없으면 로드
      if (!getAccessToken()) {
        setTokens(storedTokens.accessToken, storedTokens.refreshToken)
      }
      
      // 토큰 상태 확인
      const status = checkCurrentTokenStatus()
      
      if (import.meta.env.DEV) {
        console.log('🔍 토큰 상태 확인:', {
          hasToken: status.hasToken,
          isExpired: status.isExpired,
          isExpiringSoon: status.isExpiringSoon,
          remainingTime: Math.floor(status.remainingTime / 60) + '분',
        })
      }
      
      if (status.isExpired) {
        if (import.meta.env.DEV) {
          console.log('토큰이 만료되었습니다.')
        }
        clearTokensFromStorage()
        onTokenExpired?.()
        return false
      }
      
      if (status.isExpiringSoon) {
        const now = Date.now()
        const tokenKey = storedTokens.accessToken.substring(0, 20) // 토큰의 일부를 키로 사용
        
        // 마지막 갱신 시도로부터 30초가 지나지 않았으면 스킵
        if (now - lastRefreshTime.current < 30000) {
          if (import.meta.env.DEV) {
            console.log('⏰ 마지막 갱신 시도로부터 30초가 지나지 않아 스킵')
          }
          return true
        }
        
        // 같은 토큰에 대해 3번 이상 갱신 시도했으면 스킵
        const attempts = refreshAttempts.current.get(tokenKey) || 0
        if (attempts >= 3) {
          if (import.meta.env.DEV) {
            console.log('⚠️ 같은 토큰에 대해 3번 이상 갱신 시도했으므로 스킵')
          }
          return true
        }
        
        if (import.meta.env.DEV) {
          console.log('🔄 토큰이 곧 만료될 예정입니다. 자동 갱신 시도... (시도 횟수:', attempts + 1, ')')
        }
        
        // 갱신 시도 횟수 증가
        refreshAttempts.current.set(tokenKey, attempts + 1)
        lastRefreshTime.current = now
        
        // 토큰이 곧 만료될 예정이면 자동으로 갱신 시도
        const refreshResult = await refreshTokenManually()
        if (refreshResult) {
          if (import.meta.env.DEV) {
            console.log('✅ 토큰 자동 갱신 성공')
          }
          // 성공하면 시도 횟수 초기화
          refreshAttempts.current.delete(tokenKey)
        } else {
          if (import.meta.env.DEV) {
            console.log('❌ 토큰 자동 갱신 실패')
          }
        }
      }
      
      return true
    }
    
    return false
  }, [onTokenExpired, expirationThreshold])

  // 주기적으로 토큰 상태 확인
  useEffect(() => {
    // 초기 확인
    checkAndInitializeTokens().catch(error => {
      if (import.meta.env.DEV) {
        console.error('토큰 상태 확인 중 오류:', error)
      }
    })
    
    // 주기적 확인
    const interval = setInterval(() => {
      checkAndInitializeTokens().catch(error => {
        if (import.meta.env.DEV) {
          console.error('토큰 상태 확인 중 오류:', error)
        }
      })
    }, checkInterval)
    
    return () => {
      clearInterval(interval)
    }
  }, [checkAndInitializeTokens, checkInterval])

  // 토큰 갱신 성공 시 콜백 호출을 위한 이벤트 리스너
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'calendar_access_token' && event.newValue) {
        if (import.meta.env.DEV) {
          console.log('토큰이 자동으로 갱신되었습니다.')
        }
        onTokenRefresh?.(event.newValue)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [onTokenRefresh])

  // 현재 토큰 상태 반환
  const getTokenStatus = useCallback(() => {
    return checkCurrentTokenStatus()
  }, [])

  // 수동으로 토큰 갱신 시도
  const refreshTokenManually = useCallback(async () => {
    const currentRefreshToken = getRefreshToken()
    if (!currentRefreshToken) {
      if (import.meta.env.DEV) {
        console.error('리프레시 토큰이 없습니다.')
      }
      return false
    }

    try {
      const { API_BASE } = await import('@lib/api/config')
      const response = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      })

      if (response.ok) {
        const body = await response.json()
        const next = body.data as { accessToken: string, refreshToken: string }
        setTokens(next.accessToken, next.refreshToken)
        onTokenRefresh?.(next.accessToken)
        return true
      } else {
        if (import.meta.env.DEV) {
          console.error('토큰 갱신 실패:', response.status)
        }
        clearTokensFromStorage()
        onTokenExpired?.()
        return false
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('토큰 갱신 중 오류 발생:', error)
      }
      return false
    }
  }, [onTokenRefresh, onTokenExpired])

  return {
    getTokenStatus,
    refreshTokenManually,
    checkAndInitializeTokens,
  }
}
