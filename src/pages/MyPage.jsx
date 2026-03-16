// 통합 마이페이지: 사이드바 네비게이션 + 탭별 컨텐츠.
import { useSearchParams } from 'react-router-dom';
import { Header } from '../components/Header.jsx';
import {
  ProfileEdit,
  PasswordEdit,
  DogManagement,
  BlockManagement,
} from '../components/MyPage';

const TAB_KEY = 'tab';
const TABS = [
  { key: 'profile', label: '내 정보 수정' },
  { key: 'password', label: '비밀번호 수정' },
  { key: 'dogs', label: '반려견 관리' },
  { key: 'blocks', label: '차단 관리' },
];

const VALID_KEYS = new Set(TABS.map((t) => t.key));

function getValidTab(searchTab) {
  return searchTab && VALID_KEYS.has(searchTab) ? searchTab : 'profile';
}

export function MyPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = getValidTab(searchParams.get(TAB_KEY));

  const setTab = (key) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set(TAB_KEY, key);
      return next;
    });
  };

  return (
    <Header showBackButton backHref="/posts">
      <main className="main main-top">
        <div className="mypage-layout">
          <div className="mypage-nav-wrap">
            <nav className="mypage-nav" aria-label="마이페이지 메뉴">
              <ul className="list-none m-0 p-0 flex flex-col gap-1">
                {TABS.map(({ key, label }) => (
                  <li key={key}>
                    <button
                      type="button"
                      className={`mypage-nav-btn ${activeTab === key ? 'mypage-nav-btn--active' : ''}`}
                      onClick={() => setTab(key)}
                      aria-current={activeTab === key ? 'page' : undefined}
                    >
                      {label}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="mypage-content">
            {activeTab === 'profile' && <ProfileEdit />}
            {activeTab === 'password' && <PasswordEdit />}
            {activeTab === 'dogs' && <DogManagement />}
            {activeTab === 'blocks' && <BlockManagement />}
          </div>
          <div className="mypage-spacer" aria-hidden="true" />
        </div>
      </main>
    </Header>
  );
}
