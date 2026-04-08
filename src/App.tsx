import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import CentresPage from "./pages/CentresPage";
import FellowsPage from "./pages/FellowsPage";
import StudentsPage from "./pages/StudentsPage";
import SessionsPage from "./pages/SessionsPage";
import AttendancePage from "./pages/AttendancePage";
import AssessmentsPage from "./pages/AssessmentsPage";
import QualityPage from "./pages/QualityPage";
import FieldVisitsPage from "./pages/FieldVisitsPage";
import ReportsPage from "./pages/ReportsPage";
import NotificationsPage from "./pages/NotificationsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
    <Route path="/" element={<Navigate to="/dashboard" replace />} />
    <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
    <Route path="/centres" element={<ProtectedRoute><CentresPage /></ProtectedRoute>} />
    <Route path="/fellows" element={<ProtectedRoute><FellowsPage /></ProtectedRoute>} />
    <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
    <Route path="/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
    <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
    <Route path="/assessments" element={<ProtectedRoute><AssessmentsPage /></ProtectedRoute>} />
    <Route path="/quality" element={<ProtectedRoute><QualityPage /></ProtectedRoute>} />
    <Route path="/field-visits" element={<ProtectedRoute><FieldVisitsPage /></ProtectedRoute>} />
    <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
