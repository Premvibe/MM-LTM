import React, { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/AppLayout";
const LoginPage = lazy(() => import("./pages/LoginPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const CentresPage = lazy(() => import("./pages/CentresPage"));
const CentreDetailPage = lazy(() => import("./pages/CentreDetailPage"));
const FellowsPage = lazy(() => import("./pages/FellowsPage"));
const StudentsPage = lazy(() => import("./pages/StudentsPage"));
const SessionsPage = lazy(() => import("./pages/SessionsPage"));
const QualityPage = lazy(() => import("./pages/QualityPage"));
const FieldVisitsPage = lazy(() => import("./pages/FieldVisitsPage"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const AssessmentsPage = lazy(() => import("./pages/AssessmentsPage"));
const ReportsPage = lazy(() => import("./pages/ReportsPage"));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const FeedbackPage = lazy(() => import("./pages/FeedbackPage"));
const AdminsPage = lazy(() => import("./pages/AdminsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex h-[50vh] w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
  </div>
);

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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light">
      <TooltipProvider>
        <AuthProvider>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
                <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/centres" element={<ProtectedRoute><CentresPage /></ProtectedRoute>} />
                <Route path="/centres/:id" element={<ProtectedRoute><CentreDetailPage /></ProtectedRoute>} />
                <Route path="/fellows" element={<ProtectedRoute><FellowsPage /></ProtectedRoute>} />
                <Route path="/students" element={<ProtectedRoute><StudentsPage /></ProtectedRoute>} />
                <Route path="/sessions" element={<ProtectedRoute><SessionsPage /></ProtectedRoute>} />
                <Route path="/quality" element={<ProtectedRoute><QualityPage /></ProtectedRoute>} />
                <Route path="/field-visits" element={<ProtectedRoute><FieldVisitsPage /></ProtectedRoute>} />
                <Route path="/attendance" element={<ProtectedRoute><AttendancePage /></ProtectedRoute>} />
                <Route path="/assessments" element={<ProtectedRoute><AssessmentsPage /></ProtectedRoute>} />
                <Route path="/reports" element={<ProtectedRoute><ReportsPage /></ProtectedRoute>} />
                <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/feedback" element={<ProtectedRoute><FeedbackPage /></ProtectedRoute>} />
                <Route path="/admins" element={<ProtectedRoute><AdminsPage /></ProtectedRoute>} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
        <Toaster />
        <SonnerToaster />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
