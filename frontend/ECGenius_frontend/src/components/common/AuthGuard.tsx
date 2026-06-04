import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/Sign-Up-Page" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
