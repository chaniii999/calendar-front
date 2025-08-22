const ACCESS_KEY = 'calendar_access_token'
const REFRESH_KEY = 'calendar_refresh_token'

export function saveTokensToStorage(accessToken: string, refreshToken: string) {
  localStorage.setItem(ACCESS_KEY, accessToken)
  localStorage.setItem(REFRESH_KEY, refreshToken)
}

export function readTokensFromStorage(): { accessToken: string | null, refreshToken: string | null } {
  return {
    accessToken: localStorage.getItem(ACCESS_KEY),
    refreshToken: localStorage.getItem(REFRESH_KEY),
  }
}

export function clearTokensFromStorage() {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

function base64UrlDecode(input: string): string {
  const padLen = (4 - (input.length % 4)) % 4
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen)
  if (typeof atob === 'function') {
    return atob(base64)
  }
  // Node 환경 대비 (테스트 등)
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return Buffer.from(base64, 'base64').toString('binary')
}

export function extractUserIdFromAccessToken(token: string | null): string | null {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const json = base64UrlDecode(parts[1])
    const claims = JSON.parse(json) as unknown
    if (typeof claims === 'object' && claims !== null) {
      const candidateSub = (claims as Record<string, unknown>)['sub']
      const candidateUid = (claims as Record<string, unknown>)['uid']
      const candidateUserId = (claims as Record<string, unknown>)['userId']
      if (typeof candidateSub === 'string' && candidateSub.trim().length > 0) return candidateSub
      if (typeof candidateUid === 'string' && candidateUid.trim().length > 0) return candidateUid
      if (typeof candidateUserId === 'string' && candidateUserId.trim().length > 0) return candidateUserId
    }
  } catch (_e) {}
  return null
}

