import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppShell } from "@/components/petlink/Layout";
import { LandingPage } from "@/views/petlink/Landing";
import { LoginPage, RegisterPage } from "@/views/petlink/AuthPages";
import { AnnouncementsPage, BookingDetailPage, BookingsPage, DashboardPage, MatchPage, NotificationsPage, PetDetailPage, PetFormPage, PetsPage, ProfilePage, ProviderServiceFormPage, ProviderServicesPage, ServicesPage, ServiceDetailPage, SubscriptionsPage, VetsPage } from "@/views/petlink/AppPages";
import { ApiError } from "@/lib/api";
import NotFound from "./views/NotFound";

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
      // Only retry server errors (5xx). Never retry client errors (4xx).
      retry: (failureCount, error) => {
        if (error instanceof ApiError && error.status > 0 && error.status < 500) return false;
        return failureCount < 2;
      },
      // Flat 400ms between retries instead of exponential 1s/2s/4s
      retryDelay: 400,
    },
  },
});

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid min-h-screen place-items-center bg-background text-foreground">Cargando PetLink…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <AppShell />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner richColors position="top-right" />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoutes />}>
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
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
