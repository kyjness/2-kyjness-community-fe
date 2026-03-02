# PuppyTalk Frontend

**PuppyTalk** 커뮤니티의 웹 프론트엔드입니다. 바닐라 JavaScript 기반 SPA로, 회원가입·게시글·댓글·좋아요·프로필 수정 등 기능을 제공하며 백엔드 API [**PuppyTalk Backend**](https://github.com/kyjness/2-kyjness-community-be)와 통신합니다.

- **백엔드**: [2-kyjness-community-be](https://github.com/kyjness/2-kyjness-community-be)
- **인프라·배포**: Docker Compose, EC2 등 배포 정의는 [**PuppyTalk Infra**](https://github.com/kyjness/2-kyjness-community-infra) 레포에서 관리합니다. Docker로 전체 스택 실행 시 해당 레포 README를 참고하세요.

---

## 개요

### 기술 스택

| 구분 | 기술 |
|------|------|
| **렌더링** | CSR (Client-Side Rendering) – 브라우저에서 JS로 DOM 생성 |
| **아키텍처** | SPA (Single Page Application) – 단일 HTML, 해시 라우팅으로 화면 전환 |
| **프론트** | HTML5, CSS3, JavaScript (ES6+, ES Modules, `async/await`, `fetch`) |
| **브라우저** | ES Modules 지원 브라우저 (Chrome, Firefox, Safari, Edge 최신 버전) |

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
├── js/
│   ├── main.js             # 앱 진입점 (스플래시 → 라우터 초기화)
│   ├── config.js           # API 주소 등 설정 (BASE_URL에 /v1 포함)
│   ├── router.js           # 해시 라우팅, 인증 검사, 페이지 로드
│   ├── api.js              # API 호출 (fetch 래퍼, 401 시 로그인 이동)
│   ├── state.js            # 로그인 상태 관리
│   ├── utils.js            # 날짜 포맷, 에러 메시지, 입력 검증(제목/내용/비밀번호/닉네임) 등
│   │
│   ├── pages/              # 화면별 페이지
│   │   ├── login.js        # 로그인
│   │   ├── signup.js       # 회원가입
│   │   ├── postList.js     # 게시글 목록 (무한 스크롤)
│   │   ├── postDetail.js   # 게시글 상세 (댓글, 좋아요, 수정·삭제)
│   │   ├── newPost.js      # 게시글 작성
│   │   ├── editPost.js     # 게시글 수정
│   │   ├── editProfile.js  # 회원정보 수정
│   │   └── changePassword.js   # 비밀번호 변경
│   │
│   └── components/         # 재사용 컴포넌트
│       ├── header.js       # 공통 헤더
│       └── postCard.js     # 게시글 카드
│
├── Dockerfile              # 정적 파일 nginx 서빙 (빌드 시 API_BASE_URL 인자로 config 치환)
└── README.md
```

---

## 설계 포인트

| 선택 | 이유 |
|------|------|
| **SPA + CSR** | 빈번한 상태 변화(글·댓글·좋아요)가 발생하는 커뮤니티 특성상, 사용자 경험(UX) 극대화를 위해 무정전 화면 전환이 가능한 SPA 구조를 채택했습니다. 또한 빌드 결과물을 정적 자산(Static Assets)으로 관리하여 서버 런타임 의존성을 제거하고 배포 효율을 높였습니다. |
| **main.js / router.js 분리** | 애플리케이션의 진입점(Entry Point)과 네비게이션 로직을 분리하는 **관심사 분리(SoC)**를 실천했습니다. 이를 통해 라우팅 규칙 변경 시 영향 범위를 최소화하고 코드의 가독성과 유지보수성을 확보했습니다. |
| **인증은 라우터에서** | 보안이 필요한 경로에 대해 중앙 집중형 접근 제어(Navigation Guard)를 구현했습니다. 개별 페이지가 아닌 라우터 레벨에서 인증 상태를 일괄 검증함으로써 보안 누락을 방지하고 일관된 권한 관리 정책을 유지합니다. |
| **페이지별 Lazy Loading** |초기 번들 크기를 최소화하여 **첫 페이지 로딩 속도(LCP)**를 개선했습니다. 사용자가 요청하는 시점에 필요한 모듈만 동적으로 로드(Dynamic Import)함으로써 불필요한 리소스 낭비를 줄이고 초기 구동 성능을 최적화했습니다. |
| **쿠키-세션 연동** | J클라이언트 측의 보안 취약점(XSS)을 고려하여, 민감한 인증 정보를 브라우저 저장소가 아닌 HttpOnly 쿠키 기반의 세션 시스템으로 연동했습니다. 프론트엔드는 자격 증명(Credentials) 전달에만 집중하여 보안과 편의성을 동시에 충족했습니다. |

---

## API 연동

- **Prefix**: 모든 API는 `/v1` 사용. `config.js`의 `BASE_URL`에 `/v1` 포함.
- **상세 문서**: 백엔드 저장소 README 또는 서버 실행 후 **Swagger UI** (`http://localhost:8000/docs`), **ReDoc** (`http://localhost:8000/redoc`) 참고.

| 항목 | 프론트 | 백엔드 |
|------|--------|--------|
| 인증 | 상태는 표시용, 실제 인증은 쿠키 기준 | `session_id` 쿠키로 사용자 식별 |
| API | `credentials: 'include'`로 쿠키 전송 | CORS credentials 허용 |
| 응답 | `{ code, data }` 파싱 | `{ code, data }` 형식 |
| 미디어 | 이미지 업로드 후 `imageId`를 회원가입·프로필·게시글 요청에 사용 | `POST /v1/media/images?type=profile\|post` → `imageId`, `url` 반환 |
| 게시글 목록 | 스크롤 시 `page` 증가, `response.hasMore`로 추가 로드 여부 판단 | `GET /v1/posts?page=&size=` → `{ data: 목록 배열, hasMore }` |
| 댓글 목록 | `GET /v1/posts/{id}/comments?page=&size=10`, 페이지 번호 버튼으로 전환 | `response.data`: `{ list, totalCount, totalPages, currentPage }` |

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
│     → fetch(BASE_URL + endpoint, { credentials: 'include' }). BASE_URL에 /v1 포함. │
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

- **백엔드 API** 실행 중이어야 함. 실행·설정은 **`2-kyjness-community-be` README** 참고.
- **Docker로 전체 스택(백엔드+프론트) 실행** 시 [**인프라 레포(2-kyjness-community-infra)**](https://github.com/kyjness/2-kyjness-community-infra) README를 참고하세요.
- **웹 서버**로 정적 파일 서빙 필요. (`file://` 직접 열기는 CORS·ES Modules 이슈로 동작 안 할 수 있음)

### 2. 백엔드 실행

- **참고**: [2-kyjness-community-be README](https://github.com/kyjness/2-kyjness-community-be) (실행·환경 변수·DB)
- **확인**: `http://localhost:8000`에서 서버 떠 있으면 다음 단계 진행

### 3. 프론트엔드 실행

Node.js 불필요. 아래 중 하나로 정적 파일 서빙.

**VS Code Live Server (권장)**

1. 프로젝트 폴더 열기
2. `index.html` 우클릭 → **Open with Live Server**
3. 표시된 주소(예: `http://127.0.0.1:5500`)로 접속

**Python**

```bash
cd 2-kyjness-community-fe
python -m http.server 8080
```

### 4. 설정

- **배포**: `js/config.js`에서 `BASE_URL`을 실제 API 주소로 수정 (예: `http://api.example.com/v1`)
- **Docker 빌드**: `API_BASE_URL` 인자로 config 치환 가능. `config.js` 주석·Dockerfile 참고

---
