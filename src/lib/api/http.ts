let accessToken: string | null = null
let refreshToken: string | null = null

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
  const res = await fetch(input, { ...init, headers })
  if (res.status === 401 && refreshToken) {
    const refreshed = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (refreshed.ok) {
      const body = await refreshed.json()
      const next = body.data as { accessToken: string, refreshToken: string }
      setTokens(next.accessToken, next.refreshToken)
      const retry = await fetch(input, { ...init, headers: { ...headers, Authorization: `Bearer ${next.accessToken}` } })
      if (!retry.ok) throw new Error(`HTTP ${retry.status}`)
      return retry.json()
    }
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export function clearAuthTokens() {
  accessToken = null
  refreshToken = null
}

