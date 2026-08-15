import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const Navbar = () => {
  const { user, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-600/30 group-hover:scale-105 transition-transform">
                TvN
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                  TRUTH <span className="text-slate-400 font-light">vs</span> NOISE
                </span>
                <span className="text-[10px] text-slate-400 font-medium hidden sm:inline -mt-1 tracking-wide">
                  Credibility-Weighted Voting
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Conductor Links */}
                {role === 'CONDUCTOR' && (
                  <div className="flex items-center space-x-2">
                    <Link
                      to="/conductor"
                      className={`text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                        isActive('/conductor')
                          ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/conductor/events/create"
                      className={`text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                        isActive('/conductor/events/create')
                          ? 'bg-indigo-950/80 text-indigo-300 border border-indigo-800/60'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      + Create Referendum
                    </Link>
                  </div>
                )}

                {/* Candidate Links */}
                {role === 'CANDIDATE' && (
                  <div className="flex items-center space-x-2">
                    <Link
                      to="/candidate"
                      className={`text-xs font-semibold px-3 py-2 rounded-xl transition-all ${
                        isActive('/candidate')
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      Browse Events
                    </Link>
                  </div>
                )}

                {/* User Info & Role Badge */}
                <div className="flex items-center space-x-2 pl-3 border-l border-slate-800">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-slate-200 truncate max-w-[140px]">
                      {user?.full_name}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate max-w-[140px]">
                      {user?.email}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-full font-bold border ${
                      role === 'CONDUCTOR'
                        ? 'bg-indigo-950 text-indigo-300 border-indigo-800/60'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                    }`}
                  >
                    {role}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-xs font-semibold text-slate-400 hover:text-rose-400 px-3 py-2 rounded-xl hover:bg-rose-950/30 transition-all cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-xl hover:bg-slate-800 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all"
                >
                  Register Account
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none cursor-pointer"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-900/95 px-4 pt-3 pb-4 space-y-2">
          {isAuthenticated ? (
            <>
              <div className="pb-2 border-b border-slate-800">
                <div className="text-xs font-bold text-slate-200">{user?.full_name}</div>
                <div className="text-[10px] text-slate-500">{user?.email} ({role})</div>
              </div>

              {role === 'CONDUCTOR' && (
                <>
                  <Link
                    to="/conductor"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-xs font-semibold text-slate-300 hover:text-white py-2"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/conductor/events/create"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-xs font-semibold text-slate-300 hover:text-white py-2"
                  >
                    + Create Referendum
                  </Link>
                </>
              )}

              {role === 'CANDIDATE' && (
                <Link
                  to="/candidate"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-xs font-semibold text-slate-300 hover:text-white py-2"
                >
                  Browse Events
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left text-xs font-semibold text-rose-400 py-2 cursor-pointer"
              >
                Logout
              </button>
            </>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-semibold text-slate-300 hover:text-white py-2"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-xs font-bold text-indigo-400 py-2"
              >
                Register Account
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
