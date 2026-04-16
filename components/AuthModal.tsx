
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        if (password.length < 8) {
          setError('Password must be at least 8 characters');
          return;
        }
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

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}?reset=true`
      });

      if (error) {
        setError(error.message);
      } else {
        setError(null);
        setResetSent(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
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
            {mode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
          </h2>
          <p className="text-slate-500 font-medium text-sm">
            {mode === 'signin'
              ? 'Sign in to access your documents and reports.'
              : 'Save your work and access your purchased reports.'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {resetSent && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-100 rounded-xl text-sm text-emerald-700">
            Password reset email sent to <strong>{email}</strong>. Check your inbox.
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
              minLength={8}
              disabled={isLoading}
              className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 disabled:opacity-50"
            />
          </div>

          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Confirm Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                disabled={isLoading}
                className="w-full bg-slate-50 border-2 border-transparent focus:border-emerald-100 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-300 disabled:opacity-50"
              />
            </div>
          )}

          {mode === 'signin' && (
             <div className="text-right">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={isLoading}
                  className="text-[10px] font-black text-[#1D9E75] uppercase tracking-widest hover:underline disabled:opacity-50"
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

        <div className="mt-10 text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
            {' '}
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
                setResetSent(false);
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
