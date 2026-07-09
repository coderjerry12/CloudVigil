import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import ProtectedRoute from '../auth/components/ProtectedRoute';
import RoleProtectedRoute from '../auth/components/RoleProtectedRoute';
import GuestRoute from '../auth/components/GuestRoute';
import { UserRole } from '../auth/types';
import { useAuth } from '../auth/hooks/useAuth';

// Lazy load pages for code splitting
const LoginPage = lazy(() => import('../auth/pages/LoginPage'));
const SignUpPage = lazy(() => import('../auth/pages/SignUpPage'));
const VerifyEmailPage = lazy(() => import('../auth/pages/VerifyEmailPage'));
const ForgotPasswordPage = lazy(() => import('../auth/pages/ForgotPasswordPage'));
const UnauthorizedPage = lazy(() => import('../auth/pages/UnauthorizedPage'));
const LandingPage = lazy(() => import('../pages/LandingPage'));
const OrganizerDashboard = lazy(() => import('../pages/OrganizerDashboard'));
const OrganizerOnboarding = lazy(() => import('../pages/OrganizerOnboarding'));
const AttendeeDashboard = lazy(() => import('../pages/AttendeeDashboard'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

// Phase 3: Event Management pages
const CreateEventPage = lazy(() => import('../features/events/pages/CreateEventPage'));
const OrganizerEventsPage = lazy(() => import('../features/events/pages/OrganizerEventsPage'));
const EditEventPage = lazy(() => import('../features/events/pages/EditEventPage'));
const EventDetailsPage = lazy(() => import('../features/events/pages/EventDetailsPage'));
const BrowseEventsPage = lazy(() => import('../features/events/pages/BrowseEventsPage'));

// Phase 4: Registration pages
const MyRegistrationsPage = lazy(() => import('../features/registration/pages/MyRegistrationsPage'));
const QRTicketPage = lazy(() => import('../features/registration/pages/QRTicketPage'));
const EventRegistrationsPage = lazy(() => import('../features/registration/pages/EventRegistrationsPage'));

// Phase 5: Check-in & Attendance pages
const QRScannerPage = lazy(() => import('../features/checkin/pages/QRScannerPage'));
const AttendanceListPage = lazy(() => import('../features/checkin/pages/AttendanceListPage'));

// Phase 6: Safety pages
const SafetyAssistancePage = lazy(() => import('../features/safety/pages/SafetyAssistancePage'));
const MyIncidentsPage = lazy(() => import('../features/safety/pages/MyIncidentsPage'));
const OrganizerIncidentsPage = lazy(() => import('../features/safety/pages/OrganizerIncidentsPage'));

// Phase 10: Analytics
const AnalyticsDashboardPage = lazy(() => import('../features/analytics/pages/AnalyticsDashboardPage'));

// Notifications page
const NotificationsPage = lazy(() => import('../features/notifications/pages/NotificationsPage'));

// Loading fallback
function PageLoader() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <CircularProgress color="primary" />
    </Box>
  );
}

/**
 * Role-based redirect component.
 * Sends authenticated users to their respective dashboard.
 */
function DashboardRedirect() {
  const { user } = useAuth();

  if (user?.role === UserRole.ORGANIZER) {
    // Check if organizer has completed onboarding
    const onboarded = localStorage.getItem('organizer-onboarded');
    if (!onboarded) {
      return <Navigate to="/organizer/onboarding" replace />;
    }
    return <Navigate to="/organizer/dashboard" replace />;
  }
  return <Navigate to="/attendee/dashboard" replace />;
}

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public / Guest routes — redirect if already authenticated */}
        <Route
          path="/login"
          element={
            <GuestRoute>
              <LoginPage />
            </GuestRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestRoute>
              <SignUpPage />
            </GuestRoute>
          }
        />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route
          path="/forgot-password"
          element={
            <GuestRoute>
              <ForgotPasswordPage />
            </GuestRoute>
          }
        />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        {/* Dashboard redirect based on role */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />

        {/* Organizer Onboarding */}
        <Route
          path="/organizer/onboarding"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
              <OrganizerOnboarding />
            </RoleProtectedRoute>
          }
        />

        {/* Organizer routes */}
        <Route
          path="/organizer/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
              <OrganizerDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/create"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
              <CreateEventPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/organizer/events"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
              <OrganizerEventsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:eventId/edit"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
              <EditEventPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:eventId"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
              <EventDetailsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:eventId/registrations"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
              <EventRegistrationsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/organizer/checkin"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
              <QRScannerPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:eventId/attendance"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
              <AttendanceListPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/organizer/events/:eventId/incidents"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
              <OrganizerIncidentsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/organizer/analytics"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ORGANIZER]}>
              <AnalyticsDashboardPage />
            </RoleProtectedRoute>
          }
        />

        {/* Attendee routes */}
        <Route
          path="/attendee/dashboard"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ATTENDEE]}>
              <AttendeeDashboard />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/attendee/events/:eventId"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ATTENDEE]}>
              <EventDetailsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/attendee/events"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ATTENDEE]}>
              <BrowseEventsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/attendee/tickets"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ATTENDEE]}>
              <MyRegistrationsPage />
            </RoleProtectedRoute>
          }
        />
        <Route
          path="/attendee/tickets/:registrationId"
          element={
            <RoleProtectedRoute allowedRoles={[UserRole.ATTENDEE]}>
              <QRTicketPage />
            </RoleProtectedRoute>
          }
        />

        {/* Safety routes (shared + attendee-specific) */}
        <Route
          path="/safety"
          element={
            <ProtectedRoute>
              <SafetyAssistancePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendee/incidents"
          element={
            <ProtectedRoute>
              <MyIncidentsPage />
            </ProtectedRoute>
          }
        />

        {/* Settings & Profile */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
        <Route
          path="/"
          element={
            <GuestRoute>
              <LandingPage />
            </GuestRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
