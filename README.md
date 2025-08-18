## 캘린더/투두 앱 (React 18 + Vite + TS + MUI)

### 1) 앱 설명
- 투두 관리와 달력 기반 일정 조회를 제공하는 단일 페이지 앱입니다.
- 상단 탭으로 ToDo/Calendar 전환, Google OAuth 로그인 버튼 제공(`/api/auth/login/google` 리다이렉트).
- 기본 기능 외 아이디어: 선택 날짜별 일정 쌓기, ToDo 진행률 요약, 키보드 Enter로 일정/할일 추가.

### 2) 빌드 및 실행
```bash
npm install
npm run dev
# 브라우저가 http://localhost:5173 자동 오픈
```

백엔드와 연동 시(선택):
- 백엔드 서버가 8080 포트에서 구동 중이어야 하며, `/api/auth/login/google` 엔드포인트가 동작해야 합니다.
- 로그인 성공 후 백엔드 설정의 `frontend.success-redirect` 주소로 리다이렉트됩니다.

### 3) 주요 컴포넌트 및 사용 이유
- MUI AppBar/Tabs: 상단 내비게이션과 화면 전환을 간단히 구성.
- MUI Date Calendar(픽커스): 날짜 선택 UI를 빠르게 구현.
- List/Checkbox/TextField: ToDo CRUD에 직관적인 입력/표시 제공.
- React Router: ToDo/Calendar 라우팅 분리.

### 4) 백엔드 과제와 셋트 수행
- 로그인 버튼이 백엔드의 Google OAuth 시작점으로 이동합니다.
- 성공 시 프론트로 토큰 쿼리(`accessToken`, `refreshToken`, `u`)가 전달됩니다.


