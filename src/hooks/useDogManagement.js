// 반려견 관리 로직: user.dogs 로드, 로컬 state, PATCH /users/me에 dogs만 반영.
import { useState, useRef, useEffect, useCallback } from 'react';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getApiErrorMessage, unwrapApiData } from '../utils/index.js';

function emptyDog() {
  return {
    id: null,
    name: '',
    breed: '',
    gender: 'male',
    birthDate: '',
    isRepresentative: false,
  };
}

/** API(camelCase) → 폼 상태 */
function toFormDog(d) {
  const pid = d?.profileImageId;
  return {
    id: d?.id ?? null,
    name: (d?.name ?? '').trim(),
    breed: (d?.breed ?? '').trim(),
    gender: d?.gender === 'female' ? 'female' : 'male',
    birthDate: (d?.birthDate ?? '').trim().slice(0, 10),
    isRepresentative: !!d?.isRepresentative,
    ...(pid != null ? { profileImageId: Number(pid) } : {}),
  };
}

export function useDogManagement() {
  const { user, setUser } = useAuth();
  const initialDogs = Array.isArray(user?.dogs) ? user.dogs.map(toFormDog) : [];
  const [dogs, setDogs] = useState(initialDogs.length > 0 ? initialDogs : [emptyDog()]);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const dogsRef = useRef(dogs);
  dogsRef.current = dogs;
  const initializedRef = useRef(false);
  const previousUserIdRef = useRef(undefined);

  const initialDogsSnapshot =
    Array.isArray(user?.dogs) && user.dogs.length > 0 ? user.dogs.map(toFormDog) : [emptyDog()];
  const dogsChanged = JSON.stringify(dogs) !== JSON.stringify(initialDogsSnapshot);

  useEffect(() => {
    const uid = user?.userId ?? user?.id;
    if (uid !== previousUserIdRef.current) {
      previousUserIdRef.current = uid;
      initializedRef.current = false;
    }
    if (initializedRef.current || user == null) return;
    initializedRef.current = true;
    setDogs(
      Array.isArray(user.dogs) && user.dogs.length > 0 ? user.dogs.map(toFormDog) : [emptyDog()]
    );
  }, [user]);

  useEffect(() => {
    const uid = user?.userId ?? user?.id;
    if (uid == null) return;
    const hasDogs = Array.isArray(user?.dogs) && user.dogs.length > 0;
    if (hasDogs) return;

    let cancelled = false;
    api
      .get('/users/me')
      .then((res) => {
        if (cancelled) return;
        const payload = unwrapApiData(res);
        if (!payload) return;
        const mappedDogs =
          Array.isArray(payload.dogs) && payload.dogs.length > 0
            ? payload.dogs.map(toFormDog)
            : [emptyDog()];
        setUser({
          ...user,
          ...payload,
          userId: payload.id ?? uid,
          accessToken: user?.accessToken,
          dogs: mappedDogs,
        });
        setDogs(mappedDogs);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.userId ?? user?.id]);

  const setDogAt = useCallback((index, patch) => {
    setDogs((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }, []);

  const addDog = useCallback(() => {
    setDogs((prev) => [...prev, emptyDog()]);
  }, []);

  const removeDog = useCallback((index) => {
    setDogs((prev) => (prev.length <= 1 ? [emptyDog()] : prev.filter((_, i) => i !== index)));
  }, []);

  const setRepresentative = useCallback((index) => {
    const current = dogsRef.current[index]?.isRepresentative;
    if (current) {
      if (dogsRef.current.length === 1) {
        alert('등록된 강아지가 한 마리일 경우, 반드시 대표 강아지로 지정되어야 합니다.');
      } else {
        alert(
          '대표 강아지는 해제할 수 없습니다.\n변경을 원하시면 다른 강아지의 [대표로 설정] 버튼을 눌러주세요.'
        );
      }
      return;
    }
    setDogs((prev) => prev.map((d, i) => ({ ...d, isRepresentative: i === index })));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setFormError('');
      if (!dogsChanged) {
        setFormError('변경된 내용이 없습니다.');
        return;
      }

      const dogsPayload = dogs
        .filter((d) => d.name.trim() && d.breed.trim() && d.birthDate.trim())
        .map((d, i, arr) => {
          const row = {
            id: d.id != null ? Number(d.id) : undefined,
            name: d.name.trim(),
            breed: d.breed.trim(),
            gender: d.gender,
            birthDate: d.birthDate.trim().slice(0, 10),
            isRepresentative:
              arr.filter((x) => x.isRepresentative).length > 0 ? !!d.isRepresentative : i === 0,
          };
          if (d.profileImageId != null) row.profileImageId = Number(d.profileImageId);
          return row;
        });

      if (dogsPayload.length === 0) {
        setFormError('최소 한 마리의 강아지 정보(이름, 품종, 생년월일)를 입력해주세요.');
        return;
      }

      setSubmitting(true);
      try {
        const payload = {
          nickname: (user?.nickname ?? '').trim(),
          dogs: dogsPayload,
        };
        await api.patch('/users/me', payload);
        let updated = null;
        try {
          updated = unwrapApiData(await api.get('/users/me'));
        } catch (_) {
          /* ignore */
        }
        if (updated) {
          const mappedDogs =
            Array.isArray(updated.dogs) && updated.dogs.length > 0
              ? updated.dogs.map(toFormDog)
              : [emptyDog()];
          setUser({
            ...user,
            ...updated,
            userId: updated.id ?? user?.userId,
            accessToken: user?.accessToken,
            dogs: mappedDogs,
          });
          setDogs(mappedDogs);
        }
        alert('반려견 정보가 저장되었습니다.');
        setFormError('');
      } catch (err) {
        setFormError(
          getApiErrorMessage(
            err?.code ?? err?.message,
            '반려견 정보 저장에 실패했습니다. 다시 시도해주세요.'
          )
        );
      } finally {
        setSubmitting(false);
      }
    },
    [user, dogs, dogsChanged, setUser]
  );

  return {
    dogs,
    setDogAt,
    addDog,
    removeDog,
    setRepresentative,
    formError,
    submitting,
    handleSubmit,
  };
}
