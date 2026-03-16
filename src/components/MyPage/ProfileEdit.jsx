// 회원정보 수정(프로필 전용): 프로필 사진·이메일·닉네임만. 강아지는 반려견 관리 탭에서.
import { useEditProfile } from '../../hooks/useEditProfile.js';
import {
  ProfileImageSection,
  NicknameSection,
  DeleteAccountModal,
} from '../EditProfile';

export function ProfileEdit() {
  const {
    user,
    fileInputRef,
    nickname,
    setNickname,
    nicknameError,
    setNicknameError,
    profileImageDisplay,
    canClearProfileImage,
    formError,
    submitting,
    deleteModalOpen,
    setDeleteModalOpen,
    handleProfileChange,
    handleClearProfileImage,
    handleAvatarChangeClick,
    handleSubmit,
    handleEditComplete,
    handleDeleteAccount,
  } = useEditProfile();

  return (
    <div className="pb-6 max-w-[600px] w-full profile-edit-center">
      <h2 className="form-title text-[22px] mb-6">내 프로필</h2>
      <form id="form" className="form profile-edit-form" noValidate onSubmit={handleSubmit}>
        <ProfileImageSection
          profileImageDisplay={profileImageDisplay}
          canClearProfileImage={canClearProfileImage}
          fileInputRef={fileInputRef}
          onProfileChange={handleProfileChange}
          onClearProfile={handleClearProfileImage}
          onAvatarClick={() => fileInputRef.current?.click()}
          onAvatarChangeClick={handleAvatarChangeClick}
        />
        <NicknameSection
          email={user?.email}
          nickname={nickname}
          nicknameError={nicknameError}
          onNicknameChange={(v) => {
            setNickname(v);
            if (nicknameError) setNicknameError('');
          }}
        />

        {formError && (
          <span
            className="helper-text form-error-common"
            id="edit-profile-form-error"
            role="alert"
          >
            * {formError}
          </span>
        )}
        <div className="profile-edit-actions">
          <button type="submit" className="btn btn-primary mt-4 mr-3 inline-block w-auto min-w-[120px]" disabled={submitting}>
            {submitting ? '수정 중...' : '수정하기'}
          </button>
          <button
            type="button"
            id="delete-account-btn"
            className="btn btn-secondary mt-4 mr-3 inline-block w-auto min-w-[120px]"
            onClick={() => setDeleteModalOpen(true)}
          >
            회원 탈퇴
          </button>
        </div>
      </form>
      <button
        type="button"
        id="edit-complete-btn"
        className="btn-submit profile-edit-complete mt-10 mb-12"
        onClick={handleEditComplete}
      >
        수정완료
      </button>

      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </div>
  );
}
