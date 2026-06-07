import type { UserRole } from '../../types/rbac';
import { ROLE_DASHBOARD_ROUTES } from '../../types/rbac';

export type OnboardingStep = 'role' | 'profile' | 'complete';

function readSessionUser(): { role?: string; onboardingStep?: string } | null {
  try {
    const raw = localStorage.getItem('ecg:session');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.user ?? null;
  } catch {
    return null;
  }
}

export function isValidRole(value: string): value is UserRole {
  return ['PHC_DOCTOR', 'CARDIOLOGIST', 'PATIENT', 'ADMIN'].includes(value);
}

export function getRole(): UserRole | null {
  const user = readSessionUser();
  const backendRole = user?.role;
  if (backendRole && isValidRole(backendRole)) {
    return backendRole as UserRole;
  }
  return null;
}

export function getDashboardRoute(): string {
  const role = getRole();
  if (role) return ROLE_DASHBOARD_ROUTES[role];
  return '/onboarding/role';
}

export function isDoctor(): boolean {
  return getRole() === 'PHC_DOCTOR';
}

export function isCardiologist(): boolean {
  return getRole() === 'CARDIOLOGIST';
}

export function isPatient(): boolean {
  return getRole() === 'PATIENT';
}

export function isAdmin(): boolean {
  return getRole() === 'ADMIN';
}

// Brand-new accounts always carry an explicit 'role' | 'profile' | 'complete' from
// the backend. Anything else (undefined/null/unrecognized) means the account predates
// onboarding tracking — treat it as already onboarded so existing sessions never get
// bounced into the onboarding flow mid-session.
export function getOnboardingStep(): OnboardingStep {
  const user = readSessionUser();
  const step = user?.onboardingStep;
  if (step === 'role' || step === 'profile') return step;
  return 'complete';
}

export function hasCompletedOnboarding(): boolean {
  return getOnboardingStep() === 'complete';
}

export function getOnboardingRoute(): string {
  return getOnboardingStep() === 'role' ? '/onboarding/role' : '/onboarding/profile';
}

// Where to land right after establishing a session (register, login, Google sign-in):
// resume onboarding if incomplete, otherwise go straight to the role dashboard.
export function getPostAuthRoute(): string {
  return hasCompletedOnboarding() ? getDashboardRoute() : getOnboardingRoute();
}
