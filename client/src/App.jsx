import { Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { useAuth } from './lib/auth.jsx';
import Admin from './pages/Admin.jsx';
import AdminClient from './pages/AdminClient.jsx';
import CampaignDetail from './pages/CampaignDetail.jsx';
import Campaigns from './pages/Campaigns.jsx';
import Dashboard from './pages/Dashboard.jsx';
import GroupDetail from './pages/GroupDetail.jsx';
import Groups from './pages/Groups.jsx';
import Leads from './pages/Leads.jsx';
import Login from './pages/Login.jsx';
import SearchDetail from './pages/SearchDetail.jsx';
import Searches from './pages/Searches.jsx';
import Templates from './pages/Templates.jsx';

function Protected({ children, admin = false }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="p-10 text-center text-slate-500">Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<Dashboard />} />
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
    </Routes>
  );
}
