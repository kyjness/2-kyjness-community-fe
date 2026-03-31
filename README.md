# PuppyTalk Frontend

**PuppyTalk** 커뮤니티의 웹 프론트엔드입니다. React + Vite 기반 SPA로, 회원가입·게시글·댓글·좋아요·프로필·차단·관리자 기능을 제공합니다.

- **백엔드**: [PuppyTalk Backend](https://github.com/kyjness/2-kyjness-community-be)
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
├── index.html                           # SPA 엔트리 (root, Pretendard·Lottie CDN)
├── img/                                 # 정적 파일 (Vite publicDir: 'img')
│   ├── anim1.json, anim2.json, anim3.json  # 스플래시 Lottie
│   └── imt.png                          # 기본 프로필 이미지
├── legacy-vanilla-js/                   # 과거 바닐라 JS 구현체 (참고용)
├── scripts/                             # OpenAPI 스펙 fetch / 타입 생성 스크립트
├── openapi.json                         # (로컬 생성) 백엔드 OpenAPI 스펙 캐시
├── src/
│   ├── main.jsx                         # 진입점, createRoot → App
│   ├── App.jsx                          # 스플래시 후 BrowserRouter + AuthProvider + Router
│   ├── Router.jsx                       # Routes, ProtectedRoute, 401 처리
│   ├── config.js                        # BASE_URL, DEFAULT_PROFILE_IMAGE, SPLASH_ITEMS
│   ├── index.css                        # Tailwind 엔트리
│   ├── css/                             # 페이지/기능별 CSS (legacy 포함)
│   │   └── base.css                     # 공통 스타일
│   ├── api/                             # API 클라이언트 + 타입(SSOT)
│   │   ├── client.js                    # Axios 인스턴스, Silent Refresh, Bearer, credentials
│   │   ├── api-types.ts                 # ApiResponse 등 공용 타입 re-export
│   │   └── generated/schema.d.ts        # OpenAPI 기반 자동 생성 타입 (SSOT)
│   ├── context/                         # 전역 컨텍스트
│   │   └── AuthContext.jsx              # 인증 상태(Auth) 컨텍스트 (복원/갱신/클리어)
│   ├── hooks/                           # 도메인별 API 훅 (login/signup/posts/profile/admin 등)
│   ├── pages/                           # 라우트 단위 페이지 컴포넌트
│   ├── components/                      # 재사용 UI/기능 컴포넌트 (페이지 하위 포함)
│   ├── store/                           # 상태 저장소
│   │   └── usePostStore.ts              # EditPost 전용 Zustand 스토어 (로드/검증/이미지/submit)
│   └── utils/                           # 공통 유틸 (XSS escape, 날짜 포맷, 에러 메시지, 검증 등)
├── vite.config.js                       # dev proxy: /api → 8000, /upload → 8000
├── package.json                         # 스크립트(dev/build/lint/openapi) 및 의존성
└── README.md                            # 사용 방법·구조·API 연동 문서
```
---

## 실행 방법

### 1. 사전 준비

- **Node.js** (npm 사용)
- **백엔드 API** 실행 필요. [백엔드 README](https://github.com/kyjness/2-kyjness-community-be) 참고.

### 2. 백엔드 실행 (별도 터미널)

```bash
cd ../2-kyjness-community-be
uv run poe run
```

- `http://localhost:8000` 에서 서버 확인 후 프론트 실행.

### 3. 프론트엔드 실행

```bash
npm install
npm run dev
```

- 브라우저 `http://localhost:5173` 접속.
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
- **문서**: 백엔드 서버 실행 후 Swagger `http://localhost:8000/v1/docs`, ReDoc `http://localhost:8000/v1/redoc`.

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

---

## 확장 전략 (SEO·SSR/SSG 전환 계획)

현재 프론트는 React + Vite 기반 **SPA(CSR)** 로 구성되어 있습니다. 추후 **검색 유입(SEO)** 과 **초기 로딩 성능** 개선이 필요한 일부 페이지는 **Next.js 기반으로 단계적 전환**할 계획입니다.

- **대상(예시)**: 게시글 목록/상세, 공개 프로필 등 검색 노출 가치가 큰 공개 페이지
- **전환 방식**: 페이지 성격에 따라 SSR 또는 SSG/ISR 적용 (나머지 기능성 페이지는 CSR 유지)
- **마이그레이션 방향**: API 계약(OpenAPI 기반 타입, `ApiResponse` 형태)은 유지하고, 라우팅/렌더링 레이어만 점진적으로 분리·대체
