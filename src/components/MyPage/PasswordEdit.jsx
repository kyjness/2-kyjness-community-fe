// 비밀번호 수정: useChangePassword + ChangePasswordFormFields (마이페이지 탭용).
import { useChangePassword } from '../../hooks/useChangePassword.js';
import { ChangePasswordFormFields } from '../ChangePassword';

export function PasswordEdit() {
  const { formData, errors, submitting, handleFieldChange, handleSubmit } = useChangePassword();

  return (
    <div className="pb-6 max-w-[600px] w-full mypage-form-center mypage-form-center--password">
      <h2 className="form-title text-[16px] mb-6">비밀번호 수정</h2>
      <form id="form" className="form mypage-form-inner" noValidate onSubmit={handleSubmit}>
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
        <div className="mypage-form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '변경 중...' : '수정하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
