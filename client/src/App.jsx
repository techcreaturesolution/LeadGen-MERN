import React, { Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import LandingPage from './pages/LandingPage.tsx';

// Lazy-load dashboard pages to decouple them from the initial Landing Page bundle
const Layout = React.lazy(() => import('./components/Layout.jsx'));
const Login = React.lazy(() => import('./pages/Login.jsx'));
const Dashboard = React.lazy(() => import('./pages/Dashboard.jsx'));
const Searches = React.lazy(() => import('./pages/Searches.jsx'));
const SearchDetail = React.lazy(() => import('./pages/SearchDetail.jsx'));
const Leads = React.lazy(() => import('./pages/Leads.jsx'));
const Groups = React.lazy(() => import('./pages/Groups.jsx'));
const GroupDetail = React.lazy(() => import('./pages/GroupDetail.jsx'));
const Templates = React.lazy(() => import('./pages/Templates.jsx'));
const Campaigns = React.lazy(() => import('./pages/Campaigns.jsx'));
const CampaignDetail = React.lazy(() => import('./pages/CampaignDetail.jsx'));
const Admin = React.lazy(() => import('./pages/Admin.jsx'));
const AdminClient = React.lazy(() => import('./pages/AdminClient.jsx'));

function Protected({ children, admin = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) return <div className="p-10 text-center text-slate-500">Loading…</div>;

  return (
    <Suspense fallback={<div className="min-h-screen bg-[#020205] flex items-center justify-center text-slate-500">Loading…</div>}>
      <Routes>
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/register" element={user ? <Navigate to="/" replace /> : <Login />} />

        {!user ? (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        ) : (
          <>
            <Route
              element={
                <Protected>
                  <Layout />
                </Protected>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="searches" element={<Searches />} />
              <Route path="searches/:id" element={<SearchDetail />} />
              <Route path="leads" element={<Leads />} />
              <Route path="groups" element={<Groups />} />
              <Route path="groups/:id" element={<GroupDetail />} />
              <Route path="templates" element={<Templates />} />
              <Route path="campaigns" element={<Campaigns />} />
              <Route path="campaigns/:id" element={<CampaignDetail />} />
              <Route
                path="admin"
                element={
                  <Protected admin>
                    <Admin />
                  </Protected>
                }
              />
              <Route
                path="admin/clients/:id"
                element={
                  <Protected admin>
                    <AdminClient />
                  </Protected>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </Suspense>
  );
}
