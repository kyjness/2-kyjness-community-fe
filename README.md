# PuppyTalk - 커뮤니티 프론트엔드

바닐라 JavaScript로 만든 커뮤니티 웹 프론트엔드입니다.  
회원가입, 게시글, 댓글, 좋아요, 프로필 수정 등 기능을 제공하며, 백엔드 API(`2-kyjness-community-be`)와 통신합니다.

---

## 기능

| 기능 | 설명 |
|------|------|
| **인증** | 회원가입(프로필 사진 선택 가능), 로그인, 로그아웃. 로그인 상태는 `localStorage`(표시용)와 쿠키(실제 인증)로 유지 |
| **게시글** | 목록, 상세, 작성, 수정, 삭제 |
| **댓글** | 보기, 작성, 수정, 삭제 |
| **좋아요** | 게시글 좋아요 추가/취소 |
| **프로필** | 회원가입 시 또는 회원정보수정에서 닉네임·프로필 이미지 설정, 비밀번호 변경 |

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| **렌더링** | CSR (Client-Side Rendering) – 브라우저에서 JS로 DOM 생성 |
| **아키텍처** | SPA (Single Page Application) – 단일 HTML, 해시 라우팅으로 화면 전환 |
| **프론트** | HTML5, CSS3, JavaScript (ES6+, ES Modules, `async/await`, `fetch`) |
| **백엔드** | FastAPI (PuppyTalk API) |
| **브라우저** | ES Modules 지원 브라우저 (Chrome, Firefox, Safari, Edge 최신 버전) |

---

## 실행 방법

### 1. 백엔드 실행

프론트엔드는 백엔드 API에 의존하므로 **백엔드를 먼저 실행**해야 합니다.

```bash
cd ../2-kyjness-community-be
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

`http://localhost:8000`에서 백엔드가 떠 있으면 다음 단계로 진행합니다.

### 2. 프론트엔드 실행

정적 파일이므로 웹 서버로 서빙합니다.

**VS Code Live Server (권장)**

1. 프로젝트 폴더 열기
2. `index.html` 우클릭 → **Open with Live Server**
3. `http://127.0.0.1:5500` 등 표시된 주소로 접속

**Python**

```bash
python -m http.server 8080
```

**Node.js**

```bash
npx http-server . -p 8080
```

## 아키텍처

### 1. 전체 흐름

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

### 2. 설계 배경 (선택 이유)

| 선택 | 이유 |
|------|------|
| **SPA + CSR** | 커뮤니티는 글·댓글·좋아요 등 상호작용이 빈번하므로 새로고침 없이 화면 전환이 가능한 SPA가 적합합니다. CSR은 빌드 결과만 정적 호스팅하면 되어 서버 런타임이 필요 없고, SSR은 요청마다 서버 렌더가 필요해 Node 등 운영 부담이 큽니다. 배포 단순성과 바닐라 JS 범위 유지를 위해 CSR을 선택했습니다. |
| **main.js / router.js 분리** | 진입점과 라우팅을 한 파일에 두면 파일이 비대해지고 책임이 혼재합니다. main(부트스트랩)과 router(라우팅)를 분리하여 단일 책임을 유지하고, 라우트 추가·변경 시 수정 범위를 router로 한정했습니다. |
| **인증은 라우터에서** | 인증 필요 경로가 다수일 때 페이지마다 검사하면 중복·누락이 생깁니다. 라우터에서 인증 필요 경로를 일괄 검사하여 접근 제어를 일관되게 하고, 수정 시 한 곳만 보면 되도록 했습니다. |
| **페이지별 Lazy Loading** | 전체 페이지 모듈을 초기 로드하면 첫 화면 로딩이 길어집니다. 경로 진입 시 해당 페이지만 동적 import하여 초기 로딩 시간과 번들 크기를 줄였습니다. |
| **페이지 = 렌더 + 이벤트** | 해당 화면의 렌더와 이벤트를 한 모듈에 두어, 구조와 동작을 한 곳에서 관리하고 응집도를 높였습니다. |

### 3. 프론트 ↔ 백엔드

| 항목 | 프론트 | 백엔드 |
|------|--------|--------|
| 인증 | 상태는 표시용, 실제 인증은 쿠키 기준 | `session_id` 쿠키로 사용자 식별 |
| API | `credentials: 'include'`로 쿠키 전송 | CORS credentials 허용 |
| 응답 | `{ code, data }` 파싱 | `{ code, data }` 형식 |

---

## 폴더 구조

```
2-kyjness-community-fe/
│
├── index.html              # SPA 단일 HTML, 스플래시·app-root, CSS/JS·Lottie 로드
│
├── css/
│   ├── base.css            # 리셋, 폰트, 폼, 버튼, 헤더, 모달
│   └── app.css             # 목록, 상세, 회원정보수정, 작성, 반응형
│
├── img/
│   ├── anim1.json, anim2.json, anim3.json   # 스플래시 Lottie
│   └── imt.png             # 기본 프로필 이미지
│
├── constants.js            # 전역 상수 (배포 시 BASE_URL 수정)
└── js/
    ├── main.js             # 앱 진입점, 스플래시(Lottie) → restoreUser, initRouter, 전역 에러 핸들러
    ├── router.js           # 해시 라우팅, 인증 검사, Lazy Loading(dynamic import), 404
    ├── api.js              # fetch 래퍼, credentials 포함, 401 시 clearUser·로그인 페이지 이동
    ├── state.js            # 로그인 상태(표시용), localStorage 동기화
    ├── utils.js            # 날짜 포맷, 에러 메시지, escapeHtml, safeImageUrl, clearErrors 등
    │
    ├── pages/
    │   ├── login.js        # 로그인
    │   ├── signup.js       # 회원가입 (프로필 사진 업로드 후 가입)
    │   ├── postList.js     # 게시글 목록, 무한 스크롤
    │   ├── postDetail.js   # 게시글 상세, 댓글·좋아요·수정·삭제
    │   ├── newPost.js      # 게시글 작성
    │   ├── editPost.js     # 게시글 수정
    │   ├── editProfile.js  # 회원정보 수정, 프로필 이미지·닉네임
    │   └── changePassword.js   # 비밀번호 변경
    │
    └── components/
        ├── header.js       # 공통 헤더 (뒤로가기, 제목, 프로필 드롭다운)
        └── postCard.js     # 게시글 카드 (목록용)
```

---

## 설정

배포 시 **`constants.js`**에서 `BASE_URL`만 실제 API 서버 주소로 수정하면 됩니다. 설명은 constants.js 주석을 참고하면 됩니다.

---

## 체크리스트

### 로컬 실행 시

- [ ] 백엔드(`2-kyjness-community-be`) 실행 (uvicorn 등)
- [ ] `constants.js`에 `BASE_URL`이 백엔드 주소와 일치하는지 확인
- [ ] 웹 서버로 프론트 서빙 (Live Server, `python -m http.server`, `npx http-server` 등)
- [ ] 브라우저에서 접속 (파일 직접 열기 `file://`은 CORS·모듈 이슈로 동작하지 않을 수 있음)

### 배포 전

- [ ] `constants.js`의 `BASE_URL`을 실제 API 서버 URL로 변경
- [ ] 백엔드 CORS에 배포된 프론트 URL 포함 여부 확인
