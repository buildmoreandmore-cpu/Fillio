
import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

interface AuthModalProps {
  mode: 'signin' | 'signup';
  onClose: () => void;
  onSuccess: () => void;
  setMode: (mode: 'signin' | 'signup') => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onSuccess, setMode }) => {
  const { signIn, signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setError(error.message);
          return;
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
          return;
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) {
        setError(error.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        setError(error.message);
      } else {
        setError(null);
        alert('Password reset email sent! Check your inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.2)] p-10 fade-in">
        <button
          onClick={onClose}
          className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors"
        >
          <span className="iconify text-2xl" data-icon="solar:close-circle-bold-duotone"></span>
        </button>

        <div className="text-center mb-10">
          <h2 className="text-3xl font-[900] text-slate-900 tracking-tight mb-2 uppercase">
            {mode === 'signin' ? 'Welcome Back' : 'Get Started'}
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            {mode === 'signin'
              ? 'Access your saved documents and bank links.'
              : 'Create professional docs in under 5 minutes.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
              <input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={isLoading}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 disabled:opacity-50"
              />
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
            <input
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              disabled={isLoading}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 disabled:opacity-50"
            />
          </div>

          {mode === 'signin' && (
             <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] font-black text-[#1D9E75] uppercase tracking-widest hover:underline"
                >
                  Forgot Password?
                </button>
             </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#0B2820] hover:bg-[#071E17] text-white py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-[#0B2820]/20 transition-all active:scale-95 mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Processing...
              </>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-100"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">or</span>
          </div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={isLoading}
          className="w-full mt-8 bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-900 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all disabled:opacity-50"
        >
          <span className="iconify text-xl" data-icon="simple-icons:google"></span>
          Continue with Google
        </button>

        <div className="mt-10 text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
            {' '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="text-[#1D9E75] hover:underline"
            >
              {mode === 'signin' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
