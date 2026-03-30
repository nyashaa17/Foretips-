import { Link, useLocation } from 'react-router-dom';
import { Home, Radio, PenTool, TrendingUp, Trophy, Calendar, LayoutDashboard, User, LogOut, Shield, Medal, Activity } from 'lucide-react';
import clsx from 'clsx';
import { hapticFeedback } from '../utils/haptics';

export default function Sidebar({ user, isAdmin, handleSignOut }) {
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Predictions', path: '/predictions', icon: <TrendingUp className="w-5 h-5" /> },
    { name: 'Live', path: '/live', icon: <Radio className="w-5 h-5 text-red-500" /> },
    { name: 'Leagues', path: '/leagues', icon: <Shield className="w-5 h-5" /> },
    { name: 'Blog', path: '/blog', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Submit Tip', path: '/submit-tip', icon: <PenTool className="w-5 h-5" /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Medal className="w-5 h-5" /> },
  ];

  if (isAdmin) {
    navLinks.push({ name: 'Admin', path: '/admin', icon: <Activity className="w-5 h-5" /> });
  }

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 h-screen sticky top-0">
      <div className="p-6">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="bg-green-500 p-2 rounded-xl shadow-sm">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <span className="text-[#0F172A] font-black text-xl tracking-tighter uppercase">Foretips</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navLinks.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            onClick={() => hapticFeedback('light')}
            className={clsx(
              'flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all',
              location.pathname === link.path
                ? 'bg-green-50 text-green-700'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
          >
            {link.icon}
            {link.name}
          </Link>
        ))}
      </nav>

      {user && (
        <div className="p-4 border-t border-slate-100">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link
            to="/profile"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <User className="w-5 h-5" />
            Profile
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      )}
    </aside>
  );
}
