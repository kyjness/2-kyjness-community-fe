// 로그인 페이지: useLogin 훅 + LoginForm 조합.
import { Header } from '../components/Header.jsx';
import { useLogin } from '../hooks/useLogin.js';
import { LoginForm } from '../components/Login';

export function Login() {
  const {
    email,
    password,
    emailError,
    passwordError,
    formError,
    submitting,
    isLoggedIn,
    from,
    navigate,
    handleSubmit,
    handleEmailChange,
    handlePasswordChange,
  } = useLogin();

  if (isLoggedIn) {
    navigate(from, { replace: true });
    return null;
  }

  return (
    <Header showProfile={false}>
      <main className="main">
        <div className="form-container">
          <h2 className="form-title">로그인</h2>
          <LoginForm
            email={email}
            password={password}
            emailError={emailError}
            passwordError={passwordError}
            formError={formError}
            submitting={submitting}
            onSubmit={handleSubmit}
            onEmailChange={handleEmailChange}
            onPasswordChange={handlePasswordChange}
            onSignupClick={() => navigate('/signup')}
          />
        </div>
      </main>
    </Header>
  );
}
