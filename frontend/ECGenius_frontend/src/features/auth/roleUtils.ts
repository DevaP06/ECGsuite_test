// TEMPORARY UNTIL BACKEND ROLE MANAGEMENT IS AVAILABLE
import type { UserRole } from '../../types/rbac';
import { ROLE_DASHBOARD_ROUTES } from '../../types/rbac';

const LOCAL_ROLE_KEY = 'ecg:role';

export function getRole(): UserRole | null {
  try {
    const raw = localStorage.getItem('ecg:session');
    if (raw) {
      const parsed = JSON.parse(raw);
      const backendRole = parsed?.user?.role as string | undefined;
      if (backendRole && isValidRole(backendRole)) {
        return backendRole as UserRole;
      }
    }
  } catch {
    // ignore malformed session
  }

  // TEMPORARY: fall back to locally-stored role selection
  const local = localStorage.getItem(LOCAL_ROLE_KEY);
  if (local && isValidRole(local)) return local as UserRole;

  return null;
}

export function setLocalRole(role: UserRole): void {
  // TEMPORARY UNTIL BACKEND ROLE MANAGEMENT IS AVAILABLE
  localStorage.setItem(LOCAL_ROLE_KEY, role);
}

export function clearLocalRole(): void {
  localStorage.removeItem(LOCAL_ROLE_KEY);
}

export function isValidRole(value: string): value is UserRole {
  return ['PHC_DOCTOR', 'CARDIOLOGIST', 'PATIENT', 'ADMIN'].includes(value);
}

export function getDashboardRoute(): string {
  const role = getRole();
  if (role) return ROLE_DASHBOARD_ROUTES[role];
  return '/select-role';
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
