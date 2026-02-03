
import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail } from '../lib/supabase';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
        // Depending on Supabase settings, email confirmation might be required.
        // If "Enable Email Confirmations" is OFF in Supabase, this logs them in immediately.
        alert('Account created! You can now sign in.');
        setIsSignUp(false); // Switch to login view after success
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-6 font-body">
      <div className="w-full max-w-md bg-surface-dark border border-border-dark rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-primary"></div>
        
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 text-primary font-display font-bold text-3xl mb-2">
            <span className="material-symbols-outlined text-4xl">sports_tennis</span>
            <span>PadelPro</span>
          </div>
          <p className="text-text-muted text-sm">Your ultimate padel management platform</p>
        </div>

        {/* Toggle Tabs */}
        <div className="flex bg-background-dark p-1 rounded-xl mb-6">
          <button
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              !isSignUp ? 'bg-primary text-background-dark shadow-lg' : 'text-text-muted hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              isSignUp ? 'bg-primary text-background-dark shadow-lg' : 'text-text-muted hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isSignUp && (
             <div className="space-y-2 animate-in slide-in-from-left duration-300">
               <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Full Name</label>
               <input 
                 type="text" 
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 className="w-full bg-background-dark border border-border-dark rounded-xl p-4 text-white outline-none focus:border-primary transition-colors"
                 placeholder="John Doe"
                 required={isSignUp}
               />
             </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-background-dark border border-border-dark rounded-xl p-4 text-white outline-none focus:border-primary transition-colors"
              placeholder="player@example.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-text-muted tracking-widest">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-background-dark border border-border-dark rounded-xl p-4 text-white outline-none focus:border-primary transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-secondary/10 border border-secondary/30 rounded-xl text-secondary text-xs font-bold">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-primary text-background-dark font-black rounded-xl uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Access Account')}
          </button>
        </form>

        <p className="text-center text-[10px] text-text-muted mt-6 uppercase tracking-widest">
          {isSignUp ? 'Join the community today' : 'Welcome back, Champion'}
        </p>
      </div>
    </div>
  );
};
