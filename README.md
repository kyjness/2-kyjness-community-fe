# PuppyTalk - 커뮤니티 프론트엔드

강아지 커뮤니티 서비스를 위한 웹 프론트엔드입니다.  
바닐라 JavaScript 기반 SPA로, 회원가입·게시글·댓글·좋아요·프로필 수정 등 기능을 제공하며 백엔드 API(`2-kyjness-community-be`)와 통신합니다.

---

## 개요

### 기능

| 기능 | 설명 |
|------|------|
| **인증 (Auth)** | 회원가입(프로필 사진 선택 가능), 로그인, 로그아웃. 로그인 상태는 `localStorage`(표시용)와 쿠키(실제 인증)로 유지 |
| **사용자 (Users)** | 프로필 조회·수정, 비밀번호 변경, 프로필 사진 업로드. `/users/me` 경로에 대응 |
| **게시글 (Posts)** | 목록(무한 스크롤), 상세, 작성(이미지 최대 5장), 수정, 삭제, 좋아요 추가/취소 |
| **댓글 (Comments)** | 게시글별 댓글 보기(20개 단위 페이지 번호), 작성, 수정, 삭제 |

### 기술 스택

| 구분 | 기술 |
|------|------|
| **렌더링** | CSR (Client-Side Rendering) – 브라우저에서 JS로 DOM 생성 |
| **아키텍처** | SPA (Single Page Application) – 단일 HTML, 해시 라우팅으로 화면 전환 |
| **프론트** | HTML5, CSS3, JavaScript (ES6+, ES Modules, `async/await`, `fetch`) |
| **백엔드** | FastAPI (PuppyTalk API) |
| **브라우저** | ES Modules 지원 브라우저 (Chrome, Firefox, Safari, Edge 최신 버전) |

### 인증·API 연동

- **인증**: 로그인 시 백엔드가 세션 ID를 쿠키로 설정. 이후 요청 시 `credentials: 'include'`로 쿠키 자동 전송.
- **상태 표시**: `state.js`·`localStorage`에 사용자 정보를 저장해 헤더 등 UI에 표시. 실제 인증 판단은 서버(쿠키) 기준.
- **401 처리**: API가 401을 반환하면 `clearUser()` 후 로그인 페이지로 이동.

### 설계 배경

| 선택 | 이유 |
|------|------|
| **SPA + CSR** | 커뮤니티는 글·댓글·좋아요 등 상호작용이 빈번하므로 새로고침 없이 화면 전환이 가능한 SPA가 적합. CSR은 빌드 결과만 정적 호스팅하면 되어 서버 런타임이 필요 없음. |
| **main.js / router.js 분리** | 진입점과 라우팅을 분리해 단일 책임 유지, 라우트 추가·변경 시 수정 범위를 router로 한정. |
| **인증은 라우터에서** | 인증 필요 경로를 라우터에서 일괄 검사해 접근 제어를 일관되게 하고, 수정 시 한 곳만 보면 됨. |
| **페이지별 Lazy Loading** | 경로 진입 시 해당 페이지만 동적 import하여 초기 로딩 시간과 번들 크기 절감. |
| **무한 스크롤 vs 페이지네이션** | 게시글 목록은 피드 형태로 스크롤하며 읽는 UX가 자연스럽고, 댓글은 "몇 페이지인지", "총 몇 개인지"가 중요해 페이지 번호 버튼 선택. (백엔드와 동일한 설계) |

---

## API 연동

프론트엔드는 백엔드 API를 아래 규칙으로 호출합니다. **모든 API는 `/v1` prefix를 사용하며, `config.js`의 `BASE_URL`에 `/v1`이 포함되어 있습니다.**

| 항목 | 프론트 | 백엔드 |
|------|--------|--------|
| 인증 | 상태는 표시용, 실제 인증은 쿠키 기준 | `session_id` 쿠키로 사용자 식별 |
| API | `credentials: 'include'`로 쿠키 전송 | CORS credentials 허용 |
| 응답 | `{ code, data }` 파싱 | `{ code, data }` 형식 |
| 게시글 목록 | 스크롤 시 `page` 증가, `response.hasMore`로 추가 로드 여부 판단 | `GET /v1/posts?page=&size=` → `{ data, hasMore }` |
| 댓글 목록 | `GET /v1/posts/{id}/comments?page=&size=20`, 페이지 번호 버튼으로 전환 | `{ data, totalCount, totalPages, currentPage }` |

---

## 폴더 구조

