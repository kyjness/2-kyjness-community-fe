# PuppyTalk Frontend (Legacy — Vanilla JavaScript)

이 폴더는 **리액트 전환 전**, 순수 자바스크립트로 구현된 프로젝트의 초기 버전입니다.  
현재 주력 프론트엔드는 **프로젝트 루트**의 React + Vite 앱이며, 여기 있는 코드는 과거 구현체 참고용으로만 보존되어 있습니다.

---

**이 프로젝트(레거시)** 는 **PuppyTalk** 커뮤니티의 웹 프론트엔드를 바닐라 JavaScript 기반 SPA로 구현한 것입니다. 회원가입·게시글·댓글·좋아요·프로필 수정 등 기능을 제공하며, 백엔드 API [**PuppyTalk Backend**](https://github.com/kyjness/2-kyjness-community-be)와 통신합니다.

- **백엔드**: [2-kyjness-community-be](https://github.com/kyjness/2-kyjness-community-be)
- **인프라·배포**: [**PuppyTalk Infra**](https://github.com/kyjness/2-kyjness-community-infra) 레포 참고.

---

## 개요

### 기술 스택

| 구분 | 기술 |
|------|------|
| **렌더링** | CSR (Client-Side Rendering) – 브라우저에서 JS로 DOM 생성 |
| **아키텍처** | SPA (Single Page Application) – 단일 HTML, 해시 라우팅으로 화면 전환 |
| **프론트** | HTML5, CSS3, JavaScript (ES6+, ES Modules, `async/await`, `fetch`) |
| **브라우저** | ES Modules 지원 브라우저 (Chrome, Firefox, Safari, Edge 최신 버전) |

---

## 폴더 구조 (이 폴더 기준)

```
legacy-vanilla-js/
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
│   ├── config.js            # API 주소 등 설정 (BASE_URL에 /v1 포함)
│   ├── router.js            # 해시 라우팅, 인증 검사, 페이지 로드
│   ├── api.js               # API 호출 (fetch 래퍼, 401 시 로그인 이동)
│   ├── state.js             # 로그인 상태 관리
│   ├── utils.js             # 날짜 포맷, 에러 메시지, 입력 검증(제목/내용/비밀번호/닉네임) 등
│   ├── pages/               # 화면별 페이지
│   │   ├── login.js, signup.js, postList.js, postDetail.js
│   │   ├── newPost.js, editPost.js, editProfile.js, changePassword.js
│   │   └── ...
│   ├── components/          # 재사용 컴포넌트
│   │   ├── header.js
│   │   └── postCard.js
│   └── modules/            # 기타 모듈
│
└── README.md                # 이 파일
```

---

## API 연동

- **Prefix**: 모든 API는 `/v1` 사용. `js/config.js`의 `BASE_URL`에 `/v1` 포함.
- **상세 문서**: 백엔드 저장소 README 또는 Swagger UI (`http://localhost:8000/docs`), ReDoc (`http://localhost:8000/redoc`) 참고.

| 항목 | 프론트 | 백엔드 |
|------|--------|--------|
| 인증 | 상태는 표시용, 실제 인증은 쿠키 기준 | `session_id` 쿠키로 사용자 식별 |
| API | `credentials: 'include'`로 쿠키 전송 | CORS credentials 허용 |
| 응답 | `{ code, data }` 파싱 | `{ code, data }` 형식 |
| 미디어 | 이미지 업로드 후 `imageId`를 회원가입·프로필·게시글 요청에 사용 | `POST /v1/media/images?type=profile|post` → `imageId`, `url` 반환 |

---

## 실행 방법

1. **백엔드 API**가 `http://localhost:8000`에서 실행 중이어야 합니다.
2. **정적 파일 서빙**이 필요합니다. (`file://` 직접 열기는 CORS·ES Modules 이슈로 동작하지 않을 수 있음)

**예: VS Code Live Server**

- 이 폴더(`legacy-vanilla-js`)를 연 뒤 `index.html` 우클릭 → **Open with Live Server**
- 표시된 주소(예: `http://127.0.0.1:5500`)로 접속

**예: Python**

```bash
cd legacy-vanilla-js
python -m http.server 8080
```

- 브라우저에서 `http://localhost:8080` 접속

3. **설정**: `js/config.js`에서 `BASE_URL`을 실제 API 주소로 수정 (예: `http://localhost:8000/v1`).
