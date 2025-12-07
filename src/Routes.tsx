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
import Index from './pages/Index';
import AdminBookings from './pages/admin/AdminBookings';
import Destinations from './pages/Destinations';
import Payment from './pages/Payment';
import MyBookings from './pages/MyBookings';
import NotFound from './pages/NotFound';
import CityPlanner from './pages/CityPlanner';

function AppRoutes() {
  return (
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <main className="flex-1 bg-white dark:bg-gray-900 w-full overflow-x-hidden">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/nf" element={<NotFound />} />
            <Route path="/city-planner" element={<CityPlanner />} />
            
            <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
            <Route path="/admin/destinations" element={<ProtectedAdminRoute><ManageDestinations /></ProtectedAdminRoute>} />
            <Route path="/admin/users" element={<ProtectedAdminRoute><AdminUsers /></ProtectedAdminRoute>} />
            <Route path="/admin/admin-bookings" element={<ProtectedAdminRoute><AdminBookings /></ProtectedAdminRoute>} />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
  );
}

export default AppRoutes;