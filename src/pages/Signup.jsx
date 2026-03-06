// 회원가입 페이지: useSignup 훅 + Signup 하위 컴포넌트 조합.
import { Header } from '../components/Header.jsx';
import { useSignup } from '../hooks/useSignup.js';
import { SignupProfileSection, SignupFormFields } from '../components/Signup';

export function Signup() {
  const {
    formData,
    errors,
    profilePreviewUrl,
    submitting,
    fileInputRef,
    handleAvatarClick,
    handleFileChange,
    handleFieldChange,
    handleSubmit,
    navigate,
  } = useSignup();

  return (
    <Header showProfile={false} showBackButton backHref="/login">
      <main className="main">
        <div className="form-container">
          <h2 className="form-title">회원가입</h2>
          <form id="signup-form" className="form" noValidate onSubmit={handleSubmit}>
            <SignupProfileSection
              profilePreviewUrl={profilePreviewUrl}
              profileError={errors.profile}
              fileInputRef={fileInputRef}
              onAvatarClick={handleAvatarClick}
              onFileChange={handleFileChange}
            />
            <SignupFormFields
              formData={formData}
              errors={errors}
              onFieldChange={handleFieldChange}
            />
            {errors.form && (
              <span className="helper-text form-error-common" id="form-error-common" role="alert">
                * {errors.form}
              </span>
            )}
            <button
              type="submit"
              className="btn btn-primary"
              id="signup-submit"
              disabled={submitting}
            >
              {submitting ? '회원가입 중...' : '회원가입'}
            </button>
            <button
              type="button"
              id="login-link"
              className="btn btn-secondary"
              onClick={() => navigate('/login')}
            >
              로그인하러 가기
            </button>
          </form>
        </div>
      </main>
    </Header>
  );
}
