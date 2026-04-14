import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User, Mail, TrendingUp, Award, Clock } from 'lucide-react';

export default function UserProfile() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ username: '', email: '' });
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.warn('Error getting user:', error.message);
      }
      if (user) {
        setUser(user);
        const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
        
        if (profileData) {
          setProfile({ username: profileData.username, email: user.email });
        } else {
          const email = user.email || '';
          const username = user.user_metadata?.user_name || user.user_metadata?.full_name || user.user_metadata?.name || email.split('@')[0] || 'user';
          
          const { data: newProfile } = await supabase.from('profiles').upsert([{ 
            id: user.id, 
            username: username
          }]).select().maybeSingle();
          
          if (newProfile) {
            setProfile({ username: newProfile.username, email: user.email });
          }
        }
        
        const { data: tipsData } = await supabase.from('community_tips').select('*').eq('user_id', user.id);
        if (tipsData) setTips(tipsData);
      }
    } catch (err) {
      console.warn('Exception getting user:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    const { error } = await supabase.from('profiles').update({ username: profile.username }).eq('id', user.id);
    if (error) alert(error.message);
    else setEditing(false);
  };

  const wonTips = tips.filter(t => t.status === 'won').length;
  const successRate = tips.length > 0 ? ((wonTips / tips.length) * 100).toFixed(1) : 0;

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-black text-slate-900 mb-8">My Profile</h1>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Account Details</h2>
          <button onClick={() => editing ? updateProfile() : setEditing(true)} className="text-sm font-bold text-green-600 hover:text-green-700">
            {editing ? 'Save' : 'Edit'}
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1">Username</label>
            <input 
              value={profile.username} 
              onChange={(e) => setProfile({...profile, username: e.target.value})}
              disabled={!editing}
              className="w-full p-3 rounded-lg border border-slate-200"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-500 mb-1">Email</label>
            <input 
              value={profile.email} 
              disabled
              className="w-full p-3 rounded-lg border border-slate-200 bg-slate-50"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center text-slate-500 mb-2">
            <TrendingUp className="w-5 h-5 mr-2" /> Success Rate
          </div>
          <div className="text-4xl font-black text-green-600">{successRate}%</div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center text-slate-500 mb-2">
            <Award className="w-5 h-5 mr-2" /> Total Tips
          </div>
          <div className="text-4xl font-black text-slate-900">{tips.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-xl font-bold mb-6">Prediction History</h2>
        <div className="space-y-4">
          {tips.map((tip, index) => (
            <div key={`${tip.id}-${index}`} className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border border-slate-100">
              <div>
                <div className="font-bold">
                  {typeof tip.prediction === 'string' ? (
                    (() => {
                      try {
                        const p = JSON.parse(tip.prediction);
                        return typeof p === 'object' ? `${p.team || ''} ${p.prediction || ''}` : tip.prediction;
                      } catch {
                        return tip.prediction;
                      }
                    })()
                  ) : (
                    tip.prediction.team || tip.prediction
                  )}
                </div>
                <div className="text-sm text-slate-500">{new Date(tip.created_at).toLocaleDateString()}</div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${tip.status === 'won' ? 'bg-green-100 text-green-800' : tip.status === 'lost' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'}`}>
                {tip.status.toUpperCase()}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
