# JWT 토큰 자동 갱신 기능

이 디렉토리는 JWT 토큰의 자동 갱신 기능을 구현한 파일들을 포함합니다.

## 📁 파일 구조

```
src/lib/auth/
├── session.ts              # 토큰 저장/읽기/삭제
├── tokenUtils.ts           # 토큰 유틸리티 함수들
├── useAutoTokenRefresh.ts  # 토큰 자동 갱신 React Hook
├── useTokenRefresh.ts      # 토큰 갱신 Hook (고급)
└── README.md              # 이 파일
```

## 🚀 주요 기능

### 1. 자동 토큰 갱신
- 서버에서 `New-Access-Token` 헤더로 새로운 토큰을 전달하면 자동으로 저장
- 토큰 만료 시 자동으로 로그아웃 처리
- 토큰 만료 예정 시 경고 로그 출력

### 2. 토큰 상태 모니터링
- 토큰 만료 시간 확인
- 토큰 만료 예정 여부 확인
- 토큰 페이로드 디코딩

### 3. 개발자 도구
- `TokenStatusDebugger` 컴포넌트로 실시간 토큰 상태 확인
- 개발 환경에서만 표시

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
    checkInterval: 30000, // 30초마다 확인
    expirationThreshold: 5, // 5분 전에 만료 예정
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

### 토큰 디코딩

```typescript
import { decodeToken, extractUserInfoFromToken } from '@lib/auth/tokenUtils'

const token = 'your.jwt.token'
const payload = decodeToken(token)
const userInfo = extractUserInfoFromToken(token)

console.log('토큰 페이로드:', payload)
console.log('사용자 정보:', userInfo)
```

## 🔄 작동 원리

### 1. 서버 자동 갱신
1. 클라이언트가 API 요청을 보냄
2. 서버에서 토큰이 만료되었거나 곧 만료될 예정이면 자동으로 새 토큰 생성
3. 새로운 토큰을 `New-Access-Token` 헤더로 응답
4. 클라이언트에서 헤더를 확인하여 토큰 자동 저장

### 2. 클라이언트 모니터링
1. `useAutoTokenRefresh` Hook이 주기적으로 토큰 상태 확인
2. 토큰이 만료되면 자동으로 로그아웃 처리
3. 토큰이 곧 만료될 예정이면 경고 로그 출력

### 3. 폴백 메커니즘
1. 서버 자동 갱신이 실패한 경우
2. 클라이언트에서 수동으로 `/api/auth/refresh` API 호출
3. 성공하면 새 토큰으로 원래 요청 재시도

## ⚠️ 주의사항

### 1. 보안
- 토큰은 로컬 스토리지에 저장되므로 XSS 공격에 취약할 수 있음
- 프로덕션 환경에서는 httpOnly 쿠키 사용 권장

### 2. 성능
- 토큰 상태 확인은 주기적으로 실행되므로 적절한 간격 설정 필요
- 너무 짧은 간격은 성능에 영향을 줄 수 있음

### 3. 에러 처리
- 토큰 갱신 실패 시 적절한 에러 처리 필요
- 네트워크 오류 시 재시도 로직 구현 권장

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

## 📝 로그 메시지

- `토큰이 자동으로 갱신되었습니다.` - 서버에서 새 토큰을 받았을 때
- `토큰이 곧 만료될 예정입니다.` - 토큰이 5분 이내에 만료될 때
- `토큰이 만료되었습니다.` - 토큰이 만료되었을 때
- `토큰 갱신 실패:` - 수동 갱신이 실패했을 때

## 🔮 향후 개선 계획

1. **토큰 갱신 통계**: 갱신 성공률, 실패 원인 등 모니터링
2. **적응형 갱신**: 사용자 패턴에 따른 동적 갱신 시간 조정
3. **다중 토큰 지원**: 여러 디바이스에서 동시 로그인 지원
4. **토큰 블랙리스트**: 로그아웃된 토큰 즉시 무효화
