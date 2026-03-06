// 회원정보 수정 프로필 사진 섹션(아바타·변경·기본값).
export function ProfileImageSection({
  profileImageDisplay,
  canClearProfileImage,
  fileInputRef,
  onProfileChange,
  onClearProfile,
  onAvatarClick,
  onAvatarChangeClick,
}) {
  return (
    <div className="form-group signup-profile-group">
      <label className="form-label">프로필 사진*</label>
      <div className="avatar-wrapper profile-edit-avatar-wrap">
        <div
          className="btn avatar profile-edit-avatar"
          id="avatar-area"
          onClick={onAvatarClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onAvatarClick();
            }
          }}
        >
          <div className="avatar-img-wrapper">
            <img id="avatar-img" src={profileImageDisplay} alt="프로필 이미지" />
          </div>
          <button
            type="button"
            className="profile-edit-avatar-change"
            id="avatar-change-btn"
            onClick={onAvatarChangeClick}
          >
            변경
          </button>
        </div>
        <div className="profile-edit-avatar-actions">
          {canClearProfileImage && (
            <button
              type="button"
              className="profile-edit-avatar-default-btn"
              onClick={(e) => {
                e.preventDefault();
                onClearProfile();
              }}
            >
              [기본값]
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          id="profile-image"
          accept="image/jpeg,image/png"
          style={{ display: 'none' }}
          onChange={onProfileChange}
        />
      </div>
    </div>
  );
}
