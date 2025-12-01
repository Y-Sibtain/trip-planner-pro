import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, LogIn, User, LayoutDashboard, MapPin, Calendar, Users, LogOut, BookOpen, Plane, Bookmark, Sun, Moon, ChevronLeft, ChevronRight, AlignLeft } from 'lucide-react';
import { useBooking } from '@/contexts/BookingContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import ThemeSwitch from './ThemeSwitch';

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, signOut } = useBooking();
  const { isAdmin, loading } = useAdmin();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home', public: true },
    { path: '/auth', icon: LogIn, label: 'Sign In', public: true, hideIfAuth: true },
    { path: '/destinations', icon: MapPin, label: 'Destinations', public: false },
    { path: '/profile', icon: User, label: 'Profile', public: false },
    { path: '/saved-itineraries', icon: Bookmark, label: 'Saved Itineraries', public: false },
    { path: '/admin', icon: LayoutDashboard, label: 'Admin Dashboard', admin: true },
    { path: '/admin/admin-bookings', icon: BookOpen, label: 'Manage Bookings', admin: true },
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
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-blue-600 text-white hover:scale-110 transition-all-smooth md:hidden font-bold"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-lg transform transition-all duration-300 z-40 border-r border-gray-200 dark:border-gray-700 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative md:h-screen md:sticky md:top-0 overflow-y-auto`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 justify-between">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0 hidden md:flex"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <AlignLeft className="w-5 h-5" />
            </button>
          </div>
          {!isCollapsed && isAuthenticated && (
            <>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">{user?.email}</p>
              {isAdmin && <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">👑 Admin Access</p>}
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            if (item.hideIfAuth && isAuthenticated) return null;
            if (!item.public && !isAuthenticated) return null;
            if (item.admin && !isAdmin) return null;

            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-lg transition-all-smooth ${
                  isActive(item.path)
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                }`}
                title={isCollapsed ? item.label : ''}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Sign Out Button & Theme Switch */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          {/* Theme Switch */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-center'} p-4 border-b border-gray-200 dark:border-gray-700`}>
            <ThemeSwitch />
          </div>

          {/* Sign Out Button */}
          {isAuthenticated && (
            <div className="p-4">
              <Button
                onClick={handleSignOut}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all-smooth hover:shadow-lg flex items-center gap-2 justify-center"
              >
                <LogOut className="w-4 h-4" />
                {!isCollapsed && 'Sign Out'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Overlay when sidebar is open on mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm z-30 md:hidden transition-all-smooth"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};