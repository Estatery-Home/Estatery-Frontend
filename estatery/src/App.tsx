import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { PublicRoute } from "@/components";


import Login from "@/screens/auth/Login";
import NotFound from "@/screens/NotFound";
import Signup from "@/screens/auth/Signup";
import ForgotPassword from "@/screens/auth/forgotPassword";
import VerifyOTP from "@/screens/auth/VerifyOTP";
import CreateNewPassword from "@/screens/auth/CreateNewPassword";

export default function App() {
  return (
    <AuthProvider>
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

          {/* Add more screens here as you create them, e.g.: */}
          {/* <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} /> */}
          

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
