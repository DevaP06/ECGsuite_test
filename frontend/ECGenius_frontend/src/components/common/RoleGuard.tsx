import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import { getRole, getDashboardRoute } from '../../features/auth/roleUtils';
import type { UserRole } from '../../types/rbac';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const role = getRole();

  if (!role) {
    return <Navigate to="/select-role" replace />;
  }

  if (!allowedRoles.includes(role)) {
    return <Navigate to={getDashboardRoute()} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
