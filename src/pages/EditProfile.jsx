// 회원정보 수정 페이지: useEditProfile 훅 + EditProfile 하위 컴포넌트 조합.
import { Header } from '../components/Header.jsx';
import { useEditProfile } from '../hooks/useEditProfile.js';
import {
  ProfileImageSection,
  NicknameSection,
  DogListSection,
  DeleteAccountModal,
} from '../components/EditProfile';

export function EditProfile() {
  const {
    user,
    fileInputRef,
    nickname,
    setNickname,
    nicknameError,
    setNicknameError,
    dogs,
    setDogAt,
    addDog,
    removeDog,
    setRepresentative,
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
    <Header showBackButton backHref="/posts">
      <main className="main">
        <div className="form-container profile-edit">
          <h2 className="form-title">회원정보수정</h2>
          <form
            id="form"
            className="form"
            noValidate
            onSubmit={handleSubmit}
          >
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
              status={user?.status}
              nickname={nickname}
              nicknameError={nicknameError}
              onNicknameChange={(v) => {
                setNickname(v);
                if (nicknameError) setNicknameError('');
              }}
            />
            <DogListSection
              dogs={dogs}
              setDogAt={setDogAt}
              addDog={addDog}
              removeDog={removeDog}
              setRepresentative={setRepresentative}
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
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? '수정 중...' : '수정하기'}
            </button>
            <button
              type="button"
              id="delete-account-btn"
              className="btn btn-secondary profile-delete-btn"
              onClick={() => setDeleteModalOpen(true)}
            >
              회원 탈퇴
            </button>
          </form>
          <button
            type="button"
            id="edit-complete-btn"
            className="btn-submit"
            onClick={handleEditComplete}
          >
            수정완료
          </button>
        </div>
      </main>

      <DeleteAccountModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAccount}
      />
    </Header>
  );
}
