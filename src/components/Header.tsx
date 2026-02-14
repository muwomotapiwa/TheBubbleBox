import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './AuthModal';
import { usePermissions } from '../hooks/usePermissions';

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const location = useLocation();
  const { user, profile, signOut, loading } = useAuth();
  const { canAccessAdmin } = usePermissions();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Pricing', path: '/pricing' },
    { name: 'Services', path: '/services' },
    { name: 'Bubble Pass', path: '/subscription' },
    ...(canAccessAdmin() ? [{ name: 'Admin', path: '/admin' }] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleSignIn = () => {
    setAuthMode('signin');
    setAuthModalOpen(true);
  };

  const handleSignUp = () => {
    setAuthMode('signup');
    setAuthModalOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    setMobileMenuOpen(false);
  };

  const userName = profile?.full_name || user?.email?.split('@')[0] || 'User';

  return (
    <>
      <header className="sticky top-0 z-50 bg-black shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <img
                src="https://af6815798a.imgdist.com/pub/bfra/knkjywkm/2no/pvb/dgk/logocroped-removebg-preview.png"
                alt="The Bubble Box Logo"
                className="h-14 w-14 rounded-full object-cover"
              />
              <span className="font-bold text-xl text-white">The Bubble Box</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`text-sm font-medium transition-colors ${
                    isActive(link.path)
                      ? 'text-[#e14171]'
                      : 'text-gray-300 hover:text-[#e14171]'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right Side Actions */}
            <div className="hidden md:flex items-center gap-4">
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-gray-700 animate-pulse" />
              ) : user ? (
                <div className="flex items-center gap-3">
                  <Link
                    to="/portal"
                    className="flex items-center gap-2 text-sm text-gray-300 hover:text-[#e14171]"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#e14171] flex items-center justify-center text-white font-medium">
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <span>{userName}</span>
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="text-gray-400 hover:text-gray-200"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleSignIn}
                    className="text-sm font-medium text-gray-300 hover:text-[#e14171]"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={handleSignUp}
                    className="text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full"
                  >
                    Sign Up
                  </button>
                </div>
              )}
              <Link
                to="/booking"
                className="bg-[#e14171] text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-[#c73562] transition-colors"
              >
                Book Now
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-white" />
              ) : (
                <Menu className="h-6 w-6 text-white" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black border-t border-gray-800">
            <div className="px-4 py-4 space-y-3">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-2 text-base font-medium ${
                    isActive(link.path) ? 'text-[#e14171]' : 'text-gray-300'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              <div className="pt-4 border-t border-gray-800">
                {user ? (
                  <div className="space-y-3">
                    <Link
                      to="/portal"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 py-2 text-gray-300"
                    >
                      <User className="h-5 w-5" />
                      <span>My Account</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 py-2 text-gray-300"
                    >
                      <LogOut className="h-5 w-5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignIn();
                      }}
                      className="w-full py-2 text-left text-gray-300 font-medium"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleSignUp();
                      }}
                      className="w-full py-2 text-left text-[#e14171] font-medium"
                    >
                      Create Account
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
