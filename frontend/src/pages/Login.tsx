import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, ShieldCheck, Zap, Lock, Mail, User, ArrowRight } from 'lucide-react';
import { api } from '../services/api';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('captain@naviqgreen.maritime');
  const [password, setPassword] = useState<string>('NaviQGreen2026!');
  const [fullName, setFullName] = useState<string>('Fleet Operations Commander');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      if (isRegister) {
        await api.register({ email, password, full_name: fullName });
      } else {
        await api.login(email, password);
      }
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      await api.demoLogin();
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-4 relative overflow-hidden select-none">
      {/* Background Maritime Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-brand/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-leaf/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Auth Card */}
      <div className="card-maritime max-w-md w-full p-8 border-cyan-brand/20 shadow-2xl relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-brand to-emerald-leaf flex items-center justify-center shadow-glow-cyan mb-3">
            <Anchor className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">NaviQGreen</h1>
          <p className="text-xs text-slate-400 mt-1">
            Quantum-Inspired Green Fleet Intelligence & Optimization Platform
          </p>
          <span className="inline-block mt-2 text-[10px] font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-leaf/15 text-emerald-glow border border-emerald-leaf/30">
            SIH Problem Statement ID: SIH26138
          </span>
        </div>

        {/* Demo Fast Track Button */}
        <div className="mb-6">
          <button
            type="button"
            onClick={handleDemoAccess}
            disabled={loading}
            className="w-full btn-emerald py-2.5 text-xs flex items-center justify-center gap-2 shadow-glow-emerald font-bold"
          >
            <Zap className="w-4 h-4 fill-current text-white animate-pulse" />
            <span>1-Click Demo Commander Access</span>
          </button>
          <p className="text-[10px] text-center text-slate-400 mt-1.5">
            Instant evaluation login with full fleet, ML models, and QEA access.
          </p>
        </div>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-navy-750 w-full" />
          <span className="bg-navy-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider font-semibold absolute">
            or sign in with credentials
          </span>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isRegister && (
            <div>
              <label className="block text-slate-400 font-medium mb-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  required
                  placeholder="Elena Vance"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="input-maritime !pl-10 pr-3 py-2 w-full"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-slate-400 font-medium mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                placeholder="commander@shipping.internal"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-maritime !pl-10 pr-3 py-2 w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-maritime !pl-10 pr-3 py-2 w-full"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-cyan w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 mt-4"
          >
            <span>{isRegister ? 'Register Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-[11px] text-cyan-brand hover:underline"
          >
            {isRegister ? 'Already have an account? Sign In' : 'Need an operator account? Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

