// 게시글 수정 Zustand 스토어: 이미지·폼 필드·API·Object URL 해제.
import { create } from 'zustand';
import type { ExistingImageItem, NewImageItem, Post } from '../types/post';
import { api } from '../api/client.js';
import {
  getApiErrorMessage,
  getImageUploadData,
  revokeObjectUrlSafely,
  validatePostTitle,
  validatePostContent,
} from '../utils/index.js';

const MAX_IMAGES = 5;

export interface PostEditState {
  postId: string | null;
  title: string;
  content: string;
  loading: boolean;
  formError: string;
  titleError: string;
  contentError: string;
  submitting: boolean;
  /** 초기 기존 이미지 적용 여부 (한 번만 적용) */
  _initialApplied: boolean;
  existingIds: number[];
  existingUrls: ExistingImageItem[];
  newImages: NewImageItem[];
}

export interface PostEditActions {
  setTitle: (v: string) => void;
  setContent: (v: string) => void;
  setFormError: (v: string) => void;
  loadPost: (postId: string) => Promise<void>;
  addFiles: (files: FileList | File[]) => void;
  removeExisting: (index: number) => void;
  removeNew: (index: number) => Promise<void>;
  uploadNewImages: () => Promise<NewImageItem[]>;
  submit: (postId: string, onSuccess: () => void) => Promise<void>;
  reset: () => void;
}

const getInitialState = (): PostEditState => ({
  postId: null,
  title: '',
  content: '',
  loading: false,
  formError: '',
  titleError: '',
  contentError: '',
  submitting: false,
  _initialApplied: false,
  existingIds: [],
  existingUrls: [],
  newImages: [],
});

export const usePostStore = create<PostEditState & PostEditActions>((set, get) => ({
  ...getInitialState(),

  setTitle: (v: string) => set({ title: v, titleError: '' }),
  setContent: (v: string) => set({ content: v, contentError: '' }),
  setFormError: (v: string) => set({ formError: v }),

  loadPost: async (postId: string) => {
    set({ loading: true, formError: '', titleError: '', contentError: '', postId });
    try {
      const res = await api.get(`/posts/${postId}`);
      const data = (res as { data?: Post }).data ?? (res as Post);
      const files = data.files ?? (data.file ? [data.file] : []);
      const ids = files.map((f) => f.imageId ?? (f as { image_id?: number }).image_id).filter((id): id is number => id != null);
      const urls: ExistingImageItem[] = files
        .filter((f) => (f.imageId ?? (f as { image_id?: number }).image_id) != null)
        .map((f) => ({
          imageId: (f.imageId ?? (f as { image_id?: number }).image_id) as number,
          fileUrl: f.fileUrl ?? f.url ?? '',
        }));
      set({
        title: data.title ?? '',
        content: data.content ?? '',
        existingIds: ids,
        existingUrls: urls,
        _initialApplied: true,
        formError: '',
      });
    } catch (err: unknown) {
      const code = (err as { code?: string; message?: string })?.code ?? (err as Error)?.message;
      set({
        formError: getApiErrorMessage(String(code), '게시글을 불러오지 못했습니다.'),
      });
    } finally {
      set({ loading: false });
    }
  },

  addFiles: (files: FileList | File[]) => {
    const list = Array.from(files ?? []) as File[];
    if (list.length === 0) return;
    const { existingUrls, newImages } = get();
    const cap = MAX_IMAGES - existingUrls.length - newImages.length;
    const toAdd = list.slice(0, Math.max(0, cap));
    const added: NewImageItem[] = toAdd.map((file: File) => ({
      file,
      objectUrl: URL.createObjectURL(file),
      imageId: null,
    }));
    set({ newImages: [...get().newImages, ...added] });
  },

  removeExisting: (index: number) => {
    const { existingUrls, existingIds } = get();
    const item = existingUrls[index];
    const nextUrls = existingUrls.filter((_: ExistingImageItem, i: number) => i !== index);
    const nextIds = item?.imageId != null ? existingIds.filter((id: number) => id !== item.imageId) : existingIds;
    set({ existingUrls: nextUrls, existingIds: nextIds });
  },

  removeNew: async (index: number) => {
    const { newImages } = get();
    const entry = newImages[index];
    if (!entry) return;
    if (entry.imageId != null) {
      try {
        await api.delete(`/media/images/${entry.imageId}`);
      } catch (_: unknown) {}
    }
    revokeObjectUrlSafely(entry.objectUrl);
    set({ newImages: newImages.filter((_: NewImageItem, i: number) => i !== index) });
  },

  uploadNewImages: async () => {
    const { newImages } = get();
    const current = [...newImages];
    for (let i = 0; i < current.length; i++) {
      if (current[i].imageId != null) continue;
      const fd = new FormData();
      fd.append('image', current[i].file);
      const res = await api.postFormData('/media/images?purpose=post', fd);
      const data = getImageUploadData(res as { data?: unknown; [k: string]: unknown });
      current[i] = { ...current[i], imageId: data.imageId };
    }
    set({ newImages: current });
    return current;
  },

  submit: async (postId: string, onSuccess: () => void) => {
    const { title, content, existingIds, uploadNewImages } = get();
    const titleTrim = title.trim();
    const contentTrim = content.trim();
    const tCheck = validatePostTitle(titleTrim);
    const cCheck = validatePostContent(contentTrim);
    set({
      titleError: tCheck.ok ? '' : (tCheck.message ?? ''),
      contentError: cCheck.ok ? '' : (cCheck.message ?? ''),
      formError: '',
    });
    if (!tCheck.ok || !cCheck.ok) return;
    set({ submitting: true, formError: '' });
    try {
      const uploaded = await uploadNewImages();
      const newIds = uploaded.map((x: NewImageItem) => x.imageId).filter((id: number | null): id is number => id != null);
      const imageIds = [...existingIds, ...newIds].slice(0, MAX_IMAGES).map(Number);
      await api.patch(`/posts/${postId}`, {
        title: titleTrim,
        content: contentTrim,
        imageIds,
      });
      onSuccess();
    } catch (err: unknown) {
      const code = (err as { code?: string; message?: string })?.code ?? (err as Error)?.message;
      set({ formError: getApiErrorMessage(String(code), '게시글 수정에 실패했습니다.') });
    } finally {
      set({ submitting: false });
    }
  },

  reset: () => {
    const { newImages } = get();
    newImages.forEach((item: NewImageItem) => revokeObjectUrlSafely(item.objectUrl));
    set(getInitialState());
  },
}));
