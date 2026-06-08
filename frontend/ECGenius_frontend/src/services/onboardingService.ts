import AxiosInstance from '../AxiosInstance';
import type { User } from '../features/auth/useAuth';
import type { UserRole } from '../types/rbac';
import type { OnboardingProfile } from '../types/onboarding';

function unwrapUser(raw: unknown): User {
  const body = raw as Record<string, unknown>;
  const payload = (body.data ?? body) as Record<string, unknown>;
  const user = payload.user as User | undefined;
  if (!user) throw new Error('Unexpected response: no user returned');
  return user;
}

export const onboardingService = {
  // PATCH /api/auth/onboarding/role  (PROTECT) — persists the chosen role immediately
  async selectRole(role: UserRole): Promise<User> {
    const res = await AxiosInstance.patch<unknown>('/api/auth/onboarding/role', { role });
    return unwrapUser(res.data);
  },

  // POST /api/auth/onboarding/profile  (PROTECT) — saves profile, marks onboarding complete
  async completeProfile(profile: OnboardingProfile): Promise<User> {
    const { fullName, phone, ...rest } = profile;
    const res = await AxiosInstance.post<unknown>('/api/auth/onboarding/profile', {
      fullName,
      phone,
      profile: rest,
    });
    return unwrapUser(res.data);
  },
};
