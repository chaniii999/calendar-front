## 애브리플랜 - 캘린더/투두 앱 (React 18 + Vite + TS + MUI)

### 1) 앱 설명
- 투두 관리와 달력 기반 일정 조회를 제공하는 단일 페이지 앱입니다.
- 상단 탭으로 ToDo/Calendar 전환, Google OAuth 로그인 버튼 제공(`/api/auth/login/google` 리다이렉트).
- 기본 렌더링은 캘린더 페이지(`/calendar`)이며, 좌측 사이드바(미니 달력/오늘/빠른 추가) + 우측 일정 리스트 구조입니다.

### 2) 빌드 및 실행
```bash
npm install
npm run dev
# 브라우저가 http://localhost:5173 자동 오픈
```

백엔드와 연동 시(선택):
- 백엔드 서버가 8080 포트에서 구동 중이어야 하며, `/api/auth/login/google` 엔드포인트가 동작해야 합니다.
- 로그인 성공 후 백엔드 설정의 `frontend.success-redirect` 주소로 리다이렉트됩니다.

### 3) 최근 업데이트 하이라이트
- 인증/라우팅
  - 앱 시작 시 토큰 유효성 자동 검증(리프레시 포함). 실패 시 스토리지 정리 후 로그인 화면.
  - 기본 경로(`/`)는 `/calendar`로 리디렉트. 로그인 성공 후 `/calendar` 이동.
  - 상단 탭은 URL과 동기화(캘린더 기본 선택).
- 레이아웃/테마
  - 네이버 캘린더 레이아웃 참고: 좌측 미니 달력 + 우측 콘텐츠 2열.
  - 현대적인 블루/그레이 팔레트와 정제된 버튼/아이콘 버튼 스타일.
  - 툴바: "YYYY년 M월" 오른쪽에 이전/다음 `Chevron` 아이콘 버튼.
- 캘린더 페이지 UX
  - 상단 달력 대신 사이드바 미니 달력 유지, 본문은 리스트 중심.
  - 일정 리스트 카드화(좌측 보더에 일정 색상, 제목/메타/설명 영역 분리).
  - 호버 시 약한 쉐도우와 배경 하이라이트로 클릭 유도.
  - 날짜 헤더 칩 하이라이트("DATE" 라벨 제거).
  - 상세 다이얼로그: 수정/복제/삭제 액션 제공.
  - 삭제 Undo 스낵바(10초): 되돌리기 지원, 시간 초과 시 서버 최종 삭제.
  - 스켈레톤 로딩: 조회 중 리스트 스켈레톤 표시.
  - 텍스트 검색: 제목/설명에 대해 실시간 필터링.
  - 빠른 일정 추가: 사이드바에서 제목만 입력해 즉시 생성(새로고침 없이 리스트 반영).
- 색상 팔레트
  - 일정 생성/수정 시 미리 정의된 팔레트(무지개 + 파생 색상)로 색상 선택.
  - 빠른 추가에는 색상 선택 제외(간편 입력 목적).

### 4) 주요 컴포넌트
- `src/ui/pages/CalendarPage.tsx`: 캘린더 화면(사이드바/리스트/검색/스낵바/다이얼로그 관리)
- `src/lib/components/CalendarSidebar.tsx`: 미니 달력, 오늘, 빠른 일정 추가
- `src/lib/components/CalendarList.tsx` / `CalendarListItemCard.tsx`: 일정 리스트와 카드
- `src/lib/components/ScheduleCreateDialog.tsx` / `ScheduleEditDialog.tsx` / `ScheduleDetailDialog.tsx`
- `src/lib/components/ColorPalettePicker.tsx`: 미리 정의된 팔레트 선택기

### 5) 백엔드 연동
- 로그인 버튼이 백엔드의 Google OAuth 시작점으로 이동합니다.
- 성공 시 프론트로 토큰 쿼리(`accessToken`, `refreshToken`, `u`)가 전달됩니다.
 - API 사용 예시
   - 일정 범위 조회: `GET /api/schedule/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
   - 일정 생성: `POST /api/schedule`
   - 일정 수정: `PUT /api/schedule/{id}`
   - 일정 삭제: `DELETE /api/schedule/{id}`
   - 토큰 갱신: `POST /api/auth/refresh`


