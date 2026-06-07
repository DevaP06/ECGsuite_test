import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/useAuth';
import { getDashboardRoute, getOnboardingStep } from '../../features/auth/roleUtils';
import type { OnboardingStep } from '../../features/auth/roleUtils';

interface OnboardingGuardProps {
  children: React.ReactNode;
  step: Extract<OnboardingStep, 'role' | 'profile'>;
}

const OnboardingGuard: React.FC<OnboardingGuardProps> = ({ children, step }) => {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const currentStep = getOnboardingStep();

  // Onboarding is finished — never send a completed user back into the wizard.
  if (currentStep === 'complete') {
    return <Navigate to={getDashboardRoute()} replace />;
  }

  // Can't skip ahead to the profile step before a role has been chosen.
  if (step === 'profile' && currentStep === 'role') {
    return <Navigate to="/onboarding/role" replace />;
  }

  return <>{children}</>;
};

export default OnboardingGuard;
