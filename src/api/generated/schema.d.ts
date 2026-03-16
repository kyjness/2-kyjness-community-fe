/**
 * OpenAPI 기반 자동 생성 타입 (SSOT).
 * 재생성: 백엔드 기동 후 npm run fetch-openapi && npm run generate-api
 *
 * 아래는 백엔드 미기동 시를 위한 시드 타입. generate-api 실행 시 덮어씌워짐.
 */
export interface components {
  schemas: {
    ApiResponse: { code: string; data?: unknown; message?: string };
    PostResponse: {
      id: number;
      title: string;
      content: string;
      viewCount?: number;
      likeCount?: number;
      commentCount?: number;
      isLiked?: boolean;
      author: components["schemas"]["AuthorInfo"];
      files?: components["schemas"]["FileInfo"][];
      createdAt?: string;
    };
    AuthorInfo: {
      id: number;
      nickname: string;
      profileImageId?: number | null;
      profileImageUrl?: string | null;
      representativeDog?: components["schemas"]["RepresentativeDogInfo"] | null;
    };
    FileInfo: {
      id: number;
      fileUrl?: string | null;
      imageId?: number | null;
    };
    RepresentativeDogInfo?: {
      id?: number;
      name?: string;
      birthDate?: string | null;
      gender?: string;
    };
    ImageUploadResponse: { id: number; fileUrl: string };
    SignupImageUploadData: { id: number; fileUrl: string; signupToken: string };
    CommentResponse: unknown;
    UserProfileResponse: unknown;
    PaginatedResponse: { items: unknown[]; hasMore?: boolean; total?: number };
  };
}

export interface paths {
  [path: string]: unknown;
}
