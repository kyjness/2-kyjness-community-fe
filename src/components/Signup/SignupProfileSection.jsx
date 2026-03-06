// 회원가입 프로필 사진 업로드 블록.
export function SignupProfileSection({
  profilePreviewUrl,
  profileError,
  fileInputRef,
  onAvatarClick,
  onFileChange,
}) {
  return (
    <div className="profile-group form-group">
      <label className="form-label">프로필 사진</label>
      {profileError && (
        <span className="helper-text has-error" id="profile-error" role="alert">
          * {profileError}
        </span>
      )}
      <div className="avatar-wrapper">
        <button
          type="button"
          className="btn avatar"
          id="signup-avatar-preview"
          onClick={onAvatarClick}
          aria-label="프로필 사진 선택"
        >
          {profilePreviewUrl ? (
            <img id="avatar-img" src={profilePreviewUrl} alt="" />
          ) : (
            <div className="plus" id="plus-icon" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          id="profile-image"
          accept="image/jpeg,image/png"
          style={{ display: 'none' }}
          onChange={onFileChange}
        />
      </div>
    </div>
  );
}
