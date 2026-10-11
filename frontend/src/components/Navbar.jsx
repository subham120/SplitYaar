import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, User } from 'lucide-react';
import { getAllGroups, getIdentity, getToken, getUser, clearToken, clearUser } from '../lib/identity';

import Logo from './Logo';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const groups = getAllGroups();
  const token = getToken();
  const user = getUser();

  useEffect(() => {
    function handleClick(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setGroupsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    clearToken();
    clearUser();
    navigate('/');
    window.location.reload();
  };

  return (
    <nav className="bg-black text-white sticky top-0 z-50 border-b border-white/10">
      <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-16 h-12 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center no-underline text-white hover:opacity-90 transition-opacity">
          <Logo size="sm" />
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          <Link
            to="/"
            className="text-xs text-gray-300 hover:text-white no-underline transition-colors"
          >
            Home
          </Link>

          {groups.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setGroupsOpen(!groupsOpen)}
                className="text-xs text-gray-300 hover:text-white flex items-center gap-1 transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <span>My Trips</span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${groupsOpen ? 'rotate-180' : ''}`} />
              </button>

              {groupsOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white text-gray-900 rounded-xl shadow-xl border border-gray-100 py-1.5 animate-scale-in z-50">
                  <div className="px-3 py-1.5 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                    Recent Trips
                  </div>
                  {groups.map((code) => {
                    const identity = getIdentity(code);
                    return (
                      <Link
                        key={code}
                        to={`/trip/${code}`}
                        onClick={() => setGroupsOpen(false)}
                        className="block px-3 py-2 text-xs text-gray-800 no-underline hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-mono text-[11px] font-medium text-blue-600">{code}</span>
                        {identity && (
                          <span className="ml-2 text-gray-600">as {identity.memberName}</span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {token ? (
            <div className="flex items-center gap-3 pl-2 border-l border-white/20">
              <span className="text-xs text-gray-300">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-white transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                title="Sign Out"
              >
                <LogOut size={13} />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="text-xs text-gray-300 hover:text-white no-underline transition-colors flex items-center gap-1"
            >
              <User size={12} /> Sign In
            </Link>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden p-1.5 rounded text-gray-300 hover:text-white transition-colors"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {menuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="sm:hidden border-t border-hairline/50 bg-canvas animate-slide-up">
          <div className="px-4 py-3 space-y-2">
            {groups.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium text-ink-muted-48 uppercase tracking-wider">My Groups</p>
                {groups.map((code) => {
                  const identity = getIdentity(code);
                  return (
                    <Link
                      key={code}
                      to={`/trip/${code}`}
                      onClick={() => setMenuOpen(false)}
                      className="block py-2 text-sm text-ink no-underline"
                    >
                      <span className="font-mono text-xs text-ink-muted-48">{code}</span>
                      {identity && <span className="ml-2">{identity.memberName}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
            {token ? (
              <button onClick={handleLogout} className="btn-secondary w-full text-sm">
                <LogOut size={14} /> Sign Out
              </button>
            ) : (
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary w-full text-sm text-center">
                <User size={14} /> Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
