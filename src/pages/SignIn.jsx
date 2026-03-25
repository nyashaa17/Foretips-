import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import SEO from '../components/SEO';
import { Trophy } from 'lucide-react';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.');
        } else if (signInError.message.includes('Email not confirmed')) {
          setError('Please confirm your email address before signing in.');
        } else {
          setError(signInError.message);
        }
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('SignIn error:', err);
      setError('An unexpected error occurred. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      });
      if (error) throw error;
    } catch (err) {
      console.error('Google SignIn error:', err);
      setError('Failed to sign in with Google. Please try again.');
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <SEO title="Sign In" description="Sign in to your account" />
      
      <div className="flex flex-col items-center justify-center mb-8">
        <Link to="/" className="flex items-center gap-3 group mb-4">
          <div className="bg-green-500 p-2 rounded-xl shadow-sm group-hover:scale-105 transition-transform">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <span className="text-slate-900 font-black text-3xl tracking-tighter uppercase">Foretips</span>
        </Link>
        <h1 className="text-2xl font-bold text-slate-700 text-center">Welcome Back</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full p-3 mb-6 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-slate-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSignIn}>
          <div className="mb-4">
            <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
            required
            minLength={6}
          />
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
        >
          {loading ? 'Signing In...' : 'Sign In'}
        </button>
        <p className="mt-4 text-center text-sm text-slate-600">
          Don't have an account? <Link to="/signup" className="text-green-600 font-bold">Sign Up</Link>
        </p>
        </form>
      </div>
    </div>
  );
}
