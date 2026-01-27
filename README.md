# 아무 말 대잔치 - 커뮤니티 프론트엔드

바닐라 JavaScript로 만든 간단한 커뮤니티 웹사이트입니다.  
게시글 작성, 댓글, 좋아요 등 기본적인 커뮤니티 기능을 제공합니다.

---

## 🚀 빠른 시작 (실행 방법)

### 1단계: 백엔드 서버 실행

백엔드 서버가 먼저 실행되어 있어야 합니다.

```bash
# 백엔드 프로젝트 폴더로 이동
cd ../2-kyjness-community-be

# 백엔드 서버 실행 (포트 8000)
uvicorn main:app --reload --port 8000
```

백엔드 서버가 `http://localhost:8000`에서 실행되면 다음 단계로 진행하세요.

### 2단계: 프론트엔드 실행

프론트엔드는 정적 파일이므로 간단한 웹 서버만 있으면 됩니다.

#### 방법 1: VS Code Live Server (가장 쉬움) ⭐

1. VS Code에서 이 프로젝트 폴더를 엽니다
2. `index.html` 파일을 우클릭합니다
3. **"Open with Live Server"**를 선택합니다
4. 자동으로 브라우저가 열리고 `http://127.0.0.1:5500` (또는 다른 포트)에서 실행됩니다

> **참고**: Live Server 확장이 설치되어 있지 않다면 VS Code 확장 마켓에서 "Live Server"를 검색해 설치하세요.

#### 방법 2: Python 내장 서버

```bash
# Python 3가 설치되어 있어야 합니다
python -m http.server 8080
```

브라우저에서 `http://localhost:8080` 접속

#### 방법 3: Node.js http-server

```bash
# http-server 설치 (최초 1회만)
npm install -g http-server

# 서버 실행
http-server . -p 8080
```

브라우저에서 `http://localhost:8080` 접속

---

## 📁 폴더 구조

프로젝트는 다음과 같이 구성되어 있습니다:

```
2-kyjness-community-fe/
│
├── index.html          # 메인 HTML 파일 (이것 하나만 사용)
│
├── css/               # 스타일 파일
│   ├── base.css      # 기본 스타일 (리셋, 폰트, 색상 등)
│   └── app.css       # 앱 전용 스타일
│
├── img/               # 이미지·로티 애니 리소스
│   ├── anim1.json, anim2.json, anim3.json  # 스플래시 로티
│   └── imt.png       # 기본 프로필 이미지
│
└── js/                # JavaScript 파일
    │
    ├── main.js       # 시작점 (앱 초기화)
    ├── router.js     # 페이지 이동 관리 (#/login, #/posts 등)
    ├── api.js        # 백엔드 API 호출
    ├── state.js      # 로그인 상태 관리
    ├── constants.js  # 상수 (API 주소, 기본 이미지 등)
    ├── utils.js      # 공통 함수 (날짜 포맷, 에러 표시 등)
    │
    ├── pages/        # 각 페이지 파일
    │   ├── login.js          # 로그인 페이지
    │   ├── signup.js         # 회원가입 페이지
    │   ├── postList.js       # 게시글 목록
    │   ├── postDetail.js     # 게시글 상세보기
    │   ├── newPost.js        # 게시글 작성
    │   ├── editPost.js       # 게시글 수정
    │   ├── editProfile.js    # 프로필 수정
    │   └── changePassword.js # 비밀번호 변경
    │
    └── components/    # 재사용 가능한 UI 컴포넌트
        ├── header.js      # 상단 헤더 (프로필 메뉴 포함)
        ├── postCard.js    # 게시글 카드
        └── commentlist.js # 댓글 목록
```

### 주요 파일 설명

- **`index.html`**: 실제로 보이는 HTML은 이것 하나뿐입니다. 나머지 화면은 JavaScript로 동적으로 만들어집니다.
- **`js/main.js`**: 앱이 시작될 때 가장 먼저 실행되는 파일입니다.
- **`js/router.js`**: URL 주소(`#/posts`, `#/login` 등)를 보고 어떤 페이지를 보여줄지 결정합니다.
- **`js/api.js`**: 백엔드 서버와 통신하는 함수들이 모여있습니다.
- **`js/pages/`**: 각 페이지(로그인, 게시글 목록 등)를 만드는 파일들입니다.
- **`js/components/`**: 여러 페이지에서 공통으로 사용하는 작은 UI 조각들입니다.

