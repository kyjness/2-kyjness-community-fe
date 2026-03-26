// 비밀번호 변경 폼: 현재/새/새 확인 3필드.
import { PASSWORD_POLICY_TEXT } from '../../utils/index.js';

export function ChangePasswordFormFields({ formData, errors, onFieldChange }) {
  const policyInParens = PASSWORD_POLICY_TEXT.replace(/^비밀번호는\s*/, '');
  return (
    <>
      <div className="form-group">
        <label htmlFor="current-password" className="form-label">
          현재 비밀번호
        </label>
        <input
          type="password"
          id="current-password"
          name="current-password"
          className="form-input"
          placeholder="현재 비밀번호를 입력하세요"
          value={formData.currentPassword}
          onChange={onFieldChange('currentPassword')}
          aria-invalid={!!errors.currentPassword}
          aria-describedby={errors.currentPassword ? 'current-password-error' : undefined}
        />
        {errors.currentPassword && (
          <span className="helper-text" id="current-password-error" role="alert">
            * {errors.currentPassword}
          </span>
        )}
      </div>
      <div className="form-group">
        <label htmlFor="new-password" className="form-label">
          새 비밀번호
        </label>
        <input
          type="password"
          id="new-password"
          name="new-password"
          className="form-input"
          placeholder={`${policyInParens}`}
          value={formData.newPassword}
          onChange={onFieldChange('newPassword')}
          aria-invalid={!!errors.newPassword}
          aria-describedby={errors.newPassword ? 'new-password-error' : undefined}
        />
        {errors.newPassword && (
          <span className="helper-text" id="new-password-error" role="alert">
            * {errors.newPassword}
          </span>
        )}
      </div>
      <div className="form-group">
        <label htmlFor="new-password-confirm" className="form-label">
          새 비밀번호 확인
        </label>
        <input
          type="password"
          id="new-password-confirm"
          name="new-password-confirm"
          className="form-input"
          placeholder="새 비밀번호를 한번 더 입력하세요"
          value={formData.newPasswordConfirm}
          onChange={onFieldChange('newPasswordConfirm')}
          aria-invalid={!!errors.newPasswordConfirm}
          aria-describedby={
            errors.newPasswordConfirm ? 'new-password-confirm-error' : undefined
          }
        />
        {errors.newPasswordConfirm && (
          <span className="helper-text" id="new-password-confirm-error" role="alert">
            * {errors.newPasswordConfirm}
          </span>
        )}
      </div>
    </>
  );
}
