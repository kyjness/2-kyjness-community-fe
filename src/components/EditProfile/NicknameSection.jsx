// 회원정보 수정 이메일·계정 상태·닉네임 입력.
export function NicknameSection({
  email,
  status,
  nickname,
  nicknameError,
  onNicknameChange,
}) {
  return (
    <>
      <div className="form-group">
        <label className="form-label">이메일</label>
        <p className="profile-edit-email">{email ?? '\u00A0'}</p>
      </div>
      {status != null && (
        <div className="form-group">
          <label className="form-label">계정 상태</label>
          <p className="profile-edit-status" aria-live="polite">
            {status === 'ACTIVE' && '활성'}
            {status === 'PENDING' && '대기'}
            {status === 'BANNED' && '정지'}
            {status === 'DELETED' && '탈퇴'}
            {!['ACTIVE', 'PENDING', 'BANNED', 'DELETED'].includes(status) && (status ?? '\u00A0')}
          </p>
        </div>
      )}
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
