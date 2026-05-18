export function calculateDogAge(birthDate) {
  if (birthDate == null) return '';
  const date =
    typeof birthDate === 'string' ? new Date(birthDate.trim() + 'T00:00:00') : birthDate;
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const now = new Date();
  const months =
    (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
  if (months < 0) return '';
  if (months < 12) return `${months}개월`;
  const years = Math.floor(months / 12);
  return `${years}살`;
}

export function formatDogGenderLabel(gender) {
  if (gender === 'male') return '\u2642\uFE0F';
  if (gender === 'female') return '\u2640\uFE0F';
  return gender ? String(gender) : '';
}
