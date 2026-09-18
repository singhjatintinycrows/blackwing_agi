import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { AppShell } from './components/layout/AppShell';
import { Login } from './views/auth/Login';
import { AssessmentForm } from './views/assessment/AssessmentForm';
import { ReportList } from './views/reports/ReportList';
import { ReportDetail } from './views/reports/ReportDetail';
import { VulnDashboard } from './views/vulns/VulnDashboard';
import { VulnDetail } from './views/vulns/VulnDetail';
import { ToolLibrary } from './views/tools/ToolLibrary';
import { ToolDetail } from './views/tools/ToolDetail';

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <div className="dw-page-body"><p>Loading…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/assessment" replace />} />
              <Route path="/assessment" element={<AssessmentForm />} />
              <Route path="/reports" element={<ReportList />} />
              <Route path="/reports/:id" element={<ReportDetail />} />
              <Route path="/vulns" element={<VulnDashboard />} />
              <Route path="/vulns/:id" element={<VulnDetail />} />
              <Route path="/tools" element={<ToolLibrary />} />
              <Route path="/tools/:id" element={<ToolDetail />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
