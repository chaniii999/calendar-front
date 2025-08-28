# JWT 토큰 자동 갱신 시스템

이 디렉토리는 2025 캘린더 애플리케이션의 JWT 토큰 자동 갱신 기능을 구현한 파일들을 포함합니다.

## 📁 파일 구조

```
src/lib/auth/
├── session.ts              # 토큰 저장/읽기/삭제 및 사용자 ID 추출
├── tokenUtils.ts           # 토큰 유틸리티 함수들 (디코딩, 만료 확인 등)
├── useAutoTokenRefresh.ts  # 토큰 자동 갱신 React Hook (주기적 모니터링)
├── useTokenRefresh.ts      # 토큰 갱신 Hook (HTTP 요청/응답 인터셉트)
└── README.md              # 이 파일
```

## 🚀 주요 기능

### 1. 자동 토큰 갱신
- **서버 자동 갱신**: `new-access-token` 헤더로 새로운 토큰을 받으면 자동 저장
- **클라이언트 모니터링**: 주기적으로 토큰 상태 확인 및 만료 예정 시 자동 갱신
- **폴백 메커니즘**: 서버 갱신 실패 시 클라이언트에서 수동 갱신 시도

### 2. 토큰 상태 모니터링
- 토큰 만료 시간 실시간 확인
- 만료 예정 여부 판단 (기본값: 5분 전)
- 토큰 페이로드 디코딩 및 사용자 정보 추출

### 3. 개발자 도구
- `TokenStatusDebugger` 컴포넌트로 실시간 토큰 상태 확인
- 개발 환경에서만 표시되는 디버깅 인터페이스

## 🔧 사용법

### 기본 사용법

```typescript
import { useAutoTokenRefresh } from '@lib/auth/useAutoTokenRefresh'

function App() {
  const { getTokenStatus, refreshTokenManually } = useAutoTokenRefresh({
    onTokenRefresh: (newToken) => {
      console.log('토큰이 갱신되었습니다:', newToken.substring(0, 20) + '...')
    },
    onTokenExpired: () => {
      console.log('토큰이 만료되어 로그아웃됩니다.')
      // 로그아웃 처리
    },
    checkInterval: 60000, // 1분마다 확인 (기본값)
    expirationThreshold: 5, // 5분 전에 만료 예정 (기본값)
  })

  return (
    <div>
      {/* 앱 컴포넌트들 */}
    </div>
  )
}
```

### HTTP 요청 인터셉트 (고급)

```typescript
import { useTokenRefresh } from '@lib/auth/useTokenRefresh'

function App() {
  useTokenRefresh({
    onTokenRefresh: (newToken) => {
      console.log('토큰이 갱신되었습니다')
    },
    onTokenExpired: () => {
      // 로그아웃 처리
    }
  })

  return (
    <div>
      {/* 앱 컴포넌트들 */}
    </div>
  )
}
```

### 토큰 상태 확인

```typescript
import { checkCurrentTokenStatus } from '@lib/auth/tokenUtils'

const status = checkCurrentTokenStatus()
console.log('토큰 상태:', {
  hasToken: status.hasToken,
  isExpired: status.isExpired,
  isExpiringSoon: status.isExpiringSoon,
  remainingTime: status.remainingTime,
  expirationTime: status.expirationTime,
})
```

### 사용자 ID 추출

```typescript
import { extractUserIdFromAccessToken } from '@lib/auth/session'

const userId = extractUserIdFromAccessToken(token)
console.log('사용자 ID:', userId)
```

## 🔄 작동 원리

### 1. 서버 자동 갱신
1. 클라이언트가 API 요청을 보냄
2. 서버에서 토큰이 만료되었거나 곧 만료될 예정이면 자동으로 새 토큰 생성
3. 새로운 토큰을 `new-access-token` 헤더로 응답
4. 클라이언트에서 헤더를 확인하여 토큰 자동 저장

### 2. 클라이언트 모니터링 (`useAutoTokenRefresh`)
1. Hook이 주기적으로 토큰 상태 확인 (기본: 1분마다)
2. 토큰이 만료되면 자동으로 로그아웃 처리
3. 토큰이 곧 만료될 예정이면 자동 갱신 시도
4. 갱신 시도 횟수 제한 (토큰당 최대 3회, 30초 간격)

