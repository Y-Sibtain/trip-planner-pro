import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { BookingProvider } from '@/contexts/BookingContext';
import { ToastProvider } from '@/components/ui/toast';
import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import Profile from '@/pages/Profile';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import ManageDestinations from '@/pages/admin/ManageDestinations';
import ManageItineraries from '@/pages/admin/ManageItineraries';
import AdminUsers from '@/pages/admin/AdminUsers';
import { ProtectedAdminRoute } from '@/components/ProtectedAdminRoute';

function App() {
  return (
    <ToastProvider>
      <BookingProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/profile" element={<Profile />} />
            
            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <AdminDashboard />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/destinations"
              element={
                <ProtectedAdminRoute>
                  <ManageDestinations />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/itineraries"
              element={
                <ProtectedAdminRoute>
                  <ManageItineraries />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedAdminRoute>
                  <AdminUsers />
                </ProtectedAdminRoute>
              }
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </BookingProvider>
    </ToastProvider>
  );
}

export default App;