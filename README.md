# PuppyTalk - 커뮤니티 프론트엔드

바닐라 JavaScript로 만든 커뮤니티 웹 프론트엔드입니다.  
회원가입, 게시글, 댓글, 좋아요, 프로필 수정 등 기능을 제공하며, 백엔드 API(`2-kyjness-community-be`)와 통신합니다.

---

## 이 앱이 하는 일

| 기능 | 설명 |
|------|------|
| **인증** | 회원가입, 로그인, 로그아웃. 로그인 상태는 `localStorage`와 쿠키로 유지됩니다. |
| **게시글** | 목록 보기, 상세 보기, 작성, 수정, 삭제 |
| **댓글** | 댓글 보기, 작성, 수정, 삭제 |
| **좋아요** | 게시글에 좋아요 추가/취소 |
| **프로필** | 닉네임·프로필 이미지 수정, 비밀번호 변경 |

---

## 사용 기술

- **HTML5, CSS3** – 페이지 구조와 스타일
- **JavaScript (ES6+)** – ES Modules, `async/await`, `fetch` API
- **백엔드** – FastAPI (PuppyTalk API)

---

## 실행 방법

### 1. 백엔드 서버 실행

프론트엔드는 백엔드 API를 호출하므로, **백엔드가 먼저 실행**되어 있어야 합니다.

```bash
cd ../2-kyjness-community-be
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

백엔드가 `http://localhost:8000`에서 떠 있으면 다음 단계로 진행하세요.

### 2. 프론트엔드 실행

프론트엔드는 정적 파일이므로 웹 서버로 띄우면 됩니다.

**방법 1: VS Code Live Server (권장)**

1. VS Code에서 이 프로젝트 폴더를 엽니다
2. `index.html` 우클릭 → **Open with Live Server**
3. 브라우저에서 `http://127.0.0.1:5500` (또는 표시된 주소)로 열립니다

> Live Server 확장이 없다면 VS Code 확장 마켓에서 "Live Server"를 검색해 설치하세요.

**방법 2: Python 내장 서버**

```bash
python -m http.server 8080
```

브라우저에서 `http://localhost:8080` 접속

**방법 3: Node.js http-server**

```bash
npm install -g http-server
http-server . -p 8080
```

브라우저에서 `http://localhost:8080` 접속

> `index.html`을 파일로 직접 열면 CORS·모듈 로딩 문제가 생길 수 있습니다. 반드시 웹 서버를 통해 열어주세요.

---

## 요청·화면이 처리되는 흐름 (전체 아키텍처)

사용자 동작부터 화면 렌더링·API 호출까지, 어떤 순서로 어떤 개념이 적용되는지 정리했습니다.

### 1. 전체 흐름도

```
[사용자]  클릭, 폼 제출, URL 직접 입력 등
    │
    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  프론트엔드 (Vanilla JS SPA)                                             │
│                                                                         │
│  ① 앱 진입 (DOMContentLoaded)                                           │
│     └─ main.js: 스플래시(Lottie) → initApp()                             │
│     └─ restoreUser(): localStorage에서 로그인 정보 복원 (표시용)          │
│     └─ initRouter(): hashchange 리스너 등록, route() 호출                │
│                                                                         │
│  ② 라우터 (router.js)                                                    │
│     └─ parseHash(): #/posts/123 → { path: '/posts/:id', params: {id:'123'} }
│     └─ 인증 체크: authRequiredRoutes 포함 시 isLoggedIn() 확인            │
│     └─ Lazy Loading: routeLoaders[path]() → import('./pages/postDetail.js') │
│     └─ 페이지 렌더: mod.renderPostDetail(params)                         │
│                                                                         │
│  ③ 페이지 (pages/*.js)                                                   │
│     └─ root.innerHTML = renderHeader() + main 콘텐츠                     │
│     └─ initHeaderEvents(), attachPostListEvents() 등 이벤트 바인딩       │
│     └─ api.get('/posts') 등 API 호출 → 데이터 수신 후 DOM 갱신           │
│                                                                         │
│  ④ API 클라이언트 (api.js)                                               │
│     └─ fetch(BASE_URL + endpoint, { credentials: 'include' })            │
│     └─ 401 시: clearUser() + navigateTo('/login')                        │
│     └─ 응답: { code, data } 파싱 후 반환                                 │
│                                                                         │
│  ⑤ 백엔드 API (2-kyjness-community-be)                                   │
│     └─ 쿠키 포함 요청 처리 → JSON 응답                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
    │
    ▼
[화면 갱신]  사용자가 결과 확인
```

### 2. 계층별 역할

| 계층 | 역할 |
|------|------|
| SPA | 단일 HTML에서 JS로 화면 전환 |
| Router | 해시 라우팅, 인증 필요 여부 판단 |
| Pages | 화면 렌더링 및 이벤트 바인딩 |
| API Client | `fetch` 래퍼, 쿠키 포함 요청 |
| State | 로그인 상태 관리(표시용) |
| Components | 재사용 UI 조각 |

