// 로그인 폼: 이메일·비밀번호 필드, formError, 로그인/회원가입 버튼.
export function LoginForm({
  email,
  password,
  emailError,
  passwordError,
  formError,
  submitting,
  onSubmit,
  onEmailChange,
  onPasswordChange,
  onSignupClick,
}) {
  return (
    <form onSubmit={onSubmit} className="form" noValidate>
      <div className="form-group">
        <label htmlFor="login-email" className="form-label">
          이메일
        </label>
        <input
          type="email"
          id="login-email"
          value={email}
          onChange={onEmailChange}
          className="form-input"
          placeholder="이메일을 입력하세요"
          required
          autoComplete="email"
          aria-invalid={!!emailError}
          aria-describedby={emailError ? 'login-email-error' : undefined}
        />
        {emailError && (
          <span className="helper-text has-error" id="login-email-error" role="alert">
            * {emailError}
          </span>
        )}
      </div>
      <div className="form-group">
        <label htmlFor="login-password" className="form-label">
          비밀번호
        </label>
        <input
          type="password"
          id="login-password"
          value={password}
          onChange={onPasswordChange}
          className="form-input"
          placeholder="비밀번호를 입력하세요"
          required
          autoComplete="current-password"
          aria-invalid={!!passwordError || !!formError}
          aria-describedby={
            passwordError ? 'login-password-error' : formError ? 'login-form-error' : undefined
          }
        />
        {passwordError && (
          <span className="helper-text has-error" id="login-password-error" role="alert">
            * {passwordError}
          </span>
        )}
      </div>
      {formError && (
        <span className="helper-text has-error" id="login-form-error" role="alert">
          * {formError}
        </span>
      )}
      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? '로그인 중...' : '로그인'}
      </button>
      <button type="button" className="btn btn-secondary" onClick={onSignupClick}>
        회원가입
      </button>
    </form>
  );
}
