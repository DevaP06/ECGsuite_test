import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import { getRole, getDashboardRoute, hasCompletedOnboarding, getOnboardingRoute } from '../../features/auth/roleUtils';
import AuthLoadingScreen from './AuthLoadingScreen';
import type { UserRole } from '../../types/rbac';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { status } = useAuth();

  // Hold here until the bootstrap has resolved a real DB-backed role/onboarding
  // state — deciding early is exactly what sent first-time users into "Unexpected
  // Error" / bounced them between routes before their session was known.
  if (status === 'initializing') {
    return <AuthLoadingScreen />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (!hasCompletedOnboarding()) {
    return <Navigate to={getOnboardingRoute()} replace />;
  }

  const role = getRole();

  if (!role) {
    return <Navigate to="/onboarding/role" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getDashboardRoute()} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
