import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/petlink/Layout";
import { LandingPage } from "@/views/petlink/Landing";
import { LoginPage, RegisterPage } from "@/views/petlink/AuthPages";
import { AuthCallbackPage } from "@/views/petlink/AuthCallback";
import { ApiError } from "@/lib/api";
import NotFound from "./views/NotFound";

// Authenticated screens are code-split out of the initial bundle: visitors on
// the landing/login pages no longer download the whole app (react-hook-form,
// zod, charts, maps, etc.). The AppPages module loads once on the first
// protected route and is reused for the rest.
const loadAppPages = () => import("@/views/petlink/AppPages");
const ProfileOnboardingPage = lazy(() => import("@/views/petlink/ProfileOnboarding").then((m) => ({ default: m.ProfileOnboardingPage })));
const ProviderProfilePage = lazy(() => import("@/views/petlink/ProviderProfile").then((m) => ({ default: m.ProviderProfilePage })));
const LegalPage = lazy(() => import("@/views/petlink/Legal").then((m) => ({ default: m.LegalPage })));
const AssistantPage = lazy(() => loadAppPages().then((m) => ({ default: m.AssistantPage })));
const AnnouncementsPage = lazy(() => loadAppPages().then((m) => ({ default: m.AnnouncementsPage })));
const BookingDetailPage = lazy(() => loadAppPages().then((m) => ({ default: m.BookingDetailPage })));
const BookingsPage = lazy(() => loadAppPages().then((m) => ({ default: m.BookingsPage })));
const DashboardPage = lazy(() => loadAppPages().then((m) => ({ default: m.DashboardPage })));
const MatchPage = lazy(() => loadAppPages().then((m) => ({ default: m.MatchPage })));
const NotificationsPage = lazy(() => loadAppPages().then((m) => ({ default: m.NotificationsPage })));
const PetDetailPage = lazy(() => loadAppPages().then((m) => ({ default: m.PetDetailPage })));
const PetFormPage = lazy(() => loadAppPages().then((m) => ({ default: m.PetFormPage })));
const PetsPage = lazy(() => loadAppPages().then((m) => ({ default: m.PetsPage })));
const ProfilePage = lazy(() => loadAppPages().then((m) => ({ default: m.ProfilePage })));
const ProviderServiceFormPage = lazy(() => loadAppPages().then((m) => ({ default: m.ProviderServiceFormPage })));
const ProviderServicesPage = lazy(() => loadAppPages().then((m) => ({ default: m.ProviderServicesPage })));
const ServicesPage = lazy(() => loadAppPages().then((m) => ({ default: m.ServicesPage })));
const ServiceDetailPage = lazy(() => loadAppPages().then((m) => ({ default: m.ServiceDetailPage })));
const SubscriptionsPage = lazy(() => loadAppPages().then((m) => ({ default: m.SubscriptionsPage })));
const VetsPage = lazy(() => loadAppPages().then((m) => ({ default: m.VetsPage })));

const fullScreenLoader = <div className="grid min-h-screen place-items-center bg-background text-foreground">Cargando PetLink…</div>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't treat data as stale for 60 seconds — prevents constant refetches
      staleTime: 60_000,
      // Keep unused query data in cache for 5 minutes
      gcTime: 5 * 60_000,
      // Never refetch just because the user switched back to this tab.
      // All mutations already invalidate the relevant queries manually.
      refetchOnWindowFocus: false,
      // Retry on server errors (5xx) and on auth errors (401/403) since those
      // can be resolved by the token refresh logic in apiRequest.
      // Never retry other 4xx (bad request, not found, etc.).
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status > 0 && error.status < 500) {
          if (error.status === 401 || error.status === 403) return failureCount < 1;
          return false;
        }
        return failureCount < 2;
      },
      // Flat 400ms between retries instead of exponential 1s/2s/4s
      retryDelay: 400,
    },
  },
});

function ProtectedRoutes() {
  const { user, loading, profileLoading, profile } = useAuth();
  const location = useLocation();
  const isOnboardingRoute = location.pathname === "/onboarding/profile";
  const isProfileComplete = Boolean(profile?.fullName?.trim() && profile?.city?.trim() && profile?.location?.trim());

  if (loading) return fullScreenLoader;
  if (!user) return <Navigate to="/login" replace />;
  // Session is valid but the profile fetch hasn't resolved yet: wait instead of
  // assuming the user needs onboarding. Without this, every login/reload flashes
  // the onboarding screen for ~3s until the profile request (cold-started) returns.
  if (profileLoading && !isProfileComplete) return fullScreenLoader;
  if (!isProfileComplete && !isOnboardingRoute) return <Navigate to="/onboarding/profile" replace />;
  if (isProfileComplete && isOnboardingRoute) return <Navigate to="/dashboard" replace />;
  return <AppShell />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner richColors position="top-right" />
        <BrowserRouter>
          <Suspense fallback={fullScreenLoader}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/providers/:id" element={<ProviderProfilePage />} />
            <Route path="/legal/:doc" element={<LegalPage />} />
            <Route element={<ProtectedRoutes />}>
              <Route path="/onboarding/profile" element={<ProfileOnboardingPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/pets" element={<PetsPage />} />
              <Route path="/pets/new" element={<PetFormPage />} />
              <Route path="/pets/:id" element={<PetDetailPage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/match" element={<MatchPage />} />
              <Route path="/services/:id" element={<ServiceDetailPage />} />
              <Route path="/bookings" element={<BookingsPage />} />
              <Route path="/bookings/:id" element={<BookingDetailPage />} />
              <Route path="/announcements" element={<AnnouncementsPage />} />
              <Route path="/assistant" element={<AssistantPage />} />
              <Route path="/vets" element={<VetsPage />} />
              <Route path="/my-services" element={<ProviderServicesPage />} />
              <Route path="/my-services/new" element={<ProviderServiceFormPage />} />
              <Route path="/my-services/:id/edit" element={<ProviderServiceFormPage />} />
              <Route path="/my-bookings" element={<BookingsPage provider />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