```
2-kyjness-community-fe/
│
├── index.html              # SPA 단일 HTML
│
├── css/
│   ├── base.css            # 공통 스타일 (리셋, 폰트, 폼, 버튼, 헤더, 모달)
│   └── app.css             # 페이지별 스타일 (목록, 상세, 작성, 반응형)
│
├── img/
│   ├── anim1.json, anim2.json, anim3.json   # 스플래시 애니메이션 (Lottie)
│   └── imt.png             # 기본 프로필 이미지
│
└── js/
    ├── main.js             # 앱 진입점 (스플래시 → 라우터 초기화)
    ├── config.js           # API 주소 등 설정
    ├── router.js           # 해시 라우팅, 인증 검사, 페이지 로드
    ├── api.js              # API 호출 (fetch 래퍼, 401 시 로그인 이동)
    ├── state.js            # 로그인 상태 관리
    ├── utils.js            # 날짜 포맷, 에러 메시지, 입력 검증 등
    │
    ├── pages/              # 화면별 페이지
    │   ├── login.js        # 로그인
    │   ├── signup.js       # 회원가입
    │   ├── postList.js     # 게시글 목록 (무한 스크롤)
    │   ├── postDetail.js   # 게시글 상세 (댓글, 좋아요, 수정·삭제)
    │   ├── newPost.js      # 게시글 작성
    │   ├── editPost.js     # 게시글 수정
    │   ├── editProfile.js  # 회원정보 수정
    │   └── changePassword.js   # 비밀번호 변경
    │
    └── components/         # 재사용 컴포넌트
        ├── header.js       # 공통 헤더
        └── postCard.js     # 게시글 카드
```

---

## 전체 흐름

```
[사용자] 클릭, 폼 제출, URL 입력
    │
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  프론트엔드 (Vanilla JS SPA + CSR)                                    │
│                                                                      │
│  ① 앱 진입 (DOMContentLoaded, 1회)                                    │
│     → main.js: 스플래시(Lottie) 순차 재생 후 initApp()                │
│     → restoreUser(): localStorage에서 로그인 정보 복원 (표시용)        │
│     → initRouter(): hashchange 리스너 등록, route() 최초 1회 호출      │
│                                                                      │
│  ② 라우터 (router.js)                                                 │
│     → parseHash(): #/posts/123 → { path: '/posts/:id', params }       │
│     → 인증: authRequiredRoutes 포함 경로는 isLoggedIn() 확인, 미로그인 시 /login 이동│
│     → Lazy Loading: routeLoaders[path]()로 해당 페이지만 dynamic import│
│     → 로드된 모듈의 renderXXX(params) 호출. 실패 시 404               │
│                                                                      │
│  ③ 페이지 (pages/*.js)                                               │
│     → root.innerHTML = renderHeader() + 본문. 이벤트는 attach*Events  │
│     → api.get/post 등으로 데이터 요청 후 DOM 갱신                     │
│                                                                      │
│  ④ API (api.js)                                                       │
│     → fetch(BASE_URL + endpoint, { credentials: 'include' })          │
│     → 401 시 clearUser() 후 navigateTo('/login')                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
    │
    ▼
[화면 갱신]
```

---

## 실행 방법

### 1. 사전 준비

- **백엔드 API**가 실행 중이어야 합니다. (`2-kyjness-community-be` 참고)
- **웹 서버**로 프론트 정적 파일을 서빙해야 합니다. (파일 직접 열기 `file://`은 CORS·ES Modules 이슈로 동작하지 않을 수 있음)

### 2. 백엔드 실행

프론트엔드는 백엔드 API에 의존하므로 **백엔드를 먼저 실행**합니다.

```bash
cd ../2-kyjness-community-be
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

`http://localhost:8000`에서 백엔드가 떠 있으면 다음 단계로 진행합니다.

### 3. 프론트엔드 실행

정적 파일을 웹 서버로 서빙합니다. **Node.js는 필요 없습니다.** Live Server 또는 Python 중 하나만 있으면 됩니다.

**VS Code Live Server (권장)**

1. 프로젝트 폴더 열기
2. `index.html` 우클릭 → **Open with Live Server**
3. `http://127.0.0.1:5500` 등 표시된 주소로 접속

**Python**

```bash
cd 2-kyjness-community-fe
python -m http.server 8080
```

### 4. 설정

배포 시 **`js/config.js`**에서 `BASE_URL`만 실제 API 서버 주소로 수정하면 됩니다. 설명은 config.js 주석을 참고합니다.

---

## 확장 전략

### 기능

- **검색/필터**: 견종·지역·태그로 게시글 검색
- **신고/차단**: 게시글 신고, 사용자 차단 (차단한 사람 글 숨김)
- **알림**: 내 글에 댓글 달리면 알림 리스트
- **관리자**: 신고 누적 글 숨김, 유저 제재 (ROLE 기반)

### 인프라 (규모 확대 시)

- **캐시 (Redis)**: 인기 게시글·댓글 캐싱
- **메시지 큐**: 알림·이미지 처리 등 비동기 작업
