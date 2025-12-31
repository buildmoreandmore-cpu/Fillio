
import React from 'react';

interface AuthModalProps {
  mode: 'signin' | 'signup';
  onClose: () => void;
  onSuccess: () => void;
  setMode: (mode: 'signin' | 'signup') => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ mode, onClose, onSuccess, setMode }) => {
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

        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSuccess(); }}>
          {mode === 'signup' && (
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name</label>
              <input 
                type="text" 
                placeholder="John Doe"
                required
                className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-200"
              />
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email Address</label>
            <input 
              type="email" 
              placeholder="john@example.com"
              required
              className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-200"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label>
            <input 
              type="password" 
              placeholder="••••••••"
              required
              className="w-full bg-slate-50 border-2 border-transparent focus:border-blue-100 focus:bg-white rounded-2xl px-6 py-4 outline-none transition-all font-bold text-slate-900 placeholder:text-slate-200"
            />
          </div>

          {mode === 'signin' && (
             <div className="text-right">
                <button type="button" className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Forgot Password?</button>
             </div>
          )}

          <button 
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-2xl text-[12px] font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 transition-all active:scale-95 mt-4"
          >
            {mode === 'signin' ? 'Sign In' : 'Create Account'}
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

        <button className="w-full mt-8 bg-white border-2 border-slate-100 hover:border-slate-200 text-slate-900 py-4 rounded-2xl text-[12px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all">
          <span className="iconify text-xl" data-icon="simple-icons:google"></span>
          Continue with Google
        </button>

        <div className="mt-10 text-center">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
            {' '}
            <button 
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-blue-600 hover:underline"
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
