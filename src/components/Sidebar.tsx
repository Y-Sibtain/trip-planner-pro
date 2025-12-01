import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, LogIn, User, LayoutDashboard, MapPin, Calendar, Users, LogOut, BookOpen, Plane, Bookmark, Sun, Moon, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useBooking } from '@/contexts/BookingContext';
import { useAdmin } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, signOut } = useBooking();
  const { isAdmin, loading } = useAdmin();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  // Collapsed state for desktop sidebar
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('sidebar-collapsed') === '1';
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('sidebar-collapsed', collapsed ? '1' : '0');
    } catch (e) {
      // ignore
    }
  }, [collapsed]);

  const { theme, toggleTheme } = useTheme();

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
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition md:hidden"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen ${collapsed ? 'w-20' : 'w-64'} bg-gray-900 text-white shadow-lg transform transition-all duration-300 z-60 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:relative md:h-screen md:sticky md:top-0 overflow-y-auto`}
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-700 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-8 h-8 text-indigo-400" />
            {!collapsed && <h1 className="text-xl font-bold">Trip Planner</h1>}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCollapsed(!collapsed)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="p-1 rounded hover:bg-gray-800"
            >
              {collapsed ? <ChevronsRight className="w-5 h-5" /> : <ChevronsLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-gray-700">
          {isAuthenticated && (
            <div className={`flex flex-col gap-1 ${collapsed ? 'items-center' : ''}`}>
              <p className={`text-sm text-gray-400 ${collapsed ? 'hidden' : 'block'}`}>{user?.email}</p>
              {isAdmin && !collapsed && <p className="text-xs text-indigo-400 font-semibold">Admin</p>}
              {/* Theme toggle displayed as icon when collapsed */}
              <div className="mt-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-800"
                  title="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  {!collapsed && <span className="text-sm">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>}
                </button>
              </div>
            </div>
          )}
          {!isAuthenticated && (
            <div className="mt-2">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1 rounded hover:bg-gray-800"
                title="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {!collapsed && <span className="text-sm">{theme === 'dark' ? 'Light' : 'Dark'} mode</span>}
              </button>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            // Skip if hideIfAuth is true and user is authenticated
            if (item.hideIfAuth && isAuthenticated) return null;
            // Skip if not public and user is not authenticated
            if (!item.public && !isAuthenticated) return null;
            // Skip admin items if user is not an admin
            if (item.admin && !isAdmin) return null;

            const Icon = item.icon;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-lg transition ${
                  isActive(item.path)
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
                title={item.label}
              >
                <Icon className="w-5 h-5" />
                {!collapsed && <span>{item.label}</span>}
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
              {!collapsed && 'Sign Out'}
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