/**
 * Estatery App – Main application root
 *
 * Sets up providers (auth, settings, properties), routing, and lazy-loaded screens.
 * Public routes (welcome, login, signup) vs protected routes (dashboard, etc.).
 */
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useSearchParams } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { PropertiesProvider } from "@/contexts/PropertiesContext";
import { PublicRoute, ProtectedRoute } from "@/components";

// Lazy-load screens – only the current route loads, reducing initial bundle size
const Login = lazy(() => import("@/screens/auth/Login"));
const Signup = lazy(() => import("@/screens/auth/Signup"));
const ForgotPassword = lazy(() => import("@/screens/auth/forgotPassword"));
const VerifyOTP = lazy(() => import("@/screens/auth/VerifyOTP"));
const CreateNewPassword = lazy(() => import("@/screens/auth/CreateNewPassword"));
const Dashboard = lazy(() => import("@/screens/Dashboard"));
const PropertyDetail = lazy(() => import("@/screens/dashboard/PropertyDetail"));
const PropertiesList = lazy(() => import("@/screens/dashboard/PropertiesList"));
const Notifications = lazy(() => import("@/screens/dashboard/Notifications"));
const NotificationDetail = lazy(() => import("@/screens/dashboard/NotificationDetail"));
const DashboardLayout = lazy(() => import("@/components/dashboard").then((m) => ({ default: m.DashboardLayout })));
const Settings = lazy(() => import("@/screens/settings/settings"));
const Clients = lazy(() => import("@/screens/clients/clients"));
const ClientDetail = lazy(() => import("@/screens/clients/ClientDetail"));
const Messages = lazy(() => import("@/screens/dashboard/Messages"));
const Calendar = lazy(() => import("@/screens/dashboard/Calendar"));
const Leads = lazy(() => import("@/screens/dashboard/Leads"));
const Discounts = lazy(() => import("@/screens/dashboard/Discounts"));
const Transactions = lazy(() => import("@/screens/dashboard/Transactions"));
const Analytics = lazy(() => import("@/screens/dashboard/Analytics"));
const Agents = lazy(() => import("@/screens/dashboard/Agents"));
const HelpCenter = lazy(() => import("@/screens/dashboard/HelpCenter"));
const Feedback = lazy(() => import("@/screens/dashboard/Feedback"));
const Welcome = lazy(() => import("@/screens/Welcome"));
const NotFound = lazy(() => import("@/screens/NotFound"));

/** Re-mount Settings when section changes (e.g. ?section=general) */
function SettingsWithSection() {
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section") ?? "default";
  return <Settings key={section} />;
}

/** Spinner shown while a lazy-loaded route is loading */
function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white" aria-hidden>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--logo)] border-t-transparent" />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <SettingsProvider>
        <PropertiesProvider>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route
                path="/"
                element={
                  <PublicRoute redirectTo="/dashboard">
                    <Welcome />
                  </PublicRoute>
                }
              />

              <Route
                path="/auth/login"
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                }
              />
              <Route
                path="/auth/Signup"
                element={
                  <PublicRoute>
                    <Signup />
                  </PublicRoute>
                }
              />
              <Route
                path="/auth/forgot-password"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />
              <Route
                path="/auth/forgotPassword"
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                }
              />
              <Route
                path="/auth/verify-otp"
                element={
                  <PublicRoute>
                    <VerifyOTP />
                  </PublicRoute>
                }
              />
              <Route
                path="/auth/create-new-password"
                element={
                  <PublicRoute>
                    <CreateNewPassword />
                  </PublicRoute>
                }
              />

              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/properties/:id"
                element={
                  <ProtectedRoute>
                    <PropertyDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/notifications"
                element={
                  <ProtectedRoute>
                    <Notifications />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/notifications/:id"
                element={
                  <ProtectedRoute>
                    <NotificationDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/properties"
                element={
                  <ProtectedRoute>
                    <PropertiesList />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/agents"
                element={
                  <ProtectedRoute>
                    <Agents />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients/clients"
                element={
                  <ProtectedRoute>
                    <Clients />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients/:clientId"
                element={
                  <ProtectedRoute>
                    <ClientDetail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/analytics"
                element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/calendar"
                element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/messages"
                element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/leads"
                element={
                  <ProtectedRoute>
                    <Leads />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/transactions"
                element={
                  <ProtectedRoute>
                    <Transactions />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/discounts"
                element={
                  <ProtectedRoute>
                    <Discounts />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings/settings"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <SettingsWithSection />
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/help"
                element={
                  <ProtectedRoute>
                    <HelpCenter />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/feedback"
                element={
                  <ProtectedRoute>
                    <Feedback />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        </PropertiesProvider>
        </SettingsProvider>
      </UserProfileProvider>
    </AuthProvider>
  );
}
