import { useEffect } from 'react'
import { http, setTokens, getAccessToken, getRefreshToken } from '@lib/api/http'
import { readTokensFromStorage, saveTokensToStorage } from './session'

interface TokenRefreshOptions {
  onTokenRefresh?: (newToken: string) => void
  onTokenExpired?: () => void
}

export const useTokenRefresh = (options: TokenRefreshOptions = {}) => {
  const { onTokenRefresh, onTokenExpired } = options

  useEffect(() => {
    // 초기 토큰 로드
    const initializeTokens = () => {
      const storedTokens = readTokensFromStorage()
      if (storedTokens.accessToken && storedTokens.refreshToken) {
        setTokens(storedTokens.accessToken, storedTokens.refreshToken)
      }
    }

    // HTTP 응답 처리 함수
    const handleResponse = async (response: Response): Promise<Response> => {
      // 새로운 토큰이 헤더에 있으면 자동으로 저장
      const newAccessToken = response.headers.get('new-access-token')
      if (newAccessToken) {
        console.log('토큰이 자동으로 갱신되었습니다.')
        const currentRefreshToken = getRefreshToken()
        if (currentRefreshToken) {
          setTokens(newAccessToken, currentRefreshToken)
          onTokenRefresh?.(newAccessToken)
        }
      }
      return response
    }

    // HTTP 요청 처리 함수
    const handleRequest = async (input: RequestInfo, init?: RequestInit): Promise<Response> => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(init?.headers as Record<string, string> ?? {}),
      }

      // 토큰이 없으면 로컬 스토리지에서 읽어오기
      let currentAccessToken = getAccessToken()
      if (!currentAccessToken) {
        const storedTokens = readTokensFromStorage()
        if (storedTokens.accessToken) {
          currentAccessToken = storedTokens.accessToken
          setTokens(storedTokens.accessToken, storedTokens.refreshToken || '')
        }
      }

      if (currentAccessToken) {
        headers['Authorization'] = `Bearer ${currentAccessToken}`
      }

      const resolvedUrl = typeof input === 'string' && input.startsWith('/') 
        ? (await import('@lib/api/config')).API_BASE + input 
        : input

      const response = await fetch(resolvedUrl, { ...init, headers })
      
      // 새로운 토큰 처리
      const newAccessToken = response.headers.get('new-access-token')
      if (newAccessToken) {
        console.log('토큰이 자동으로 갱신되었습니다.')
        const currentRefreshToken = getRefreshToken()
        if (currentRefreshToken) {
          setTokens(newAccessToken, currentRefreshToken)
          onTokenRefresh?.(newAccessToken)
        }
      }

      // 401 에러 처리 (서버 자동 갱신이 실패한 경우)
      if (response.status === 401) {
        const currentRefreshToken = getRefreshToken()
        if (currentRefreshToken) {
          try {
            const refreshResponse = await fetch(`${(await import('@lib/api/config')).API_BASE}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken: currentRefreshToken }),
            })

            if (refreshResponse.ok) {
              const body = await refreshResponse.json()
              const next = body.data as { accessToken: string, refreshToken: string }
              setTokens(next.accessToken, next.refreshToken)
              onTokenRefresh?.(next.accessToken)

              // 원래 요청 재시도
              const retryResponse = await fetch(resolvedUrl, {
                ...init,
                headers: { ...headers, Authorization: `Bearer ${next.accessToken}` }
              })
              return retryResponse
            }
          } catch (error) {
            console.error('토큰 갱신 실패:', error)
          }
        }

        // 갱신 실패 시 콜백 호출
        onTokenExpired?.()
        throw new Error('Unauthorized')
      }

      return response
    }

    // 초기화
    initializeTokens()

    // http 함수 오버라이드 (실제로는 http 함수를 직접 수정하는 것이 더 효율적)
    // 여기서는 예시로 보여주기 위한 구조입니다.

    return () => {
      // 클린업 함수
    }
  }, [onTokenRefresh, onTokenExpired])

  return {
    getAccessToken,
    getRefreshToken,
    setTokens,
  }
}
