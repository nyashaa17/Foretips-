import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Home, Radio, PenTool, TrendingUp, Trophy, Calendar, LogOut, LayoutDashboard, User, Search, Activity, Shield, Medal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { hapticFeedback } from '../utils/haptics';
import clsx from 'clsx';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Error getting session:', error.message);
      }
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(currentUser?.email === 'admin@foretips.co.zw');
    }).catch(err => {
      console.warn('Exception getting session:', err);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(currentUser?.email === 'admin@foretips.co.zw');
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const allNavLinks = [
    { name: 'Home', path: '/', icon: <Home className="w-5 h-5" /> },
    { name: 'Predictions', path: '/predictions', icon: <TrendingUp className="w-5 h-5" /> },
    { name: 'Live', path: '/live', icon: <Radio className="w-5 h-5 text-red-500" /> },
    { name: 'Leagues', path: '/leagues', icon: <Shield className="w-5 h-5" /> },
    { name: 'Blog', path: '/blog', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Submit Tip', path: '/submit-tip', icon: <PenTool className="w-5 h-5" /> },
    { name: 'Leaderboard', path: '/leaderboard', icon: <Medal className="w-5 h-5" /> },
  ];

  const navLinks = allNavLinks;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="bg-green-500 p-2 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-[#0F172A] font-black text-2xl tracking-tighter uppercase">Foretips</span>
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden lg:block">
            <div className="ml-10 flex items-center space-x-2">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  onClick={() => hapticFeedback('light')}
                  className={clsx(
                    'flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap',
                    location.pathname === link.path
                      ? 'bg-slate-100 text-green-600'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
              {user ? (
                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-slate-200">
                  <Link to="/dashboard" className="text-sm font-medium text-slate-700 hover:text-green-600 flex items-center gap-2 whitespace-nowrap">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link to="/profile" className="text-sm font-medium text-slate-700 hover:text-green-600 flex items-center gap-2 whitespace-nowrap">
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                  <button onClick={handleSignOut} className="text-slate-500 hover:text-red-600 transition-colors" title="Sign Out">
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center ml-4 pl-4 border-l border-slate-200">
                  <Link to="/signin" className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-colors whitespace-nowrap">Sign In</Link>
                </div>
              )}
            </div>
          </div>
          
          {/* Mobile menu button */}
          <div className="-mr-2 flex lg:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger className="inline-flex items-center justify-center p-2 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none">
                <Menu className="block h-6 w-6" />
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px] p-0 flex flex-col bg-white">
                <SheetHeader className="p-4 border-b border-slate-100 text-left">
                  <SheetTitle className="flex items-center gap-3">
                    <div className="bg-green-500 p-1.5 rounded-lg shadow-sm">
                      <Trophy className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-[#0F172A] font-black text-xl tracking-tighter uppercase">Foretips</span>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => {
                        setIsOpen(false);
                        hapticFeedback('light');
                      }}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold transition-all',
                        location.pathname === link.path
                          ? 'bg-green-50 text-green-700'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      )}
                    >
                      <div className={clsx(
                        "p-2 rounded-lg",
                        location.pathname === link.path ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                      )}>
                        {link.icon}
                      </div>
                      {link.name}
                    </Link>
                  ))}
                </div>
                <div className="p-4 border-t border-slate-100 bg-slate-50">
                  {user ? (
                    <div className="space-y-2">
                      <Link
                        to="/dashboard"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold text-slate-700 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200"
                      >
                        <div className="p-2 rounded-lg bg-slate-200 text-slate-600">
                          <LayoutDashboard className="w-5 h-5" />
                        </div>
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl text-base font-semibold text-slate-700 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-slate-200"
                      >
                        <div className="p-2 rounded-lg bg-slate-200 text-slate-600">
                          <User className="w-5 h-5" />
                        </div>
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          handleSignOut();
                          setIsOpen(false);
                        }}
                        className="w-full text-left flex items-center gap-3 px-3 py-3 text-base font-semibold text-red-600 hover:bg-white hover:shadow-sm transition-all border border-transparent hover:border-red-100 rounded-xl"
                      >
                        <div className="p-2 rounded-lg bg-red-100 text-red-600">
                          <LogOut className="w-5 h-5" />
                        </div>
                        Sign Out
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link 
                        to="/signin" 
                        onClick={() => setIsOpen(false)} 
                        className="flex items-center justify-center w-full px-4 py-3 text-base font-bold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-sm transition-all"
                      >
                        Sign In
                      </Link>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
