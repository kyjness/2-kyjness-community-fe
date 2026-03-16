// 회원가입 폼: 이메일·비밀번호·비밀번호 확인·닉네임 4필드.
export function SignupFormFields({ formData, errors, onFieldChange }) {
  return (
    <>
      <div className="form-group">
        <label htmlFor="email" className="form-label">
          이메일*
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className="form-input"
          placeholder="이메일을 입력하세요"
          value={formData.email}
          onChange={onFieldChange('email')}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? 'email-error' : undefined}
        />
        {errors.email && (
          <span className="helper-text has-error" id="email-error" role="alert">
            * {errors.email}
          </span>
        )}
      </div>
      <div className="form-group">
        <label htmlFor="password" className="form-label">
          비밀번호*
        </label>
        <input
          type="password"
          id="password"
          name="password"
          className="form-input"
          placeholder="비밀번호를 입력하세요"
          value={formData.password}
          onChange={onFieldChange('password')}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? 'password-error' : undefined}
        />
        {errors.password && (
          <span className="helper-text has-error" id="password-error" role="alert">
            * {errors.password}
          </span>
        )}
      </div>
      <div className="form-group">
        <label htmlFor="password-confirm" className="form-label">
          비밀번호 확인*
        </label>
        <input
          type="password"
          id="password-confirm"
          name="password-confirm"
          className="form-input"
          placeholder="비밀번호를 다시 입력하세요"
          value={formData.passwordConfirm}
          onChange={onFieldChange('passwordConfirm')}
          aria-invalid={!!errors.passwordConfirm}
          aria-describedby={errors.passwordConfirm ? 'password-confirm-error' : undefined}
        />
        {errors.passwordConfirm && (
          <span className="helper-text has-error" id="password-confirm-error" role="alert">
            * {errors.passwordConfirm}
          </span>
        )}
      </div>
      <div className="form-group">
        <label htmlFor="nickname" className="form-label">
          닉네임*
        </label>
        <input
          type="text"
          id="nickname"
          name="nickname"
          className="form-input"
          placeholder="닉네임을 입력하세요"
          value={formData.nickname}
          onChange={onFieldChange('nickname')}
          aria-invalid={!!errors.nickname}
          aria-describedby={errors.nickname ? 'nickname-error' : undefined}
        />
        {errors.nickname && (
          <span className="helper-text has-error" id="nickname-error" role="alert">
            * {errors.nickname}
          </span>
        )}
      </div>
    </>
  );
}
