// 회원정보 수정 이메일·닉네임 입력. (계정 상태는 백엔드 관리용, 화면에는 노출하지 않음)
export function NicknameSection({
  email,
  nickname,
  nicknameError,
  onNicknameChange,
}) {
  return (
    <>
      <div className="form-group">
        <label className="form-label">이메일</label>
        <p className="text-sm text-black py-2">{email ?? '\u00A0'}</p>
      </div>
      <div className="form-group">
        <label htmlFor="nickname" className="form-label">
          닉네임
        </label>
        <input
          type="text"
          id="nickname"
          name="nickname"
          className="form-input"
          value={nickname}
          onChange={(e) => {
            onNicknameChange(e.target.value);
          }}
          aria-invalid={!!nicknameError}
          aria-describedby={nicknameError ? 'edit-profile-nickname-error' : undefined}
        />
        {nicknameError && (
          <span className="helper-text" id="edit-profile-nickname-error" role="alert">
            * {nicknameError}
          </span>
        )}
      </div>
    </>
  );
}
