import { Routes, Route, Navigate } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import Profile from '@/pages/Profile';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManageDestinations from '@/pages/admin/ManageDestinations';
import ManageItineraries from '@/pages/admin/ManageItineraries';
import AdminUsers from '@/pages/admin/AdminUsers';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';

function AppRoutes() {
  return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            
            <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/admin/destinations" element={<ProtectedAdminRoute><ManageDestinations /></ProtectedAdminRoute>} />
            <Route path="/admin/itineraries" element={<ProtectedAdminRoute><ManageItineraries /></ProtectedAdminRoute>} />
            <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
  );
}

export default AppRoutes;