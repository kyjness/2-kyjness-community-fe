// 회원정보 수정 우리 강아지 목록·카드·추가 버튼.
const GENDER_OPTIONS = [
  { value: 'male', label: '\u2642\uFE0F' },   /* ♂️ */
  { value: 'female', label: '\u2640\uFE0F' }, /* ♀️ */
];

/** 오늘 날짜 YYYY-MM-DD (생년월일 미래 선택 방지용) */
function getTodayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function DogListSection({ dogs, setDogAt, addDog, removeDog, setRepresentative }) {
  const maxBirthDate = getTodayISO();
  return (
    <div className="form-group mt-6">
      {dogs.map((dog, index) => (
        <div key={index} className="dog-card form-group">
          <div className="dog-card-grid">
            <div className="dog-card-field">
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
            <div className="dog-card-field">
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
            <div className="dog-card-field dog-card-field--gender">
              <label className="form-label">성별</label>
              <div className="dog-choice-group dog-choice-group--full" role="group" aria-label="성별 선택">
                {GENDER_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`dog-choice-btn ${dog.gender === opt.value ? 'dog-choice-btn--active' : ''}`}
                    onClick={() => setDogAt(index, { gender: opt.value })}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="dog-card-field">
              <label className="form-label">생년월일</label>
              <input
                type="date"
                className="form-input"
                value={dog.birthDate}
                max={maxBirthDate}
                onChange={(e) => setDogAt(index, { birthDate: e.target.value })}
                title="미래 날짜는 선택할 수 없습니다"
              />
            </div>
            <div className="dog-card-field dog-card-field--full dog-card-rep">
              <div className="dog-choice-group">
                <button
                  type="button"
                  className={`dog-choice-btn dog-choice-btn--single ${dog.isRepresentative ? 'dog-choice-btn--active' : ''}`}
                  onClick={() => setRepresentative(index)}
                >
                  {dog.isRepresentative ? '대표로 설정됨' : '대표로 설정'}
                </button>
              </div>
            </div>
          </div>
          {dogs.length > 1 && (
            <div className="dog-card-actions">
              <button
                type="button"
                className="btn btn-secondary py-1.5 px-3 text-[13px]"
                onClick={() => removeDog(index)}
              >
                삭제
              </button>
            </div>
          )}
        </div>
      ))}
      <button type="button" className="btn btn-secondary" onClick={addDog}>
        강아지 추가
      </button>
    </div>
  );
}
