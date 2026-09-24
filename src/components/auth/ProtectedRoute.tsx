import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingState } from '@/components/ui/LoadingState';

interface ProtectedRouteProps {
  children: React.ReactElement;
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireOnboarding = true,
}) => {
  const { user, profile, isLoading, isConfigured } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState fullPage message="Authenticating campus session..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check onboarding completion
  if (
    requireOnboarding &&
    profile &&
    !profile.onboarding_completed &&
    location.pathname !== '/onboarding'
  ) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};
