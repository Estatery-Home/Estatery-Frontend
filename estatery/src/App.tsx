import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { PublicRoute, ProtectedRoute } from "@/components";

import Login from "@/screens/auth/Login";
import NotFound from "@/screens/NotFound";
import Signup from "@/screens/auth/Signup";
import ForgotPassword from "@/screens/auth/forgotPassword";
import VerifyOTP from "@/screens/auth/VerifyOTP";
import CreateNewPassword from "@/screens/auth/CreateNewPassword";
import Dashboard from "@/screens/Dashboard";
import PropertyDetail from "@/screens/dashboard/PropertyDetail";
import PropertiesList from "@/screens/dashboard/PropertiesList";
import Notifications from "@/screens/dashboard/Notifications";
import NotificationDetail from "@/screens/dashboard/NotificationDetail";
import { PlaceholderPage } from "@/screens/dashboard/PlaceholderPage";
import { DashboardLayout } from "@/components/dashboard";
import Settings from "@/screens/settings/settings";
import Clients from "@/screens/clients/clients";
import ClientDetail from "@/screens/clients/ClientDetail";
import Messages from "@/screens/dashboard/Messages";
import Calendar from "@/screens/dashboard/Calendar";
import Leads from "@/screens/dashboard/Leads";
import Discounts from "@/screens/dashboard/Discounts";
import Analytics from "@/screens/dashboard/Analytics";
import Agents from "@/screens/dashboard/Agents";

export default function App() {
  return (
    <AuthProvider>
      <UserProfileProvider>
        <BrowserRouter>
          <Routes>
          {/* Redirect root to login */}
          <Route path="/" element={<Navigate to="/auth/login" replace />} />

          {/* Public auth screens */}
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
            } /> 

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

          {/* Dashboard (protected) */}
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
                <PlaceholderPage title="Transactions" />
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
                  <Settings />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/help"
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Help Center" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard/feedback"
            element={
              <ProtectedRoute>
                <PlaceholderPage title="Feedback" />
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

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        </BrowserRouter>
      </UserProfileProvider>
   </AuthProvider>
  );
}
