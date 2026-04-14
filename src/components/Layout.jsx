import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Sidebar from './Sidebar';
import WhatsAppPopup from './WhatsAppPopup';
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function Layout() {
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const syncProfile = async (currentUser) => {
      if (!currentUser) return;
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', currentUser.id)
          .maybeSingle();
          
        if (!profile) {
          const email = currentUser.email || '';
          const username = currentUser.user_metadata?.user_name || currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || email.split('@')[0] || 'user';
          
          await supabase.from('profiles').upsert([{ 
            id: currentUser.id, 
            username: username
          }]);
        }
      } catch (err) {
        console.error('Error syncing profile:', err);
      }
    };

    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.warn('Error getting session:', error.message);
      }
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(currentUser?.email === 'admin@foretips.co.zw');
      if (currentUser) syncProfile(currentUser);
    }).catch(err => {
      console.warn('Exception getting session:', err);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(currentUser?.email === 'admin@foretips.co.zw');
      if (currentUser) syncProfile(currentUser);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {user && <Sidebar user={user} isAdmin={isAdmin} handleSignOut={handleSignOut} />}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1">
          <Outlet />
        </main>
        <Footer />
      </div>
      <WhatsAppPopup />
    </div>
  );
}
