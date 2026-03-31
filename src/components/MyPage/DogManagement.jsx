// 반려견 관리 탭: 강아지 추가/수정/대표 설정, PATCH /users/me (dogs).
import { useDogManagement } from '../../hooks/useDogManagement.js';
import { DogListSection } from '../EditProfile';

export function DogManagement() {
  const {
    dogs,
    setDogAt,
    addDog,
    removeDog,
    setRepresentative,
    formError,
    submitting,
    handleSubmit,
  } = useDogManagement();

  return (
    <div className="pb-6 max-w-[600px] w-full mypage-form-center mypage-form-center--wide mypage-form--top">
      <h2 className="form-title text-[16px] mb-4">반려견 관리</h2>
      <form className="form mypage-form-inner" noValidate onSubmit={handleSubmit}>
        <DogListSection
          dogs={dogs}
          setDogAt={setDogAt}
          addDog={addDog}
          removeDog={removeDog}
          setRepresentative={setRepresentative}
        />
        {formError && (
          <span className="helper-text form-error-common" role="alert">
            * {formError}
          </span>
        )}
        <div className="mypage-form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? '저장 중...' : '저장하기'}
          </button>
        </div>
      </form>
    </div>
  );
}
