# PuppyTalk Frontend

**PuppyTalk** 커뮤니티의 웹 프론트엔드입니다. React + Vite 기반 SPA로, 회원가입·게시글·댓글·좋아요·프로필·차단·관리자 기능을 제공합니다.

- **백엔드**: [2-kyjness-community-be](https://github.com/kyjness/2-kyjness-community-be)
- **인프라·배포**: [PuppyTalk Infra](https://github.com/kyjness/2-kyjness-community-infra)

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| **프레임워크** | React 19, Vite 8 (beta) |
| **라우팅** | React Router 7, SPA (CSR) |
| **HTTP** | Axios, credentials 포함, 401 시 Silent Refresh |
| **상태** | React Context (Auth), Zustand (게시글 수정 등) |
| **스타일** | Tailwind CSS 4, index.css, css/base.css |
| **아이콘** | lucide-react |
| **언어** | JavaScript (ES Modules), 일부 TypeScript (EditPost, store, types) |

---

## 폴더 구조

```
2-kyjness-community-fe/
├── index.html              # SPA 엔트리 (root, Pretendard·Lottie CDN)
├── img/                    # 정적 파일 (Vite publicDir: 'img')
│   ├── anim1.json, anim2.json, anim3.json   # 스플래시 Lottie
│   └── imt.png             # 기본 프로필 이미지
├── legacy-vanilla-js/      # 과거 바닐라 JS 구현체 (참고용)
├── src/
│   ├── main.jsx            # 진입점, createRoot → App
│   ├── App.jsx             # 스플래시 후 BrowserRouter + AuthProvider + Router
│   ├── Router.jsx          # Routes, ProtectedRoute, 401 처리
│   ├── config.js           # BASE_URL, DEFAULT_PROFILE_IMAGE, SPLASH_ITEMS
│   ├── index.css           # Tailwind 진입
│   ├── css/base.css        # 공통 스타일
│   ├── api/
│   │   ├── client.js       # Axios 인스턴스, Silent Refresh, Bearer
│   │   ├── api-types.ts    # ApiResponse, 스키마 단축 타입, NewImageItem 등
│   │   └── generated/schema.d.ts   # OpenAPI 기반 자동 생성 타입 (SSOT)
│   ├── context/AuthContext.jsx
│   ├── hooks/              # useLogin, useSignup, usePostList, useNewPost, usePostDetail,
│   │                       # usePostImages, useEditProfile, useDogManagement, useChangePassword
│   ├── pages/              # Login, Signup, PostList, PostDetail, NewPost, EditPost,
│   │                       # MyPage, AdminDashboard, NotFound
│   ├── components/        # Header, SplashScreen, ProtectedRoute, PostCard, DogProfileBanner,
│   │                       # Login/, Signup/, ChangePassword/, NewPost/, PostDetail/, PostList/,
│   │                       # EditPost/, EditProfile/, MyPage/(BlockManagement, DogManagement, ProfileEdit, PasswordEdit)
│   ├── store/usePostStore.ts
│   ├── scripts/           # fetch-openapi.mjs, transform-and-generate.mjs
│   └── utils/index.js
├── vite.config.js          # React, Tailwind, proxy: /api → 8000, /upload → 8000
├── package.json
└── README.md
```
98
---

## 실행 방법

### 1. 사전 준비

- **Node.js** (npm 사용)
- **백엔드 API** 실행 필요. [백엔드 README](https://github.com/kyjness/2-kyjness-community-be) 참고.

### 2. 백엔드 실행 (별도 터미널)

```bash
cd ../2-kyjness-community-be
poetry run poe run
```

- `http://localhost:8000` 에서 서버 확인 후 프론트 실행.

### 3. 프론트엔드 실행

```bash
npm install
npm run dev
```

- 브라우저 **http://localhost:5173** 접속.
- 개발 시 `/api`, `/upload` 는 Vite 프록시로 `http://localhost:8000` 에 전달됨.

### 4. 기타 스크립트

```bash
npm run build   # 프로덕션 빌드 (dist/)
npm run preview # 빌드 결과 로컬 미리보기
npm run lint    # ESLint
```

### 5. API 타입 생성 (OpenAPI Codegen, SSOT)

백엔드 스펙(`openapi.json`)에서 TypeScript 타입을 자동 생성합니다. **백엔드 기동 후** 실행하세요.

```bash
# 1) openapi.json 내려받기 (BACKEND_URL 기본값: http://localhost:8000)
npm run fetch-openapi

# 2) schema.d.ts 생성 (백엔드가 스펙을 이미 camelCase로 노출하므로 변환 없이 사용)
npm run generate-api
```

- 생성 파일: `src/api/generated/schema.d.ts`. 타입 사용: `src/api/api-types.ts`에서 `PostResponse`, `FileInfo`, `ApiResponse<T>` 등 re-export.
- **백엔드**: OpenAPI 스펙(`/v1/openapi.json`)이 실제 응답과 동일하게 **camelCase**로 노출되므로, 프론트에서는 변환 없이 `openapi.json`만으로 타입 생성합니다.

---

## API 연동

- **Prefix**: `config.js` 의 `BASE_URL` 은 개발 시 `/api/v1` (프록시로 8000 의 `/v1` 전달). 배포 시 `VITE_API_BASE_URL` 로 오버라이드.
- **인증**: Access Token(Authorization Bearer), Refresh Token(HttpOnly 쿠키). 401 시 `api/client.js` 에서 refresh 후 재시도.
- **응답**: `{ code, data, message }`. 목록은 `data.items`, 단일은 `data` 로 사용 (백엔드 PaginatedResponse·BlocksData 등과 일치).
- **문서**: 백엔드 서버 실행 후 Swagger `http://localhost:8000/docs`, ReDoc `http://localhost:8000/redoc`.

---

## 주요 흐름

1. **진입** — `main.jsx` → 스플래시(Lottie) 후 `App` → `AuthProvider`(localStorage 복원) + `Router`.
2. **라우팅** — 인증 필요 경로는 `ProtectedRoute` 로 감싸 미로그인 시 `/login` 리다이렉트.
3. **페이지** — `pages/*` 에서 hooks 로 API 호출 후 state 갱신, 컴포넌트로 렌더.
4. **API** — `api/client.js`: Axios, credentials, Bearer, 401 시 refresh·재시도, 실패 시 로그아웃·`/login`.

---

## 배포·설정

- **API 주소**: 빌드 시 `VITE_API_BASE_URL` 로 실제 API 베이스 URL 지정 (예: `https://api.example.com/v1`).
- **정적 파일**: `img/` 가 publicDir 이므로 `/imt.png`, `/anim1.json` 등으로 접근 가능.
