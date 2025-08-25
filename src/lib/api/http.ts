let accessToken: string | null = null
let refreshToken: string | null = null
import { API_BASE } from './config'
import { clearTokensFromStorage } from '@lib/auth/session'

export function setTokens(nextAccessToken: string, nextRefreshToken: string) {
  accessToken = nextAccessToken
  refreshToken = nextRefreshToken
}

export async function http<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> ?? {}),
  }
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`
  const resolvedUrl = typeof input === 'string' && input.startsWith('/') ? (API_BASE + input) : input
  const res = await fetch(resolvedUrl, { ...init, headers })
  if (res.status === 401 && refreshToken) {
    const refreshed = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (refreshed.ok) {
      const body = await refreshed.json()
      const next = body.data as { accessToken: string, refreshToken: string }
      setTokens(next.accessToken, next.refreshToken)
      const retryUrl = typeof input === 'string' && input.startsWith('/') ? (API_BASE + input) : input
      const retry = await fetch(retryUrl, { ...init, headers: { ...headers, Authorization: `Bearer ${next.accessToken}` } })
      if (!retry.ok) throw new Error(`HTTP ${retry.status}`)
      return retry.json()
    }
    // refresh 실패 시 즉시 로그아웃 및 로그인화면 이동
    clearAuthTokens()
    clearTokensFromStorage()
    window.location.replace('/')
    throw new Error('Unauthorized')
  }
  if (res.status === 401) {
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

