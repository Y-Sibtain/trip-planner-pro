import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, LogIn, User, LayoutDashboard, MapPin, Calendar, Users, LogOut, Settings } from 'lucide-react';
import { useBooking } from '@/contexts/BookingContext';
import { Button } from '@/components/ui/button';

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, signOut } = useBooking();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home', public: true },
    { path: '/auth', icon: LogIn, label: 'Sign In', public: true, hideIfAuth: true },
    { path: '/profile', icon: User, label: 'Profile', public: false },
    { path: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard', admin: true },
    { path: '/admin/destinations', icon: MapPin, label: 'Manage Destinations', admin: true },
    { path: '/admin/itineraries', icon: Calendar, label: 'Manage Itineraries', admin: true },
    { path: '/admin/users', icon: Users, label: 'Manage Users', admin: true },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition md:hidden"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-gray-900 text-white shadow-lg transform transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative md:h-screen overflow-y-auto`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-8 h-8 text-indigo-400" />
            <h1 className="text-xl font-bold">Trip Planner</h1>
          </div>
          {isAuthenticated && (
            <p className="text-sm text-gray-400">{user?.email}</p>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            // Skip if public only and authenticated
            if (item.hideIfAuth && isAuthenticated) return null;
            // Skip if requires auth and not authenticated
            if (!item.public && !isAuthenticated) return null;
            // Skip admin items for non-admins (we'll check this properly with useAdmin hook later)
            if (item.admin && !isAuthenticated) return null;

            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                  isActive(item.path)
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sign Out Button */}
        {isAuthenticated && (
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
            <Button
              onClick={handleSignOut}
              className="w-full bg-red-600 hover:bg-red-700 text-white flex items-center gap-2 justify-center"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        )}
      </div>

      {/* Overlay when sidebar is open on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};