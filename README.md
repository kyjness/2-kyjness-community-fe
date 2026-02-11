# PuppyTalk - 커뮤니티 프론트엔드

바닐라 JavaScript로 만든 커뮤니티 웹 프론트엔드입니다.  
회원가입, 게시글, 댓글, 좋아요, 프로필 수정 등 기능을 제공하며, 백엔드 API(`2-kyjness-community-be`)와 통신합니다.

---

## 기능

| 기능 | 설명 |
|------|------|
| **인증** | 회원가입, 로그인, 로그아웃. 로그인 상태는 `localStorage`(표시용)와 쿠키(실제 인증)로 유지 |
| **게시글** | 목록, 상세, 작성, 수정, 삭제 |
| **댓글** | 보기, 작성, 수정, 삭제 |
| **좋아요** | 게시글 좋아요 추가/취소 |
| **프로필** | 닉네임·프로필 이미지 수정, 비밀번호 변경 |

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
│  ① 앱 진입 (DOMContentLoaded)                                        │
│     └─ main.js: 스플래시(Lottie) → initApp()                         │
│     └─ restoreUser(): localStorage에서 로그인 정보 복원 (표시용)       │
│     └─ initRouter(): hashchange 리스너 등록, route() 호출             │
│                                                                      │
│  ② 라우터 (router.js)                                                 │
│     └─ parseHash(): #/posts/123 → { path: '/posts/:id', params }      │
│     └─ 인증: authRequiredRoutes 포함 시 isLoggedIn() 확인 → /login    │
│     └─ Lazy Loading: routeLoaders[path]() → import('./pages/...')     │
│     └─ 페이지 렌더: mod.renderXXX(params)                             │
│                                                                      │
│  ③ 페이지 (pages/*.js)                                                │
│     └─ root.innerHTML = renderHeader() + 콘텐츠                       │
│     └─ 이벤트 바인딩 (attach*Events)                                  │
│     └─ api.get() 등 호출 → 데이터 수신 후 DOM 갱신                    │
│                                                                      │
│  ④ API (api.js)                                                       │
│     └─ fetch(BASE_URL + endpoint, { credentials: 'include' })         │
│     └─ 401 시: clearUser() + navigateTo('/login')                     │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
    │
    ▼
[화면 갱신]
```

### 2. 설계 배경

| 선택 | 이유 |
|------|------|
| **SPA + CSR** | 서버 없이 정적 파일만으로 동작. 해시(`#/posts`) 변경 시 `hashchange`로 화면 전환. 브라우저에서 DOM을 직접 구성해 새로고침 없이 전환 |
| **main.js / router.js 분리** | `main.js`는 부트스트랩(스플래시, restoreUser, initRouter, 전역 에러 핸들러). `router.js`는 라우팅 전담. 진입점과 라우팅 책임 분리 |
| **인증은 라우터에서** | editProfile, changePassword, editPost 등 인증 필요 페이지가 많을 때, 각 페이지에 검사 로직을 두면 중복 발생. `authRequiredRoutes`에서 한 번만 검사해 일관되게 보호 |
| **페이지별 Lazy Loading** | `routeLoaders[path]()`로 해당 경로 페이지만 `import()`. 초기 번들 부담 감소 |
| **페이지 = 렌더 + 이벤트** | `root.innerHTML`로 DOM 구성 후 `attach*Events()`로 이벤트 바인딩. 한 파일에서 렌더와 동작을 함께 관리 |

### 3. 계층 역할

| 계층 | 역할 |
|------|------|
| main.js | 앱 진입점, 부트스트랩 |
| Router | 해시 라우팅, 인증 검사, Lazy Loading |
| Pages | 화면 렌더링, 이벤트 바인딩 |
| API | fetch 래퍼, credentials 포함, 401 처리 |
| State | 로그인 상태 (표시용) |
| Components | header, postCard 등 재사용 UI |

### 4. 프론트 ↔ 백엔드

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
├── index.html
│
├── css/
│   ├── base.css      # 리셋, 폰트, 폼, 버튼, 헤더, 모달
│   └── app.css       # 목록, 상세, 회원정보수정, 작성, 반응형
│
├── img/
│   ├── anim1.json, anim2.json, anim3.json   # 스플래시 Lottie
│   └── imt.png       # 기본 프로필 이미지
│
└── js/
    ├── main.js       # 앱 진입점 (스플래시 → restoreUser, initRouter, 에러 핸들러)
    ├── router.js     # 해시 라우팅, 인증, Lazy Loading
    ├── api.js        # fetch 래퍼, credentials 포함
    ├── state.js      # 로그인 상태 (localStorage)
    ├── constants.js  # BASE_URL, DEV_MODE 등
    ├── utils.js      # 날짜 포맷, 에러 메시지 등
    ├── dummyData.js  # DEV_MODE 시 예시 데이터
    │
    ├── pages/
    │   ├── login.js
    │   ├── signup.js
    │   ├── postList.js
    │   ├── postDetail.js
    │   ├── newPost.js
    │   ├── editPost.js
    │   ├── editProfile.js
    │   └── changePassword.js
    │
    └── components/
        ├── header.js
        └── postCard.js
```

---

## 설정

### API 주소

`js/constants.js`:

```javascript
export const BASE_URL = 'http://localhost:8000';
```

### 개발 모드 (DEV_MODE)

`js/constants.js`에서 `DEV_MODE`가 `true`이면:
- API 실패 시 목록·상세·수정 페이지에서 예시(더미) 데이터를 보여줌
- **라우터 인증 검사 생략** – 비로그인 상태에서도 프로필 수정, 게시글 작성/수정 등 인증 필요 페이지 접근 가능 (개발·테스트용)

배포 시 `false`로 설정하면 인증 검사와 더미 데이터가 활성화됩니다.

```javascript
export const DEV_MODE = false;  // 배포 시 false
```

---

## 문제 해결

| 현상 | 확인 사항 |
|------|-----------|
| API 연결 안 됨 | 1) 백엔드 `http://localhost:8000` 실행 여부 2) `BASE_URL` 일치 여부 3) 백엔드 CORS에 프론트 주소 포함 여부 |
| 화면 안 뜸 | 1) 웹 서버로 열었는지 (파일 직접 열기 X) 2) 브라우저 콘솔(F12) 에러 확인 |
| 로그인 안 됨 | 1) 백엔드 실행 여부 2) API 호출에 `credentials: 'include'` 포함 여부 |
