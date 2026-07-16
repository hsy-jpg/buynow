# 오늘사요? 협업 가이드

3인 공동 작업을 위한 기술 스택, Git/브랜치 규칙, 코드 컨벤션, 이슈 관리 방식을 정리한 문서입니다.
프로젝트 배경/기능 명세는 `식료품_물가_탐지기_PRD_v2 (1).md`, 디자인 가이드는 `design.md`를 참고하세요.

---

## 1. 기술 스택

| 영역 | 사용 기술 | 비고 |
|---|---|---|
| 프레임워크 | Next.js 14.2.5 (App Router) | `app/` 디렉토리 기반, Server Component가 기본 |
| UI 라이브러리 | React 18 | |
| 언어 | JavaScript (JSX) | TypeScript 미사용 — 도입 시 팀 논의 후 결정 |
| 스타일링 | Vanilla CSS (`app/globals.css`) | CSS 프레임워크/CSS Modules 미사용, 전역 클래스명 컨벤션으로 관리 |
| 데이터 소스 (Phase 1) | `xlsx` 패키지로 정적 엑셀 파싱 (`lib/ppi.js`) | 별도 DB 없이 서버 모듈 로드 시 메모리 캐시 |
| 클라이언트 상태 저장 | React Context + `localStorage` | 찜/알림/가계부/모의 로그인 — 아직 백엔드 없음 |
| 백엔드/DB (예정) | Supabase (Postgres + Auth) | **미착수.** 도입 시 계정/찜/알림/가계부를 서버로 이전 |
| 배포 (예정) | 미정 (Vercel 권장) | 팀 논의 후 결정 |

### 왜 아직 백엔드가 없는지
로그인, 알림함, 가계부는 현재 브라우저 `localStorage`로만 동작하는 **로컬 모의(mock) 구현**입니다. 기기를 바꾸면 데이터가 사라집니다. Supabase 연동은 다음 단계로 예정되어 있고, `AuthProvider` / `NotificationProvider`의 함수 시그니처(`signIn`, `signUp`, `notifications` 등)를 유지한 채 내부 구현만 교체하는 방향으로 갈 계획입니다.

---

## 2. 폴더 구조

```
app/                  라우트 (Next.js App Router)
  page.js             홈
  main/page.js        탐색/신호등
  mypage/             마이페이지, 알림함, 가계부
  login/, signup/     인증
  layout.js           전역 레이아웃 + Provider 배선
  globals.css         전역 스타일 (컴포넌트별 클래스 단위로 섹션 구분)
components/           재사용 컴포넌트 (Context Provider 포함)
lib/                  서버 전용 데이터 로직 (xlsx 파싱 등)
public/images/        정적 이미지
```

**규칙**
- 페이지(`app/**/page.js`)는 가능하면 **서버 컴포넌트**로 두고, 데이터를 `lib/ppi.js`에서 가져와 클라이언트 컴포넌트에 props로 내려준다.
- 상호작용(useState, localStorage, Context)이 필요한 부분만 `"use client"` 컴포넌트로 분리해 `components/`에 둔다.
- 전역으로 여러 화면에서 필요한 클라이언트 상태(찜/알림/인증)는 Context Provider로, 한 화면에만 쓰이는 상태(가계부 폼 등)는 로컬 `useState`로 — 불필요하게 Provider를 늘리지 않는다.

---

## 3. Git 브랜치 전략

저장소: **GitHub** (신규 생성 필요 — 아직 로컬에만 존재하는 상태)

- `main`: 항상 배포 가능한 상태 유지. 직접 push 금지, PR로만 병합.
- 작업 브랜치 네이밍: `<type>/<짧은-설명>`
  - `feat/ledger-edit`, `fix/signal-percentile`, `chore/gitignore`, `docs/contributing`
  - type: `feat`(기능) · `fix`(버그) · `chore`(잡무/설정) · `docs`(문서) · `refactor`
- 브랜치는 이슈(Notion 카드) 하나당 하나. 작업 끝나면 병합 후 삭제.

### 커밋 메시지 (Conventional Commits)
```
<type>: <한 줄 요약>

(필요하면 본문에 왜 바꿨는지 설명)
```
예:
```
feat: 가계부 항목 수정 기능 추가
fix: 양배추 기준시점 다른 품목 신호등 오류 수정
```

