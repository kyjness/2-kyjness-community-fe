# PuppyTalk Frontend

**현재 프로젝트는 React + Vite 기반입니다.** 과거 바닐라 JavaScript 구현체는 `legacy-vanilla-js/` 폴더에 참고용으로 보존되어 있습니다.

---

**PuppyTalk** 커뮤니티의 웹 프론트엔드입니다. React + Vite 기반 SPA로, 회원가입·게시글·댓글·좋아요·프로필 수정 등 기능을 제공하며 백엔드 API [**PuppyTalk Backend**](https://github.com/kyjness/2-kyjness-community-be)와 통신합니다.

- **백엔드**: [2-kyjness-community-be](https://github.com/kyjness/2-kyjness-community-be)
- **인프라·배포**: [PuppyTalk Infra](https://github.com/kyjness/2-kyjness-community-infra)

---

## 개요

### 기술 스택

| 구분 | 기술 |
|------|------|
| **렌더링** | CSR (Client-Side Rendering) – React로 DOM 생성 |
| **아키텍처** | SPA (Single Page Application) – React Router로 화면 전환 |
| **프레임워크** | React 19, Vite 8 |
| **HTTP** | Axios (credentials 포함, 401 시 Silent Refresh) |
| **상태** | React Context (Auth), Zustand (게시글 수정 등) |
| **언어** | JavaScript (ES Modules), 일부 TypeScript (EditPost, store, types) |
| **스타일** | CSS + CSS Modules (EditPost) |
| **브라우저** | ES Modules 지원 브라우저 (Chrome, Firefox, Safari, Edge 최신 버전) |

---

## 폴더 구조

```
2-kyjness-community-fe/
│
├── index.html              # SPA 단일 HTML (root만, 스플래시는 App에서 렌더)
├── img/                    # 정적 파일 (Vite publicDir: 'img')
│   ├── anim1.json, anim2.json, anim3.json   # 스플래시 Lottie
│   └── imt.png             # 기본 프로필 이미지
│
├── legacy-vanilla-js/      # 과거 바닐라 JS 구현체 (참고용 보존)
│
├── src/
│   ├── main.jsx            # 진입점: createRoot, App 마운트
│   ├── App.jsx             # 스플래시 완료 전 SplashScreen, 이후 BrowserRouter+AuthProvider+Router
│   ├── Router.jsx          # Routes, ProtectedRoute, 401 핸들러
│   ├── config.js           # BASE_URL, DEFAULT_PROFILE_IMAGE, HEADER_TITLE, SPLASH_ITEMS
│   ├── api/client.js       # Axios, Silent Refresh, Authorization
│   ├── context/AuthContext.jsx
│   ├── css/base.css, app.css
│   ├── hooks/              # 페이지별 로직 (useLogin, useSignup, usePostList, useNewPost, usePostDetail, useEditProfile, useChangePassword, usePostImages)
│   ├── pages/              # 껍데기: Hook + components 조합 (Login, Signup, PostList, PostDetail, NewPost, EditPost, EditProfile, ChangePassword, NotFound)
│   ├── components/         # Header, SplashScreen, PostCard, DogProfileBanner, ImagePreviewItem, ProtectedRoute, Signup/, Login/, ChangePassword/, NewPost/, PostDetail/, EditProfile/, PostList/, EditPost/
│   ├── store/usePostStore.ts
│   ├── types/post.ts
│   └── utils/index.js
│
├── vite.config.js
├── package.json
└── README.md
```

---

## 설계 배경

| 선택 | 이유 (왜 이렇게 했는가) |
|------|------------------------|
| **React + Vite** | 상태 변화가 잦은 커뮤니티 특성상 컴포넌트 단위 개발이 유지보수에 유리하다고 판단했습니다. Vite는 HMR이 빠르고 설정이 단순해 레거시 이전이 수월하며, 빌드 결과물은 정적 자산으로 어디서든 호스팅 가능합니다. |
| **Router + ProtectedRoute** | 보호 경로를 페이지마다 체크하면 누락·불일치가 생기므로, 라우팅 레벨에서 한 곳만 인증 처리했습니다. 미로그인 시 로그인 페이지로 보내 접근 제어를 중앙화해 보안 정책을 일관되게 유지합니다. |
| **Axios + Silent Refresh** | Access Token 단축(15분)은 보안에 유리하지만 사용자가 자주 끊기는 느낌을 받을 수 있습니다. 401 시 Refresh Token(HttpOnly 쿠키)으로 백그라운드 갱신 후 실패 요청 재시도, 요청 큐로 refresh 중복 호출을 방지해 만료 후에도 끊김 없는 UX를 제공합니다. |
| **개발 시 프록시** | 프론트(5173)와 백(8000)이 다른 origin이면 쿠키가 자동으로 붙지 않을 수 있습니다. /api, /upload를 백엔드로 프록시해 같은 origin처럼 요청하게 하면, 개발 단계에서도 쿠키와 이미지가 실제 서비스와 동일하게 동작합니다. |
| **AuthContext** | 로그인 여부와 유저 정보를 헤더, 목록, 상세, 댓글 등 여러 곳에서 사용하므로, props drilling을 피하고 단일 소스로 관리하기 위해 Context를 사용했습니다. 전역 규모가 크지 않아 Redux 없이 React만으로 충분합니다. |

---

## API 연동

- **Prefix**: 모든 API는 `/v1`을 사용합니다. `config.js`의 `BASE_URL`은 개발 시 `/api/v1`(프록시로 8000의 `/v1`로 전달)입니다.
- **상세 문서**: 백엔드 저장소 README 또는 서버 실행 후 **Swagger UI** (`http://localhost:8000/docs`), **ReDoc** (`http://localhost:8000/redoc`)를 참고하세요.

| 항목 | 프론트 | 백엔드 |
|------|--------|--------|
| 인증 | Access Token(Authorization 헤더), Refresh Token(HttpOnly 쿠키) | JWT 검증, Refresh 시 새 Access Token 발급 |
| API | Axios `credentials: true`, 요청 시 `Authorization: Bearer <accessToken>` | CORS credentials 허용 |
| 응답 | `{ code, data }` 파싱 | `{ code, data }` 형식 |
| 미디어 | 이미지 업로드 후 `imageId`를 회원가입·프로필·게시글 요청에 사용 | `POST /v1/media/images?purpose=profile|post` → `imageId`, `file_url` 등 반환 |
| 게시글 목록 | `GET /v1/posts` → 목록 정규화(author 등) 후 정렬 표시 | 목록 배열 |
| 댓글·좋아요 | `GET /v1/posts/{id}/comments`, `POST/DELETE .../likes`, 200 + `ALREADY_LIKED` 시 DELETE로 취소 | 동일 |

---

## 전체 흐름

```
[사용자] 클릭, 폼 제출, URL 입력
    │
    ▼
┌──────────────────────────────────────────────────────────────────────┐
│  프론트엔드 (React SPA + Vite)                                        │
│                                                                      │
│  ① 앱 진입 (main.jsx)                                                 │
│     → 스플래시(Lottie) 순차 재생 후 <App /> 마운트                     │
│     → AuthProvider: localStorage에서 accessToken·user 복원 (표시용)   │
│     → Router: BrowserRouter, Routes, Route, ProtectedRoute            │
│                                                                      │
│  ② 라우팅 (Router.jsx)                                                │
│     → 인증 필요 경로는 <ProtectedRoute>로 감싸 미로그인 시 /login 이동  │
│     → 페이지 컴포넌트(PostList, PostDetail, NewPost 등) 렌더            │
│                                                                      │
│  ③ 페이지 (pages/*.jsx)                                               │
│     → api.get/post 등으로 데이터 요청 후 state 갱신, JSX로 렌더       │
│     → 이미지·폼: usePostImages, utils 검증 함수 활용                   │
│                                                                      │
│  ④ API (api/client.js)                                                │
│     → Axios: BASE_URL + endpoint, credentials: true, 요청 시 Bearer 토큰 |
│     → 401 시 /auth/refresh 호출 → 성공 시 토큰 갱신·재시도, 실패 시 로그아웃·/login |
└──────────────────────────────────────────────────────────────────────┘
    │
    ▼
[화면 갱신]
```

---

## 실행 방법

### 1. 사전 준비

- **백엔드 API**가 실행 중이어야 합니다. 실행·설정은 **`2-kyjness-community-be` README**를 참고하세요.
- **Docker로 전체 스택(백엔드+프론트) 실행** 시 [**인프라 레포(2-kyjness-community-infra)**](https://github.com/kyjness/2-kyjness-community-infra) README를 참고하세요.
- **Node.js**가 필요합니다 (npm 또는 yarn).

### 2. 백엔드 실행

- **참고**: 백엔드 로컬 실행 (실행·환경 변수·DB는 해당 레포 README를 참고하세요).
  ```bash
  cd ../2-kyjness-community-be
  poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  ```
- **확인**: `http://localhost:8000`에서 서버가 떠 있으면 다음 단계로 진행하시면 됩니다.

### 3. 프론트엔드 실행

```bash
# 프로젝트 루트(2-kyjness-community-fe)에서
npm install
npm run dev
```

- 브라우저에서 **http://localhost:5173**으로 접속하세요 (Vite 기본 포트).
- 개발 시 `/api`, `/upload` 요청은 Vite가 `http://localhost:8000`으로 프록시합니다.

### 4. 린트 (ESLint)

```bash
npm run lint
```

### 5. 설정

- **배포**: `src/config.js`의 `BASE_URL`은 `import.meta.env.VITE_API_BASE_URL`로 우선 적용됩니다. 빌드 시 해당 환경 변수를 실제 API 주소로 설정하세요 (예: `https://api.example.com/v1`).
- **정적 파일**: `img/` 폴더가 `publicDir`로 서빙되며, `/imt.png`, `/anim1.json` 등으로 접근 가능합니다.