### 3. 요청·화면 처리 예시 (게시글 목록)

- 라우팅: `#/posts` 접근 시 목록 페이지로 전환
- 렌더링: 목록 화면 구성 및 이벤트 바인딩
- 처리: `GET /posts` 호출 후 응답으로 화면 갱신
- 이동: 게시글 클릭 시 상세 페이지로 이동

### 4. 요청·화면 처리 예시 (로그인 후 게시글 작성)

- 로그인: 폼 제출 → `POST /auth/login` 호출
- 인증: 서버 세션 생성 후 `session_id` 쿠키 설정
- 상태: 로그인 응답으로 프론트 상태(표시용) 업데이트
- 이동: 게시글 목록 페이지로 이동
- 작성: 작성 페이지 진입 후 폼 제출
- 처리: `POST /posts` 호출 → 서버 인증 후 게시글 생성
- 응답: 성공 시 목록 또는 상세로 이동

### 5. 프론트·백엔드 연결 요약

| 개념 | 프론트엔드 | 백엔드 |
|------|------------|--------|
| 인증 | 상태는 표시용, 실제 인증은 쿠키 기준 | `session_id`로 사용자 식별 |
| API 호출 | 모든 요청에 `credentials: 'include'` 포함 | CORS에서 credentials 허용 |
| 응답 형식 | `{ code, data }` 기준 분기 처리 | `{ code, data }` 형식 통일 |

---

## 폴더 구조

```
2-kyjness-community-fe/
│
├── index.html              # 메인 HTML (SPA 기반, 이 파일 하나로 모든 화면 렌더)
│
├── css/
│   ├── base.css            # 공통 스타일 (리셋, 폰트, 폼, 버튼, 헤더, 모달 등)
│   └── app.css             # 페이지/컴포넌트 전용 (목록, 상세, 회원정보수정, 작성, 반응형)
│
├── img/                    # 정적 이미지·애니메이션
│   ├── anim1.json, anim2.json, anim3.json  # 스플래시 Lottie
│   └── imt.png             # 기본 프로필 이미지
│
└── js/
    ├── main.js             # 앱 진입점 (초기화)
    ├── router.js           # 라우팅 (#/login, #/posts, #/posts/1 등)
    ├── api.js              # 백엔드 API 호출 (fetch, credentials: 'include')
    ├── state.js            # 로그인 상태 관리 (localStorage)
    ├── constants.js        # 상수 (BASE_URL, DEFAULT_PROFILE_IMAGE, DEV_MODE)
    ├── utils.js            # 공통 함수 (날짜 포맷, 에러 메시지 표시)
    │
    ├── pages/              # 페이지별 렌더 로직
    │   ├── login.js        # 로그인
    │   ├── signup.js       # 회원가입
    │   ├── postList.js     # 게시글 목록
    │   ├── postDetail.js   # 게시글 상세
    │   ├── newPost.js      # 게시글 작성
    │   ├── editPost.js     # 게시글 수정
    │   ├── editProfile.js  # 프로필 수정
    │   └── changePassword.js # 비밀번호 변경
    │
    └── components/         # 재사용 UI 컴포넌트
        ├── header.js       # 상단 헤더 (프로필 메뉴)
        ├── postCard.js     # 게시글 카드
```

**파일 역할**

| 파일 | 역할 |
|------|------|
| `index.html` | 단일 HTML. 화면 전환은 JavaScript가 `#` 해시 라우팅으로 처리 |
| `main.js` | 앱 시작 시 라우터·이벤트 초기화 |
| `router.js` | `#/posts`, `#/login` 등 URL에 따라 해당 페이지 렌더 |
| `api.js` | 백엔드 호출. 모든 요청에 `credentials: 'include'`로 쿠키 포함 |

---

## 설정

### API 주소

백엔드 주소를 바꾸려면 `js/constants.js`를 수정하세요.

```javascript
export const BASE_URL = 'http://localhost:8000';
```

### 개발 모드 (DEV_MODE)

`js/constants.js`에서 `DEV_MODE`를 `true`로 두면 인증 없이 페이지 접근이 가능합니다. (테스트용)

```javascript
export const DEV_MODE = false;  // 배포 시 반드시 false로 설정
```

---

## 문제 해결

| 현상 | 확인할 것 |
|------|------------|
| API 연결 안 됨 | 1) 백엔드가 `http://localhost:8000`에서 실행 중인지 2) `BASE_URL`이 맞는지 3) CORS_ORIGINS에 프론트 주소가 포함됐는지 |
| 화면이 안 뜸 | 1) 파일을 직접 열지 말고 웹 서버(Live Server 등)로 열었는지 2) 브라우저 콘솔(F12) 에러 확인 |
| 로그인 안 됨 | 1) 백엔드 실행 여부 2) 쿠키가 전달되려면 `credentials: 'include'`가 API 호출에 들어가는지 확인 |
