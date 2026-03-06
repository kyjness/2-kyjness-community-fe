// 비밀번호 변경 페이지: useChangePassword 훅 + ChangePasswordFormFields 조합.
import { Header } from '../components/Header.jsx';
import { useChangePassword } from '../hooks/useChangePassword.js';
import { ChangePasswordFormFields } from '../components/ChangePassword';

export function ChangePassword() {
  const { formData, errors, submitting, handleFieldChange, handleSubmit } = useChangePassword();

  return (
    <Header showBackButton backHref="/posts">
      <main className="main">
        <div className="form-container">
          <h2 className="form-title">비밀번호 수정</h2>
          <form id="form" className="form" noValidate onSubmit={handleSubmit}>
            <ChangePasswordFormFields
              formData={formData}
              errors={errors}
              onFieldChange={handleFieldChange}
            />
            {errors.form && (
              <span
                className="helper-text form-error-common"
                id="change-password-form-error"
                role="alert"
              >
                * {errors.form}
              </span>
            )}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '변경 중...' : '수정하기'}
            </button>
          </form>
        </div>
      </main>
    </Header>
  );
}