### PR 규칙
- PR 본문에 **무엇을 왜 바꿨는지** + 테스트 방법(어떤 화면에서 어떻게 확인했는지) 작성
- 팀원 1명 이상 리뷰·승인 후 병합 (본인 PR 셀프 머지 금지)
- 병합 방식은 **Squash merge**로 통일 (커밋 히스토리 깔끔하게 유지)
- 화면/기능 변경이면 스크린샷 또는 재현 방법 첨부

---

## 4. 이슈/태스크 관리 (Notion)

- 보드 컬럼: `할 일` → `진행중` → `리뷰중` → `완료`
- 카드 하나 = 작업 브랜치 하나. 카드 제목에 작업 브랜치명을 함께 적어두면 추적이 쉬움
- 카드에 최소 포함할 내용: 배경(왜 필요한지), 완료 조건(Definition of Done), 관련 PRD 섹션 링크
- PRD의 "오픈 이슈" 6개(신호등 계절성 보정, 양배추 기준시점 처리 등)는 결정 전까지 Notion에 별도 `의사결정 필요` 라벨로 관리

---

## 5. 코드 컨벤션

기존 코드에서 이미 쓰이고 있는 패턴을 그대로 따릅니다.

- **컴포넌트 파일명**: `PascalCase.jsx` (예: `ZzimProvider.jsx`), 페이지는 Next.js 규칙대로 `page.js`
- **Context Provider 패턴**: `createContext` + `useXxx()` 훅으로 노출, Provider 밖에서 훅 호출 시 에러 던지기 (`ZzimProvider.jsx`, `AuthProvider.jsx` 참고)
- **localStorage 동기화 패턴**: `ready` 상태로 최초 로드 완료 여부를 추적하고, `ready`가 true일 때만 저장 (마운트 시 빈 값으로 덮어쓰는 것을 방지) — 새 Provider 추가 시 이 패턴 유지
- **CSS**: 클래스명은 BEM이 아닌 화면/컴포넌트 단위의 짧은 이름 (`.ledger-row`, `.notif-hint`) + 상태는 modifier 클래스(`.on`, `.active`, `.read`)로 표현. `globals.css` 안에서 화면 단위로 주석 구분선(`/* ---------- 섹션명 ---------- */`)을 유지
- **주석**: "왜"가 비직관적일 때만 한 줄로. 코드가 "무엇을" 하는지 설명하는 주석은 지양
- **서버 전용 로직**은 `lib/`에, 클라이언트 상호작용은 `components/`에 — 섞지 않기
- 절대경로 import는 `@/`(=프로젝트 루트) alias 사용 (`jsconfig.json` 설정됨)

### 아직 없는 것 (도입 시 팀 합의 필요)
- Linter/Formatter: `next lint`만 있고 ESLint 세부 규칙·Prettier 미설정
- 테스트: 테스트 프레임워크 없음
- TypeScript: 미도입

---

## 6. 로컬 개발 환경 설정

```bash
npm install
npm run dev       # http://localhost:3000 (포트 사용 중이면 자동으로 다음 포트)
```

- Node.js 버전: 팀원 간 동일 LTS 버전 사용 권장 (`.nvmrc` 추가는 TODO)
- 환경 변수: 현재는 없음. Supabase 연동 시 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`를 `.env.local`에 추가하고 **절대 커밋하지 않기** (`.gitignore`에 이미 포함됨)

---

## 7. Definition of Done (PR 병합 전 체크)

- [ ] `npm run dev`로 직접 화면에서 동작 확인 (골든 패스 + 엣지 케이스)
- [ ] 콘솔에 새로운 에러/경고 없음
- [ ] 관련 PRD 섹션과 기능이 일치하는지 확인 (범위 벗어난 기능 추가 금지)
- [ ] PR 본문에 테스트 방법 기록
- [ ] Notion 카드 상태를 `리뷰중` → `완료`로 이동

---

## 8. TODO (아직 정하지 않은 것)

- [ ] GitHub 저장소 생성 및 팀원 초대, 브랜치 보호 규칙(main 직접 push 금지) 설정
- [ ] 배포 플랫폼 결정 (Vercel 등)
- [ ] Supabase 프로젝트 생성 시점 및 스키마 설계
- [ ] 커뮤니케이션 채널(Slack/Discord 등) 및 정기 싱크 주기
- [ ] Linter/Formatter 도입 여부
