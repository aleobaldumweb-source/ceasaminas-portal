export enum Role {
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  JOURNALIST = 'JOURNALIST',
  AUDITOR = 'AUDITOR',
}

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export type AuthenticatedUser = AuthUser & {
  sessionId: string;
};

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: Role;
  sessionId: string;
};
