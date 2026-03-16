// 회원정보 수정 로직(프로필 전용): 닉네임·프로필 이미지, PATCH /users/me·탈퇴. 강아지는 user.dogs 유지.
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { DEFAULT_PROFILE_IMAGE } from '../config.js';
import {
  getApiErrorMessage,
  validateNickname,
  getImageUploadData,
  safeImageUrl,
  revokeObjectUrlSafely,
} from '../utils/index.js';

function toFormDog(d) {
  return {
    id: d?.dogId ?? d?.id ?? null,
    name: (d?.name ?? '').trim(),
    breed: (d?.breed ?? '').trim(),
    gender: d?.gender === 'female' ? 'female' : 'male',
    birthDate: (d?.birthDate ?? d?.birth_date ?? '').trim().slice(0, 10),
    isRepresentative: !!d?.isRepresentative,
  };
}

function buildDogsPayload(dogsArray) {
  const list = Array.isArray(dogsArray) ? dogsArray.map(toFormDog) : [];
  return list
    .filter((d) => d.name && d.breed && d.birthDate)
    .map((d, i, arr) => ({
      id: d.id != null ? Number(d.id) : undefined,
      name: d.name,
      breed: d.breed,
      gender: d.gender,
      birthDate: d.birthDate.slice(0, 10),
      isRepresentative:
        arr.filter((x) => x.isRepresentative).length > 0 ? !!d.isRepresentative : i === 0,
    }));
}

export function useEditProfile() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  const initialNickname = (user?.nickname ?? '').trim();
  const [nickname, setNickname] = useState(initialNickname);
  const [profileFile, setProfileFile] = useState(null);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState(null);
  const [clearProfileImage, setClearProfileImage] = useState(false);
  const [formError, setFormError] = useState('');
  const [nicknameError, setNicknameError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const initializedRef = useRef(false);
  const previousUserIdRef = useRef(undefined);

  const profileImageDisplay =
    clearProfileImage
      ? DEFAULT_PROFILE_IMAGE
      : (profilePreviewUrl ?? safeImageUrl(user?.profileImageUrl, DEFAULT_PROFILE_IMAGE) ?? DEFAULT_PROFILE_IMAGE);
  const canClearProfileImage = profileImageDisplay !== DEFAULT_PROFILE_IMAGE;
  const nicknameChanged = nickname.trim() !== initialNickname;
  const profileImageChanged = profileFile != null || clearProfileImage;
  const hasUnsavedChanges = nicknameChanged || profileImageChanged;

  useEffect(() => {
    const uid = user?.userId ?? user?.id;
    if (uid !== previousUserIdRef.current) {
      previousUserIdRef.current = uid;
      initializedRef.current = false;
    }
    if (initializedRef.current || user == null) return;
    initializedRef.current = true;
    setNickname((user.nickname ?? '').trim());
  }, [user]);

  useEffect(() => {
    return () => {
      if (profilePreviewUrl) revokeObjectUrlSafely(profilePreviewUrl);
    };
  }, [profilePreviewUrl]);

  const handleProfileChange = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      setProfileFile(null);
      if (profilePreviewUrl) {
        revokeObjectUrlSafely(profilePreviewUrl);
        setProfilePreviewUrl(null);
      }
      if (!file) {
        e.target.value = '';
        return;
      }
      setProfileFile(file);
      setProfilePreviewUrl(URL.createObjectURL(file));
      e.target.value = '';
    },
    [profilePreviewUrl]
  );

  const handleClearProfileImage = useCallback(() => {
    setClearProfileImage(true);
    setProfileFile(null);
    if (profilePreviewUrl) {
      revokeObjectUrlSafely(profilePreviewUrl);
      setProfilePreviewUrl(null);
    }
  }, [profilePreviewUrl]);

  const handleAvatarChangeClick = useCallback((e) => {
    if (e) e.stopPropagation();
    setClearProfileImage(false);
    fileInputRef.current?.click();
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setFormError('');
      setNicknameError('');

      if (!hasUnsavedChanges) {
        setFormError('회원정보를 수정해주세요.');
        return;
      }

      const nickTrim = nickname.trim();
      const nickCheck = validateNickname(nickTrim);
      if (!nickCheck.ok) {
        setNicknameError(nickCheck.message);
        return;
      }

      setSubmitting(true);
      try {
        let profileImageId = null;
        if (profileFile) {
          const formData = new FormData();
          formData.append('image', profileFile);
          const uploadRes = await api.postFormData('/media/images?purpose=profile', formData);
          profileImageId = getImageUploadData(uploadRes).imageId;
        }

        const payload = { nickname: nickTrim };
        if (clearProfileImage) {
          payload.profileImageId = null;
          payload.clearProfileImage = true;
        } else if (profileImageId != null) {
          payload.profileImageId = Number(profileImageId);
        }
        payload.dogs = buildDogsPayload(user?.dogs);

        const patchRes = await api.patch('/users/me', payload);
        const updatedFromPatch = patchRes?.data?.data ?? patchRes?.data ?? null;

        if (updatedFromPatch) {
          setUser({
            ...user,
            ...updatedFromPatch,
          });
          setNickname(updatedFromPatch.nickname ?? nickTrim);
        } else {
          try {
            const meRes = await api.get('/users/me');
            const updated = meRes?.data?.data ?? null;
            if (updated) {
              setUser({
                ...user,
                userId: updated.id ?? user?.userId,
                email: updated.email ?? user?.email,
                nickname: updated.nickname ?? nickTrim,
                profileImageId: updated.profileImageId ?? null,
                profileImageUrl: updated.profileImageUrl ?? null,
                dogs: updated.dogs ?? user?.dogs,
                representativeDog: updated.representativeDog ?? null,
                accessToken: user?.accessToken,
              });
              setNickname(updated.nickname ?? nickTrim);
            } else {
              setUser({ ...user, nickname: nickTrim });
              setNickname(nickTrim);
            }
          } catch (_) {
            setUser({ ...user, nickname: nickTrim });
            setNickname(nickTrim);
          }
        }

        alert('회원정보가 수정되었습니다.');
        setProfileFile(null);
        setClearProfileImage(false);
        if (profilePreviewUrl) {
          revokeObjectUrlSafely(profilePreviewUrl);
          setProfilePreviewUrl(null);
        }
        setFormError('');
        setNicknameError('');
      } catch (err) {
        setFormError(
          getApiErrorMessage(
            err?.code ?? err?.message,
            '회원정보 수정에 실패했습니다. 닉네임·프로필 사진을 확인한 뒤 다시 시도해주세요.'
          )
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      user,
      nickname,
      profileFile,
      clearProfileImage,
      hasUnsavedChanges,
      profilePreviewUrl,
      setUser,
    ]
  );

  const handleEditComplete = useCallback(() => {
    setFormError('');
    if (hasUnsavedChanges) {
      setFormError('수정하기 버튼을 눌러주세요.');
      return;
    }
    navigate('/posts');
  }, [hasUnsavedChanges, navigate]);

  const handleDeleteAccount = useCallback(async () => {
    try {
      await api.delete('/users/me');
      setUser(null);
      setDeleteModalOpen(false);
      alert('회원 탈퇴가 완료되었습니다.');
      navigate('/posts', { replace: true });
    } catch (err) {
      setDeleteModalOpen(false);
      setFormError(
        getApiErrorMessage(err?.code ?? err?.message, '회원 탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.')
      );
    }
  }, [setUser, navigate]);

  return {
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
  };
}
