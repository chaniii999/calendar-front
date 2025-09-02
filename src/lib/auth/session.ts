import { API_BASE } from '@lib/api/config'

// 세션 기반 토큰 관리 (localStorage 사용 금지)
export interface SessionTokens {
  accessToken: string
  refreshToken: string
  userId: string
  userEmail: string
  userNickname: string
}

// 메모리 기반 토큰 저장 (localStorage 대신)
let memoryTokens: {
  accessToken: string | null
  refreshToken: string | null
} = {
  accessToken: null,
  refreshToken: null
}

// 세션에서 토큰 조회
export async function getTokensFromSession(): Promise<SessionTokens> {
  try {
    if (import.meta.env.DEV) {
      console.log('🔄 세션에서 토큰 조회 시도:', `${API_BASE}/api/notifications/tokens`)
      console.log('🍪 현재 쿠키 상태:', document.cookie)
      console.log('🌐 API_BASE:', API_BASE)
      console.log('🌐 현재 도메인:', window.location.hostname)
      console.log('🌐 현재 포트:', window.location.port)
      console.log('🌐 프록시 사용 여부:', API_BASE === '')
      console.log('🌐 최종 요청 URL:', `${API_BASE}/api/notifications/tokens`)
    }
    
    const response = await fetch(`${API_BASE}/api/notifications/tokens`, {
      method: 'GET',
      credentials: 'include', // 세션 쿠키 포함
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache' // 캐시 방지
      }
    })

    if (!response.ok) {
      const errorText = await response.text()
      if (import.meta.env.DEV) {
        console.error('❌ 토큰 조회 실패:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        })
      }
      throw new Error(`토큰 조회 실패: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    
    if (import.meta.env.DEV) {
      console.log('✅ 세션에서 토큰 조회 성공:', {
        hasAccessToken: !!data.accessToken,
        hasRefreshToken: !!data.refreshToken,
        userId: data.userId,
        userEmail: data.userEmail,
        userNickname: data.userNickname
      })
    }

    return {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      userId: data.userId,
      userEmail: data.userEmail,
      userNickname: data.userNickname
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('❌ 세션에서 토큰 조회 중 오류:', error)
    }
    throw error
  }
}

// 메모리에 토큰 저장
export function saveTokensToMemory(tokens: SessionTokens) {
  memoryTokens = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  }
  
  if (import.meta.env.DEV) {
    console.log('💾 메모리에 토큰 저장 완료')
  }
}

// 메모리에서 토큰 읽기
export function readTokensFromMemory(): { accessToken: string | null, refreshToken: string | null } {
  return { ...memoryTokens }
}

// 메모리에서 토큰 삭제
export function clearTokensFromMemory() {
  memoryTokens = {
    accessToken: null,
    refreshToken: null
  }
  
  if (import.meta.env.DEV) {
    console.log('🗑️ 메모리에서 토큰 삭제 완료')
  }
}

// 하위 호환성을 위한 함수들 (localStorage 대신 메모리 사용)
export function saveTokensToStorage(accessToken: string, refreshToken: string) {
  // localStorage 사용 금지, 메모리에 저장
  saveTokensToMemory({ 
    accessToken, 
    refreshToken, 
    userId: '', 
    userEmail: '', 
    userNickname: '' 
  })
}

export function readTokensFromStorage(): { accessToken: string | null, refreshToken: string | null } {
  // localStorage 사용 금지, 메모리에서 읽기
  return readTokensFromMemory()
}

export function clearTokensFromStorage() {
  // localStorage 사용 금지, 메모리에서 삭제
  clearTokensFromMemory()
}

// JWT 토큰에서 사용자 ID 추출
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

