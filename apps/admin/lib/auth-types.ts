export type UserRole = 'ADMIN' | 'EDITOR' | 'JOURNALIST' | 'AUDITOR';

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AuthResponse = {
  accessToken: string;
  user: AuthUser;
};
