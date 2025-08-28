import { readTokensFromStorage } from './session'

interface TokenPayload {
  exp?: number
  iat?: number
  sub?: string
  email?: string
  [key: string]: unknown
}

/**
 * JWT 토큰을 디코딩하여 페이로드를 반환합니다.
 */
export function decodeToken(token: string): TokenPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    
    const payload = parts[1]
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decoded) as TokenPayload
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('토큰 디코딩 실패:', error)
    }
    return null
  }
}

/**
 * 토큰이 만료되었는지 확인합니다.
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token)
  if (!payload || !payload.exp) {
    return true
  }
  
  const currentTime = Math.floor(Date.now() / 1000)
  return payload.exp < currentTime
}

/**
 * 토큰이 곧 만료될 예정인지 확인합니다 (기본값: 5분).
 */
export function isTokenExpiringSoon(token: string, thresholdMinutes: number = 5): boolean {
  const payload = decodeToken(token)
  if (!payload || !payload.exp) {
    return true
  }
  
  const currentTime = Math.floor(Date.now() / 1000)
  const thresholdSeconds = thresholdMinutes * 60
  return payload.exp - currentTime < thresholdSeconds
}

/**
 * 토큰의 만료 시간을 반환합니다.
 */
export function getTokenExpirationTime(token: string): Date | null {
  const payload = decodeToken(token)
  if (!payload || !payload.exp) {
    return null
  }
  
  return new Date(payload.exp * 1000)
}

/**
 * 토큰의 남은 유효 시간을 초 단위로 반환합니다.
 */
export function getTokenRemainingTime(token: string): number {
  const payload = decodeToken(token)
  if (!payload || !payload.exp) {
    return 0
  }
  
  const currentTime = Math.floor(Date.now() / 1000)
  return Math.max(0, payload.exp - currentTime)
}

/**
 * 현재 저장된 액세스 토큰의 상태를 확인합니다.
 */
export function checkCurrentTokenStatus(): {
  hasToken: boolean
  isExpired: boolean
  isExpiringSoon: boolean
  remainingTime: number
  expirationTime: Date | null
} {
  const { accessToken } = readTokensFromStorage()
  
  if (!accessToken) {
    return {
      hasToken: false,
      isExpired: true,
      isExpiringSoon: true,
      remainingTime: 0,
      expirationTime: null,
    }
  }
  
  const isExpired = isTokenExpired(accessToken)
  const isExpiringSoon = isTokenExpiringSoon(accessToken)
  const remainingTime = getTokenRemainingTime(accessToken)
  const expirationTime = getTokenExpirationTime(accessToken)
  
  return {
    hasToken: true,
    isExpired,
    isExpiringSoon,
    remainingTime,
    expirationTime,
  }
}

/**
 * 토큰에서 사용자 정보를 추출합니다.
 */
export function extractUserInfoFromToken(token: string): {
  userId?: string
  email?: string
  [key: string]: unknown
} | null {
  const payload = decodeToken(token)
  if (!payload) {
    return null
  }
  
  return {
    userId: payload.sub || payload.userId as string,
    email: payload.email as string,
    ...payload,
  }
}