### 3. HTTP 인터셉트 (`useTokenRefresh`)
1. 모든 HTTP 요청에 자동으로 토큰 헤더 추가
2. 응답에서 `new-access-token` 헤더 확인
3. 401 에러 시 자동으로 토큰 갱신 후 원래 요청 재시도

### 4. 폴백 메커니즘
1. 서버 자동 갱신이 실패한 경우
2. 클라이언트에서 `/api/auth/refresh` API 호출
3. 성공하면 새 토큰으로 원래 요청 재시도

## ⚙️ 설정 옵션

### useAutoTokenRefresh 옵션
- `checkInterval`: 토큰 상태 확인 간격 (밀리초, 기본값: 60000)
- `expirationThreshold`: 만료 예정 임계값 (분, 기본값: 5)
- `onTokenRefresh`: 토큰 갱신 성공 시 콜백
- `onTokenExpired`: 토큰 만료 시 콜백

### 토큰 저장소
- **액세스 토큰**: `localStorage.calendar_access_token`
- **리프레시 토큰**: `localStorage.calendar_refresh_token`

## ⚠️ 주의사항

### 1. 보안
- 토큰은 로컬 스토리지에 저장되므로 XSS 공격에 취약할 수 있음
- 프로덕션 환경에서는 httpOnly 쿠키 사용 권장
- 민감한 정보는 토큰에 포함하지 않도록 주의

### 2. 성능
- 토큰 상태 확인은 주기적으로 실행되므로 적절한 간격 설정 필요
- 너무 짧은 간격은 성능에 영향을 줄 수 있음
- 갱신 시도 횟수 제한으로 무한 루프 방지

### 3. 에러 처리
- 토큰 갱신 실패 시 적절한 에러 처리 필요
- 네트워크 오류 시 재시도 로직 구현 권장
- 사용자에게 적절한 피드백 제공

## 🐛 디버깅

### 개발 환경에서 토큰 상태 확인

```typescript
import { TokenStatusDebugger } from '@lib/components/TokenStatusDebugger'

function CalendarPage() {
  return (
    <div>
      <TokenStatusDebugger show={import.meta.env.DEV} />
      {/* 다른 컴포넌트들 */}
    </div>
  )
}
```

### 콘솔에서 토큰 확인

```javascript
// 브라우저 콘솔에서 실행
import('@lib/auth/tokenUtils').then(m => {
  console.log('토큰 상태:', m.checkCurrentTokenStatus())
})
```

### 토큰 디코딩

```javascript
// 브라우저 콘솔에서 실행
import('@lib/auth/tokenUtils').then(m => {
  const token = localStorage.getItem('calendar_access_token')
  if (token) {
    console.log('토큰 페이로드:', m.decodeToken(token))
  }
})
```

## 📝 로그 메시지

### 개발 환경 로그
- `🔍 토큰 상태 확인:` - 주기적 토큰 상태 확인
- `🔄 토큰이 곧 만료될 예정입니다. 자동 갱신 시도...` - 자동 갱신 시작
- `✅ 토큰 자동 갱신 성공` - 갱신 성공
- `❌ 토큰 자동 갱신 실패` - 갱신 실패
- `⏰ 마지막 갱신 시도로부터 30초가 지나지 않아 스킵` - 갱신 간격 제한
- `⚠️ 같은 토큰에 대해 3번 이상 갱신 시도했으므로 스킵` - 시도 횟수 제한

### 일반 로그
- `토큰이 자동으로 갱신되었습니다.` - 서버에서 새 토큰을 받았을 때
- `토큰이 만료되었습니다.` - 토큰이 만료되었을 때
- `토큰 갱신 실패:` - 수동 갱신이 실패했을 때

## 🔮 향후 개선 계획

1. **토큰 갱신 통계**: 갱신 성공률, 실패 원인 등 모니터링
2. **적응형 갱신**: 사용자 패턴에 따른 동적 갱신 시간 조정
3. **다중 토큰 지원**: 여러 디바이스에서 동시 로그인 지원
4. **토큰 블랙리스트**: 로그아웃된 토큰 즉시 무효화
5. **오프라인 지원**: 네트워크 오프라인 시 토큰 캐싱
6. **보안 강화**: 토큰 암호화 저장 및 httpOnly 쿠키 지원

## 📚 관련 파일

- `src/lib/api/http.ts` - HTTP 클라이언트 및 토큰 관리
- `src/lib/api/config.ts` - API 설정
- `src/lib/components/TokenStatusDebugger.tsx` - 토큰 상태 디버거 컴포넌트
