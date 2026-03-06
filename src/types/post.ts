// 게시글·이미지 도메인 타입 (EditPost / NewPost 공통).
/** 서버 게시글 파일/이미지 1건 */
export interface PostFile {
  imageId?: number;
  image_id?: number;
  fileUrl?: string;
  url?: string;
}

/** 게시글 상세/목록 응답용 게시글 */
export interface Post {
  postId?: number;
  id?: number;
  title: string;
  content: string;
  author?: { userId?: number; nickname?: string; profileImageUrl?: string };
  files?: PostFile[];
  file?: PostFile;
  createdAt?: string;
  created_at?: string;
  likeCount?: number;
  commentCount?: number;
  hits?: number;
}

/** 기존 이미지 1건 (수정 시 서버에서 내려준 것) */
export interface ExistingImageItem {
  imageId: number;
  fileUrl: string;
}

/** 신규 업로드 예정 이미지 1건 (Object URL → 업로드 후 imageId 부여) */
export interface NewImageItem {
  file: File;
  objectUrl: string;
  imageId: number | null;
}

/** 이미지 업로드 API 응답에서 추출한 데이터 */
export interface ImageUploadData {
  imageId: number | null;
  url: string | null;
  signupToken: string | null;
}

/** 검증 결과 (validatePostTitle, validatePostContent 등) */
export interface ValidationResult {
  ok: boolean;
  message?: string;
}
