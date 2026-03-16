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
    <div className="form-group mb-6">
      <label className="form-label">프로필 사진*</label>
      <div className="flex flex-col items-start gap-2.5 mb-6">
        <div
          className="w-[149px] aspect-square rounded-full bg-gray-800/55 relative flex items-center justify-center overflow-hidden shadow-md cursor-default"
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
          <div className="absolute inset-0 w-full h-full">
            <img id="avatar-img" src={profileImageDisplay} alt="프로필 이미지" className="w-full h-full object-cover rounded-full" />
          </div>
          <div className="absolute inset-0 rounded-full bg-black/35 pointer-events-none" aria-hidden />
          <button
            type="button"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[52px] h-[27px] rounded-[25px] border border-white bg-black/35 text-white text-[13px] font-semibold flex items-center justify-center cursor-pointer z-10"
            id="avatar-change-btn"
            onClick={onAvatarChangeClick}
          >
            변경
          </button>
        </div>
        <div className="flex items-center gap-2">
          {canClearProfileImage && (
            <button
              type="button"
              className="p-0 text-[13px] text-gray-600 bg-transparent border-none cursor-pointer underline hover:text-gray-800 transition-colors"
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
