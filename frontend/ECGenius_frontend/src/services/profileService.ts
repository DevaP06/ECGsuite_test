import AxiosInstance from '../AxiosInstance';
import type { User } from '../features/auth/useAuth';

function unwrapUser(raw: unknown): User {
  const body = raw as Record<string, unknown>;
  const payload = (body.data ?? body) as Record<string, unknown>;
  const user = payload.user as User | undefined;
  if (!user) throw new Error('Unexpected response: no user returned');
  return user;
}

export interface ProfileUpdatePayload {
  fullName?: string;
  phone?: string;
  profilePicture?: string;
}

export const profileService = {
  // GET /api/auth/me — full current-user record (PROTECT)
  async getMe(): Promise<User> {
    const res = await AxiosInstance.get<unknown>('/api/auth/me');
    return unwrapUser(res.data);
  },

  // PATCH /api/auth/me — update fullName / phone / profilePicture (PROTECT)
  async updateProfile(updates: ProfileUpdatePayload): Promise<User> {
    const res = await AxiosInstance.patch<unknown>('/api/auth/me', updates);
    return unwrapUser(res.data);
  },

  // PATCH /api/auth/password — change password (PROTECT)
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await AxiosInstance.patch<unknown>('/api/auth/password', { currentPassword, newPassword });
  },
};
