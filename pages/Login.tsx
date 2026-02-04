
import React, { useState, useEffect } from 'react';
import { signInWithEmail, signUpWithEmail, resendConfirmationEmail } from '../lib/supabase';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [rememberMe, setRememberMe] = useState(true);

  // Check for errors in the URL hash (returned by Supabase auth redirects)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1)); // remove #
      const errorDescription = params.get('error_description');
      const errorCode = params.get('error_code');
      
      if (errorDescription) {
        setError(decodeURIComponent(errorDescription.replace(/\+/g, ' ')));
      }
      // If OTP expired, we definitely want them to know they need to resend
      if (errorCode === 'otp_expired') {
        setError('Verification link expired. Please resend the confirmation email.');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      if (isSignUp) {
        await signUpWithEmail(email, password, name);
        alert('Registration successful! Please check your email inbox to confirm your account.');
        setIsSignUp(false);
      } else {
        await signInWithEmail(email, password, rememberMe);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setError("Please enter your email address first.");
      return;
    }
    setLoading(true);
    try {
      await resendConfirmationEmail(email);
      alert(`Confirmation email resent to ${email}. Please check your inbox.`);
      setResendCooldown(60); // 60s cooldown
    } catch (err: any) {
      setError(err.message || "Failed to resend email.");
    } finally {
      setLoading(false);
    }
  };

  // Cooldown timer effect
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const showResendButton = error && (
    error.includes("Email not confirmed") || 
    error.includes("Verification link expired") ||
    error.includes("otp_expired")
  );

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
            onClick={() => { setIsSignUp(false); setError(null); }}
            className={`flex-1 py-3 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${
              !isSignUp ? 'bg-primary text-background-dark shadow-lg' : 'text-text-muted hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setIsSignUp(true); setError(null); }}
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

          {!isSignUp && (
            <div className="flex items-center gap-2 px-1">
              <input 
                type="checkbox" 
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="size-4 accent-primary bg-background-dark border-border-dark rounded"
              />
              <label htmlFor="rememberMe" className="text-xs text-text-muted font-bold cursor-pointer select-none">
                Keep me signed in
              </label>
            </div>
          )}

          {error && (
            <div className={`p-4 rounded-xl text-xs font-bold border flex flex-col gap-3 ${
              showResendButton
                ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-500" 
                : "bg-secondary/10 border-secondary/30 text-secondary"
            }`}>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg shrink-0">
                  {showResendButton ? "mail" : "error"}
                </span>
                <div>{error}</div>
              </div>
              
              {showResendButton && (
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={loading || resendCooldown > 0}
                  className="w-full py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 border border-yellow-500/30 rounded-lg uppercase tracking-wider text-[10px] transition-colors disabled:opacity-50"
                >
                  {resendCooldown > 0 ? `Wait ${resendCooldown}s` : 'Resend Confirmation Email'}
                </button>
              )}
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
