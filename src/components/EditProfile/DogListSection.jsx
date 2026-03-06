// 회원정보 수정 우리 강아지 목록·카드·추가 버튼.
const GENDER_OPTIONS = [
  { value: 'male', label: '남아(♂️)' },
  { value: 'female', label: '여아(♀️)' },
];

export function DogListSection({ dogs, setDogAt, addDog, removeDog, setRepresentative }) {
  return (
    <div className="form-group dog-profile-section">
      <label className="form-label">우리 강아지</label>
      {dogs.map((dog, index) => (
        <div key={index} className="dog-profile-card form-group">
          <div className="form-row">
            <label className="form-label">이름</label>
            <input
              type="text"
              className="form-input"
              value={dog.name}
              onChange={(e) => setDogAt(index, { name: e.target.value })}
              placeholder="강아지 이름"
              maxLength={100}
            />
          </div>
          <div className="form-row">
            <label className="form-label">품종</label>
            <input
              type="text"
              className="form-input"
              value={dog.breed}
              onChange={(e) => setDogAt(index, { breed: e.target.value })}
              placeholder="품종"
              maxLength={100}
            />
          </div>
          <div className="form-row">
            <label className="form-label">성별</label>
            <div className="dog-gender-segment" role="group" aria-label="성별 선택">
              {GENDER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`segment-btn ${dog.gender === opt.value ? 'active' : ''}`}
                  onClick={() => setDogAt(index, { gender: opt.value })}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="form-row">
            <label className="form-label">생년월일</label>
            <input
              type="date"
              className="form-input"
              value={dog.birthDate}
              onChange={(e) => setDogAt(index, { birthDate: e.target.value })}
            />
          </div>
          <div className="form-row dog-representative-row">
            <label className="form-label">대표 강아지</label>
            <button
              type="button"
              className={`segment-btn ${dog.isRepresentative ? 'active' : ''}`}
              onClick={() => setRepresentative(index)}
            >
              대표로 설정
            </button>
          </div>
          <div className="dog-profile-actions">
            {dogs.length > 1 && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => removeDog(index)}
              >
                삭제
              </button>
            )}
          </div>
        </div>
      ))}
      <button type="button" className="btn btn-secondary" onClick={addDog}>
        강아지 추가
      </button>
    </div>
  );
}
