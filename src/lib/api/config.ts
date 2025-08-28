// 환경별 API 설정
const isDevelopment = import.meta.env.DEV

export const API_BASE = isDevelopment 
  ? 'http://localhost:8080' 
  : 'https://api.everyplan.site'

export const SSE_NOTIFICATIONS_PATH = `${API_BASE}/api/notifications/stream`

// OAuth2 로그인 URL
export const OAUTH2_LOGIN_URL = `${API_BASE}/api/auth/login/google`

// 디버깅 정보 (개발 환경에서만 출력)
if (isDevelopment && !import.meta.env.PROD) {
  console.log('🔧 환경 설정:', {
    isDevelopment,
    API_BASE,
    OAUTH2_LOGIN_URL,
    userAgent: navigator.userAgent,
  })
}


