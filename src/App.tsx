import React, { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ProgramProvider, useProgram } from "@/contexts/ProgramContext";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AppLayout } from "@/components/AppLayout";
import LoginHandoff from "@/components/LoginHandoff";
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
const ChangeStoriesPage = lazy(() => import("./pages/ChangeStoriesPage"));
const DonorsPage = lazy(() => import("./pages/DonorsPage"));
const TermsPage = lazy(() => import("./pages/TermsPage"));
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

// Program managers don't get the Donors page (also hidden from their sidebar)
function DonorsRoute() {
  const { user } = useAuth();
  if (user?.role === "program_manager") return <Navigate to="/dashboard" replace />;
  return <DonorsPage />;
}

// Managers (admin accounts) are added and edited only in High touch. In Mid touch, a manager is
// given access by choosing them as Program Manager on a Mid touch centre (Centres page).
function ManagersRoute() {
  const { isMid, setModel } = useProgram();
  if (!isMid) return <AdminsPage />;
  return (
    <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center shadow-sm">
      <h1 className="text-xl font-black tracking-tight">Managers are managed in High Touch</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Add and edit managers from High Touch. To give a manager Mid touch access, choose them as
        Program Manager on a Mid touch centre (Centres page).
      </p>
      <button
        type="button"
        onClick={() => setModel("high")}
        className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
      >
        Switch to High Touch
      </button>
    </div>
  );
}

// Switching between High touch and Mid touch remounts every page, so each one reloads its data
// from the right backend.
function AppRoutes() {
  const { model } = useProgram();
  return (
    <Routes key={model}>
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/centres" element={<ProtectedRoute><CentresPage /></ProtectedRoute>} />
      <Route path="/centres/:id" element={<ProtectedRoute><CentreDetailPage /></ProtectedRoute>} />
      <Route path="/fellows" element={<ProtectedRoute><FellowsPage /></ProtectedRoute>} />
      <Route path="/donors" element={<ProtectedRoute><DonorsRoute /></ProtectedRoute>} />
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
      <Route path="/admins" element={<ProtectedRoute><ManagersRoute /></ProtectedRoute>} />
      <Route path="/change-stories" element={<ProtectedRoute><ChangeStoriesPage /></ProtectedRoute>} />
      <Route path="/handoff" element={<LoginHandoff storageKey="manzil_user" allowMidOnly={false} />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light">
      <TooltipProvider>
        <AuthProvider>
          <ProgramProvider>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Suspense fallback={<PageLoader />}>
                <AppRoutes />
              </Suspense>
            </BrowserRouter>
          </ProgramProvider>
        </AuthProvider>
        <Toaster />
        <SonnerToaster />
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
