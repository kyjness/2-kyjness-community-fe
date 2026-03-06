// 비밀번호 변경 페이지 로직: 폼 상태, 유효성 검사, PATCH /users/me/password.
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { getApiErrorMessage, validatePassword } from '../utils/index.js';

const INITIAL_FORM_DATA = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
};

const INITIAL_ERRORS = {
  currentPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
  form: '',
};

export function useChangePassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState(INITIAL_ERRORS);
  const [submitting, setSubmitting] = useState(false);

  const clearErrors = useCallback(() => {
    setErrors(INITIAL_ERRORS);
  }, []);

  const handleFieldChange = useCallback((field) => (e) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: '', form: '' }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (submitting) return;
      clearErrors();

      const currentTrim = formData.currentPassword.trim();
      const newPw = formData.newPassword ?? '';
      const newPwConfirm = formData.newPasswordConfirm ?? '';

      let hasError = false;
      if (!currentTrim) {
        setErrors((prev) => ({ ...prev, currentPassword: '현재 비밀번호를 입력해주세요.' }));
        hasError = true;
      }
      const newPwCheck = validatePassword(newPw);
      if (!newPwCheck.ok) {
        setErrors((prev) => ({ ...prev, newPassword: newPwCheck.message }));
        hasError = true;
      }
      if (!String(newPwConfirm).trim()) {
        setErrors((prev) => ({ ...prev, newPasswordConfirm: '새 비밀번호 확인을 입력해주세요.' }));
        hasError = true;
      } else if (newPw !== newPwConfirm) {
        setErrors((prev) => ({
          ...prev,
          newPasswordConfirm: '새 비밀번호 확인이 위 새 비밀번호와 일치하지 않습니다.',
        }));
        hasError = true;
      }
      if (hasError) return;

      setSubmitting(true);
      try {
        await api.patch('/users/me/password', {
          currentPassword: currentTrim,
          newPassword: newPw,
        });
        alert('비밀번호가 변경되었습니다!');
        navigate('/posts');
      } catch (err) {
        setErrors((prev) => ({
          ...prev,
          form: getApiErrorMessage(
            err?.code ?? err?.message,
            '현재 비밀번호가 맞는지 확인한 뒤 다시 시도해주세요.'
          ),
        }));
      } finally {
        setSubmitting(false);
      }
    },
    [submitting, formData, clearErrors, navigate]
  );

  return {
    formData,
    errors,
    submitting,
    handleFieldChange,
    handleSubmit,
  };
}