---

## ✨ 주요 기능

### 🔐 인증
- **회원가입**: 이메일, 비밀번호, 닉네임으로 계정 생성
- **로그인**: 이메일과 비밀번호로 로그인
- **로그아웃**: 로그인 상태 해제
- **자동 로그인 유지**: 새로고침해도 로그인 상태 유지

### 📝 게시글
- **목록 보기**: 모든 게시글을 카드 형태로 보기
- **상세 보기**: 게시글 내용, 댓글, 좋아요 확인
- **작성**: 제목과 내용으로 새 게시글 작성
- **수정**: 내가 작성한 게시글 수정
- **삭제**: 내가 작성한 게시글 삭제

### 💬 댓글
- **댓글 보기**: 게시글에 달린 댓글 목록 보기
- **댓글 작성**: 게시글에 댓글 달기
- **댓글 수정**: 내가 작성한 댓글 수정
- **댓글 삭제**: 내가 작성한 댓글 삭제

### ❤️ 좋아요
- **좋아요 추가/취소**: 게시글에 좋아요 누르기

### 👤 프로필
- **프로필 수정**: 닉네임, 프로필 이미지 변경
- **비밀번호 변경**: 비밀번호 변경

---

## 🔧 설정 변경

### API 주소 변경

백엔드 서버 주소를 변경하려면 `js/constants.js` 파일을 수정하세요:

```javascript
// js/constants.js
export const BASE_URL = 'http://localhost:8000'; // 여기를 변경
```

### 개발 모드

개발 중에는 인증 체크를 건너뛰고 싶을 수 있습니다. `js/constants.js`에서 설정할 수 있습니다:

```javascript
// js/constants.js
export const DEV_MODE = true; // true: 인증 체크 안 함, false: 인증 체크 함
```

**주의**: 배포·제출할 때는 반드시 `DEV_MODE`를 `false`로 바꾸세요. 그렇지 않으면 인증이 생략되고, API 실패 시 더미 데이터가 노출됩니다.

---

## 🛠 기술 스택

- **HTML5**: 웹 페이지 구조
- **CSS3**: 스타일링
- **JavaScript (ES6+)**: 모든 기능 구현
  - ES Modules (`import`/`export`)
  - `async`/`await` (비동기 처리)
  - `fetch` API (서버 통신)
- **백엔드**: FastAPI (Python)

---

## 📝 코드 작성 규칙

1. **모든 JavaScript는 ES Modules 사용** (`import`/`export`)
2. **API 호출은 반드시 `api.js`를 통해** (`fetch` 직접 사용 금지)
3. **상수는 `constants.js`에 정의** (하드코딩 금지)
4. **공통 함수는 `utils.js`에 정의** (중복 코드 방지)
5. **컴포넌트는 재사용 가능하게** 작성

---

## ❓ 문제 해결

### 백엔드 서버에 연결할 수 없습니다

1. 백엔드 서버가 실행 중인지 확인하세요 (`http://localhost:8000`)
2. `js/constants.js`의 `BASE_URL`이 올바른지 확인하세요
3. 브라우저 콘솔(F12)에서 에러 메시지를 확인하세요

### 페이지가 제대로 표시되지 않습니다

1. 브라우저 콘솔(F12)에서 JavaScript 에러를 확인하세요
2. Live Server가 제대로 실행 중인지 확인하세요
3. `index.html`을 직접 열지 말고 웹 서버를 통해 열어야 합니다

### 로그인이 안 됩니다

1. 백엔드 서버가 실행 중인지 확인하세요
2. `DEV_MODE`가 `true`로 설정되어 있으면 인증 없이도 접근 가능합니다
3. 브라우저 콘솔에서 에러 메시지를 확인하세요

---

## 📄 라이선스

MIT License

---

## 👥 기여

이 프로젝트는 학습 목적으로 제작되었습니다.  
버그 리포트나 개선 제안은 이슈로 등록해주세요!
