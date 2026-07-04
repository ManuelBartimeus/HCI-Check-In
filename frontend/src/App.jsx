import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

// ── Layouts ────────────────────────────────────────────
import AdminLayout from '@/components/layout/AdminLayout';

// ── Eager: Landing (public, must be fast) ─────────────
import LandingPage from '@/pages/Landing/LandingPage';

// ── Lazy: Admin pages ──────────────────────────────────
const Dashboard    = lazy(() => import('@/pages/admin/Dashboard'));
const Members      = lazy(() => import('@/pages/admin/Members'));
const MemberProfile = lazy(() => import('@/pages/admin/MemberProfile'));
const Meetings     = lazy(() => import('@/pages/admin/Meetings'));
const Attendance   = lazy(() => import('@/pages/admin/Attendance'));
const Analytics    = lazy(() => import('@/pages/admin/Analytics'));
const AdminLeaderboard = lazy(() => import('@/pages/admin/AdminLeaderboard'));
const ImportCSV    = lazy(() => import('@/pages/admin/ImportCSV'));
const Settings     = lazy(() => import('@/pages/admin/Settings'));

// ── Page loader ────────────────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-hairline border-t-ink animate-spin" />
    </div>
  );
}

// ── Protected route guard ──────────────────────────────
function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />

        {/* Admin (protected) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="members" element={<Members />} />
          <Route path="members/:id" element={<MemberProfile />} />
          <Route path="meetings" element={<Meetings />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="leaderboard" element={<AdminLeaderboard />} />
          <Route path="import" element={<ImportCSV />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
