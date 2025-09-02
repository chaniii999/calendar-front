let accessToken: string | null = null
let refreshToken: string | null = null
import { API_BASE } from './config'
import { clearTokensFromStorage, saveTokensToStorage } from '@lib/auth/session'

export function setTokens(nextAccessToken: string, nextRefreshToken: string) {
  accessToken = nextAccessToken
  refreshToken = nextRefreshToken
  // 메모리에 저장 (localStorage 사용 금지)
  saveTokensToStorage(nextAccessToken, nextRefreshToken)
}

export function getAccessToken(): string | null {
  return accessToken
}

export function getRefreshToken(): string | null {
  return refreshToken
}

export async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> ?? {}),
  }
  
  // 토큰이 없으면 메모리에서 읽어오기
  if (!accessToken) {
    const storedTokens = await import('@lib/auth/session').then(m => m.readTokensFromStorage())
    if (storedTokens.accessToken) {
      accessToken = storedTokens.accessToken
      refreshToken = storedTokens.refreshToken
    }
  }
  
  // 세션 기반 인증을 위해 credentials: 'include' 설정
  const fetchOptions: RequestInit = {
    ...init,
    credentials: 'include', // 세션 쿠키 포함
    headers
  }
  
  // 토큰이 있으면 Authorization 헤더 추가 (하위 호환성)
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }
  
  const resolvedUrl = typeof input === 'string' && input.startsWith('/') ? (API_BASE + input) : input
  const res = await fetch(resolvedUrl, fetchOptions)
  
  // 새로운 토큰이 헤더에 있으면 자동으로 저장
  const newAccessToken = res.headers.get('new-access-token')
  if (newAccessToken) {
    if (import.meta.env.DEV) {
      console.log('토큰이 자동으로 갱신되었습니다.')
    }
    setTokens(newAccessToken, refreshToken || '')
  }
  
  if (res.status === 401 && refreshToken) {
    if (import.meta.env.DEV) {
      console.log('🔄 토큰 만료로 인한 401 에러, 자동 갱신 시도...')
    }
    
    // 수동 갱신 로직 (서버 자동 갱신이 실패한 경우를 대비)
    try {
      const refreshed = await fetch(`${API_BASE}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      })
      
      if (refreshed.ok) {
        const body = await refreshed.json()
        const next = body.data as { accessToken: string, refreshToken: string }
        setTokens(next.accessToken, next.refreshToken)
        
        if (import.meta.env.DEV) {
          console.log('✅ 토큰 갱신 성공, 원래 요청 재시도...')
        }
        
        // 원래 요청 재시도
        const retryUrl = typeof input === 'string' && input.startsWith('/') ? (API_BASE + input) : input
        const retry = await fetch(retryUrl, { 
          ...init, 
          headers: { ...headers, Authorization: `Bearer ${next.accessToken}` } 
        })
        
        if (!retry.ok) {
          if (import.meta.env.DEV) {
            console.error('❌ 재시도 요청 실패:', retry.status)
          }
          throw new Error(`HTTP ${retry.status}`)
        }
        
        return retry.json()
      } else {
        if (import.meta.env.DEV) {
          console.error('❌ 토큰 갱신 실패:', refreshed.status)
        }
        // refresh 실패 시 로그아웃 처리
        clearAuthTokens()
        clearTokensFromStorage()
        window.location.replace('/')
        throw new Error('Unauthorized')
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ 토큰 갱신 중 오류:', error)
      }
      // 갱신 중 오류 발생 시 로그아웃 처리
      clearAuthTokens()
      clearTokensFromStorage()
      window.location.replace('/')
      throw new Error('Unauthorized')
    }
  }
  
  if (res.status === 401) {
    if (import.meta.env.DEV) {
      console.log('❌ 401 에러: 리프레시 토큰이 없어서 로그아웃 처리')
    }
    // refresh 토큰 없고 401이면 즉시 로그아웃 및 로그인화면 이동
    clearAuthTokens()
    clearTokensFromStorage()
    window.location.replace('/')
    throw new Error('Unauthorized')
  }
  
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function clearAuthTokens() {
  accessToken = null
  refreshToken = null
}

