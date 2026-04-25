import { Button } from './ui/button';
import { NavigationProps } from '../types';
import { useState } from 'react';

// Simple SVG icon components to replace lucide-react
const MenuIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const UserIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LogOutIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export function PulsePrepNavigation({
  currentPage,
  onNavigate,
  onLogoClick,
  adminAccessVisible,
  onAdminAccess,
  isAuthenticated,
  user,
  onLogout
}: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Add smooth scrolling navigation handler
  const handleGetStartedClick = () => {
    // Scroll down to specialties section
    const specialtiesSection = document.getElementById('specialties');
    if (specialtiesSection) {
      specialtiesSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Fallback: scroll down a bit if specialties section not found
      window.scrollTo({ 
        top: window.scrollY + 500, 
        behavior: 'smooth' 
      });
    }
  };

  const navItems = [
    { label: 'Home', page: 'home' as const },
    { label: 'About', page: 'about' as const },
    { label: 'Contact', page: 'contact' as const },
    { label: 'Specialties', page: 'specialty-selection' as const },
  ];

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onLogoClick}
              className="flex items-center space-x-2 text-slate-900 hover:text-emerald-600 transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <ActivityIcon className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">PulsePrep</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.page}
                onClick={() => onNavigate(item.page)}
                className={`transition-colors ${
                  currentPage === item.page
                    ? 'text-emerald-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated && user ? (
              // Authenticated User
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3 px-3 py-2 bg-slate-100 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-sm">
                    <div className="text-slate-900">{user.name}</div>
                    <div className="text-slate-500 capitalize">
                      {user.specialty.replace('-', ' & ')}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => onNavigate('dashboard')}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Dashboard
                </Button>
                {onLogout && (
                  <Button
                    variant="ghost"
                    onClick={onLogout}
                    className="text-slate-600 hover:text-slate-900"
                  >
                    <LogOutIcon className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                )}
              </div>
            ) : (
              // Unauthenticated User
              <>
                <Button
                  variant="ghost"
                  onClick={() => onNavigate('sign-in')}
                  className="text-slate-600 hover:text-slate-900"
                >
                  Sign In
                </Button>
                <Button
                  onClick={handleGetStartedClick}
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 transition-all duration-300 hover:scale-105"
                >
                  Get Started
                </Button>
              </>
            )}

            {adminAccessVisible && (
              <Button
                variant="outline"
                size="sm"
                onClick={onAdminAccess}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                Admin
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            {isMenuOpen ? <XIcon className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-md border-b border-border shadow-lg">
            <div className="px-4 py-6 space-y-4">
              {/* Mobile User Info */}
              {isAuthenticated && user && (
                <div className="flex items-center space-x-3 px-3 py-3 bg-slate-100 rounded-lg mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-slate-900">{user.name}</div>
                    <div className="text-slate-500 text-sm capitalize">
                      {user.specialty.replace('-', ' & ')}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Items */}
              {navItems.map((item) => (
                <button
                  key={item.page}
                  onClick={() => {
                    onNavigate(item.page);
                    setIsMenuOpen(false);
                  }}
                  className={`block w-full text-left py-2 transition-colors ${
                    currentPage === item.page
                      ? 'text-emerald-600'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}

              <div className="pt-4 border-t border-border space-y-3">
                {isAuthenticated && user ? (
                  // Authenticated Mobile Menu
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        onNavigate('dashboard');
                        setIsMenuOpen(false);
                      }}
                      className="w-full justify-start text-slate-600 hover:text-slate-900"
                    >
                      Dashboard
                    </Button>
                    {onLogout && (
                      <Button
                        variant="ghost"
                        onClick={() => {
                          onLogout();
                          setIsMenuOpen(false);
                        }}
                        className="w-full justify-start text-slate-600 hover:text-slate-900"
                      >
                        <LogOutIcon className="w-4 h-4 mr-2" />
                        Sign Out
                      </Button>
                    )}
                  </>
                ) : (
                  // Unauthenticated Mobile Menu
                  <>
                    <Button
                      variant="ghost"
                      onClick={() => {
                        onNavigate('sign-in');
                        setIsMenuOpen(false);
                      }}
                      className="w-full justify-start text-slate-600 hover:text-slate-900"
                    >
                      Sign In
                    </Button>
                    <Button
                      onClick={() => {
                        handleGetStartedClick();
                        setIsMenuOpen(false);
                      }}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-0 transition-all duration-300 hover:scale-105"
                    >
                      Get Started
                    </Button>
                  </>
                )}

                {adminAccessVisible && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      onAdminAccess?.();
                      setIsMenuOpen(false);
                    }}
                    className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    Admin Access
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}