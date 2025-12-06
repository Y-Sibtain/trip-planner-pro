import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Home, LogIn, User, LayoutDashboard, MapPin, Calendar, Users, LogOut, BookOpen, Plane, Bookmark, Sun, Moon, ChevronLeft, ChevronRight, AlignLeft, Globe, Plus, Minus } from 'lucide-react';
import { useBooking } from '@/contexts/BookingContext';
import { useAdmin } from '@/hooks/useAdmin';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import ThemeSwitch from './ThemeSwitch';

export const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, signOut } = useBooking();
  const { isAdmin, loading } = useAdmin();
  const { theme, toggleTheme, increaseFontSize, decreaseFontSize } = useTheme();
  const { lang, setLang, t } = useLanguage();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/');
  };

  const navItems = [
    { path: '/', icon: Home, label: t('home'), public: true },
    { path: '/auth', icon: LogIn, label: t('sign_in'), public: true, hideIfAuth: true },
    { path: '/destinations', icon: MapPin, label: t('destinations'), public: false },
    { path: '/profile', icon: User, label: t('profile'), public: false },
    { path: '/admin', icon: LayoutDashboard, label: t('admin_dashboard'), admin: true },
    { path: '/admin/admin-bookings', icon: BookOpen, label: t('manage_bookings'), admin: true },
    { path: '/admin/destinations', icon: MapPin, label: t('manage_destinations'), admin: true },
    { path: '/admin/itineraries', icon: Calendar, label: t('manage_itineraries'), admin: true },
    { path: '/admin/users', icon: Users, label: t('manage_users'), admin: true },
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
        style={{ 
          position: 'sticky',
          top: '0',
          left: '0 !important',
          right: 'auto !important',
          insetInlineStart: 'auto !important',
          insetInlineEnd: 'auto !important',
          insetInline: 'auto !important'
        } as any}
        className={`h-screen ${isCollapsed ? 'w-20' : 'w-64'} bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-lg transform transition-all duration-300 z-40 border-r border-gray-200 dark:border-gray-700 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 flex flex-col`}
      >
        {/* Logo Section */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative z-50">
          <div className="flex items-center gap-3 justify-between">
            {/* Trip Planner Name / Icon with Hover */}
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <button
                    onClick={() => setIsCollapsed(true)}
                    className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm hover:shadow-lg transition-all group relative pointer-events-auto cursor-pointer"
                    type="button"
                  >
                    {/* Airplane icon - visible by default */}
                    <Plane className="w-4 h-4 group-hover:hidden pointer-events-none" />
                    {/* Hamburger icon - visible on hover */}
                    <Menu className="w-4 h-4 hidden group-hover:block pointer-events-none" />
                  </button>
                  <div className="absolute left-10 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs px-3 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    Collapse
                  </div>
                </div>
                <span className="font-bold text-lg text-gray-900 dark:text-white">Trip Planner</span>
              </div>
            )}
            {isCollapsed && (
              <div className="relative group">
                <button
                  onClick={() => setIsCollapsed(false)}
                  className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm mx-auto hover:shadow-lg transition-all group relative pointer-events-auto cursor-pointer"
                  type="button"
                >
                  {/* Airplane icon - visible by default */}
                  <Plane className="w-4 h-4 group-hover:hidden pointer-events-none" />
                  {/* Hamburger icon - visible on hover */}
                  <Menu className="w-4 h-4 hidden group-hover:block pointer-events-none" />
                </button>
                <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs px-3 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Expand
                </div>
              </div>
            )}
          </div>
          {!isCollapsed && isAuthenticated && (
            <>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-3">{user?.email}</p>
              {isAdmin && <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mt-1">👑 Admin Access</p>}
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2 flex-1 overflow-visible">
          {navItems.map((item) => {
            if (item.hideIfAuth && isAuthenticated) return null;
            if (!item.public && !isAuthenticated) return null;
            if (item.admin && !isAdmin) return null;

            const Icon = item.icon;
            return (
              <div key={item.path} className="relative group">
                <button
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center' : 'gap-3 px-4'} py-3 rounded-lg transition-all-smooth ${
                    isActive(item.path)
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 border border-blue-300 dark:border-blue-700'
                      : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </button>
                {isCollapsed && (
                  <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs px-3 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    {item.label}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Sign Out Button & Theme Switch */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0">
          {/* Font Size Controls Row */}
          <div className={`flex items-center ${isCollapsed ? 'flex-col gap-1 p-2' : 'gap-2 p-3'} justify-center border-b border-gray-200 dark:border-gray-700`}>
            <div className="relative group">
              <button
                onClick={decreaseFontSize}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0"
                aria-label="Decrease font size"
              >
                <Minus size={18} className="text-gray-700 dark:text-gray-300" />
              </button>
              <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs px-3 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Decrease text size
              </div>
            </div>
            {!isCollapsed && <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-1">A</span>}
            <div className="relative group">
              <button
                onClick={increaseFontSize}
                className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center flex-shrink-0"
                aria-label="Increase font size"
              >
                <Plus size={18} className="text-gray-700 dark:text-gray-300" />
              </button>
              <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs px-3 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                Increase text size
              </div>
            </div>
          </div>

          {/* Language & Theme Switch Side by Side */}
          <div className={`flex items-center ${isCollapsed ? 'gap-1 p-2 flex-col' : 'gap-2 p-3'} border-b border-gray-200 dark:border-gray-700`}>
            {/* Language selector */}
            {isCollapsed ? (
              <div className="relative w-full group">
                <button
                  onMouseEnter={() => setShowLangMenu(true)}
                  onMouseLeave={() => setShowLangMenu(false)}
                  className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0 transition-colors w-full flex items-center justify-center"
                >
                  <Globe className="w-4 h-4" />
                </button>
                <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs px-3 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Change language
                </div>
                
                {/* Dropdown menu on hover - positioned to not overflow */}
                {showLangMenu && (
                  <div 
                    className="fixed bottom-12 left-14 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50 whitespace-nowrap"
                    onMouseEnter={() => setShowLangMenu(true)}
                    onMouseLeave={() => setShowLangMenu(false)}
                  >
                    <button
                      onClick={() => { setLang('en'); setShowLangMenu(false); }}
                      className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${lang === 'en' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      English (EN)
                    </button>
                    <button
                      onClick={() => { setLang('ur'); setShowLangMenu(false); }}
                      className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${lang === 'ur' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      اردو (UR)
                    </button>
                    <button
                      onClick={() => { setLang('es'); setShowLangMenu(false); }}
                      className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${lang === 'es' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      Español (ES)
                    </button>
                    <button
                      onClick={() => { setLang('ar'); setShowLangMenu(false); }}
                      className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${lang === 'ar' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      العربية (AR)
                    </button>
                    <button
                      onClick={() => { setLang('ps'); setShowLangMenu(false); }}
                      className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${lang === 'ps' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      پشتو (PS)
                    </button>
                    <button
                      onClick={() => { setLang('sd'); setShowLangMenu(false); }}
                      className={`block w-full px-4 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${lang === 'sd' ? 'bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}
                    >
                      سنڌي (SD)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative group flex-1">
                <select
                  value={lang}
                  onChange={(e) => setLang(e.target.value as any)}
                  className="h-7 rounded-md border border-input bg-background px-2 text-xs text-foreground flex-1"
                >
                  <option value="en">English (EN)</option>
                  <option value="ur">اردو (UR)</option>
                  <option value="es">Español (ES)</option>
                  <option value="ar">العربية (AR)</option>
                  <option value="ps">پشتو (PS)</option>
                  <option value="sd">سنڌي (SD)</option>
                </select>
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs px-3 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Change your preferred language
                </div>
              </div>
            )}

            {/* Theme switch beside language */}
            <ThemeSwitch collapsed={isCollapsed} />
          </div>

          {/* Sign Out Button */}
          {isAuthenticated && (
            <div className={`${isCollapsed ? 'p-2' : 'p-3'} relative group`}>
              <Button
                onClick={handleSignOut}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition-all-smooth hover:shadow-lg flex items-center gap-2 justify-center text-sm py-2"
              >
                <LogOut className="w-4 h-4" />
                {!isCollapsed && t('sign_out')}
              </Button>
              {isCollapsed && (
                <div className="absolute left-12 top-1/2 -translate-y-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs px-3 py-1 rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Sign out
                </div>
              )}
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