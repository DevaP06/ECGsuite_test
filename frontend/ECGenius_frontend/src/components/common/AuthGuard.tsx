import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import AuthLoadingScreen from './AuthLoadingScreen';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { status } = useAuth();

  // Never redirect or render protected content while the bootstrap is still
  // verifying the session — that's what produced the "second click works"
  // and "Unexpected Error on first load" symptoms (a guard deciding before
  // the database-backed session was actually known).
  if (status === 'initializing') {
    return <AuthLoadingScreen />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default AuthGuard;
