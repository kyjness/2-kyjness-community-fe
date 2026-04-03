import type { ReactNode } from 'react';

export interface AuthUser {
  userId?: string;
  [key: string]: unknown;
}

export function AuthProvider(props: { children: ReactNode }): React.ReactElement;

export function useAuth(): {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isRestored: boolean;
  setUser: (userData: AuthUser | null) => void;
  clearUser: () => void;
};
