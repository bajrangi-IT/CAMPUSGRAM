import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthLayout } from '@/components/layout/AuthLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Auth Pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { SignupPage } from '@/pages/auth/SignupPage';
import { VerifyEmailPage } from '@/pages/auth/VerifyEmailPage';
import { VerifyPhonePage } from '@/pages/auth/VerifyPhonePage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage';

// Onboarding
import { OnboardingPage } from '@/pages/onboarding/OnboardingPage';

// App Core Pages
import { HomePage } from '@/pages/home/HomePage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { DiscoverPage } from '@/pages/discover/DiscoverPage';
import { MessagesPage } from '@/pages/messages/MessagesPage';
import { NotificationsPage } from '@/pages/notifications/NotificationsPage';

// Campus Sub-routes
import { CampusHubPage } from '@/pages/campus/CampusHubPage';
import { ClubsPage } from '@/pages/campus/ClubsPage';
import { EventsPage } from '@/pages/campus/EventsPage';
import { AnnouncementsPage } from '@/pages/campus/AnnouncementsPage';
import { NotesPage } from '@/pages/campus/NotesPage';
import { OpportunitiesPage } from '@/pages/campus/OpportunitiesPage';
import { TeamFinderPage } from '@/pages/campus/TeamFinderPage';
import { MarketplacePage } from '@/pages/campus/MarketplacePage';
import { CampusDealsPage } from '@/pages/campus/CampusDealsPage';

// Business & Advertising Layer
import { BusinessLayout } from '@/components/layout/BusinessLayout';
import { BusinessRegisterPage } from '@/pages/business/BusinessRegisterPage';
import { BusinessDashboardPage } from '@/pages/business/BusinessDashboardPage';
import { CampaignsListPage } from '@/pages/business/CampaignsListPage';
import { CreateCampaignPage } from '@/pages/business/CreateCampaignPage';
import { BusinessAnalyticsPage } from '@/pages/business/BusinessAnalyticsPage';
import { BusinessProfilePage } from '@/pages/business/BusinessProfilePage';
import { AdminModerationPage } from '@/pages/admin/AdminModerationPage';

export const App: React.FC = () => {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/verify-phone" element={<VerifyPhonePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Onboarding Flow (Protected, but bypasses onboarding check) */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute requireOnboarding={false}>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Main App Layout (Protected) */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/settings/*" element={<SettingsPage />} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        {/* Campus Sub-routes */}
        <Route path="/campus" element={<CampusHubPage />} />
        <Route path="/campus/clubs" element={<ClubsPage />} />
        <Route path="/campus/events" element={<EventsPage />} />
        <Route path="/campus/announcements" element={<AnnouncementsPage />} />
        <Route path="/campus/notes" element={<NotesPage />} />
        <Route path="/campus/opportunities" element={<OpportunitiesPage />} />
        <Route path="/campus/team-finder" element={<TeamFinderPage />} />
        <Route path="/campus/marketplace" element={<MarketplacePage />} />
        <Route path="/campus/deals" element={<CampusDealsPage />} />

        {/* Administration & Compliance Moderation */}
        <Route path="/admin/moderation" element={<AdminModerationPage />} />
      </Route>

      {/* Business & Advertising Portal (Isolated B2B Layout) */}
      <Route
        path="/business"
        element={
          <ProtectedRoute>
            <BusinessLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/business/dashboard" replace />} />
        <Route path="register" element={<BusinessRegisterPage />} />
        <Route path="dashboard" element={<BusinessDashboardPage />} />
        <Route path="campaigns" element={<CampaignsListPage />} />
        <Route path="campaigns/create" element={<CreateCampaignPage />} />
        <Route path="analytics" element={<BusinessAnalyticsPage />} />
        <Route path="profile" element={<BusinessProfilePage />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
