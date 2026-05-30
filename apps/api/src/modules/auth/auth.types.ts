import { AuthUser } from '@expensio/types';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export interface AuthPayload {
  id: string;
  email: string;
  aud: string;
  role: string;
}

export interface AuthenticatedUser extends AuthUser {
  id: string;
  email: string;
}

export interface LoginResponse {
  success: true;
  data: {
    user: AuthenticatedUser;
    session: {
      accessToken: string;
      refreshToken?: string;
    };
  };
}

export interface RegisterResponse {
  success: true;
  data: {
    user: AuthenticatedUser;
  };
}

export interface SyncResponse {
  success: true;
  data: {
    user: AuthenticatedUser;
    isNew: boolean;
    isOnboardingCompleted: boolean;
  };
}
