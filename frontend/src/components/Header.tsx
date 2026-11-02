import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Cpu, Play, UserCircle, LogOut } from 'lucide-react';
import { api } from '../services/api';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isHealthy, setIsHealthy] = useState<boolean>(true);

  useEffect(() => {
    setUser(api.getCurrentUser());
    api.checkHealth()
      .then((res) => setIsHealthy(res.status === 'online'))
      .catch(() => setIsHealthy(false));
  }, []);

  const handleLogout = () => {
    api.logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-navy-900/90 backdrop-blur-md border-b border-navy-750 px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: System Status Pills */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-800 border border-navy-700 text-xs">
          <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-eco animate-pulse' : 'bg-rose-500'}`} />
          <span className="text-slate-300 font-medium">
            {isHealthy ? 'API Engine Connected' : 'Backend Reconnecting'}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-deep/20 border border-cyan-brand/30 text-xs text-cyan-300">
          <Cpu className="w-3.5 h-3.5 text-cyan-brand" />
          <span>Quantum Rotation Solver Ready</span>
        </div>
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/optimization')}
          className="btn-cyan text-xs py-2 px-3.5 flex items-center gap-1.5 font-semibold"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>Launch Optimization</span>
        </button>

        {user ? (
          <div className="flex items-center gap-2 pl-2 border-l border-navy-750">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-navy-800 border border-navy-700">
              <UserCircle className="w-4 h-4 text-cyan-brand" />
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-200 leading-none">
                  {user.full_name || 'Fleet Manager'}
                </p>
                <p className="text-[10px] text-slate-400 leading-tight">
                  {user.role || 'commander'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 rounded-lg bg-navy-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-300 border border-navy-700 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/login')}
            className="btn-ghost-marine text-xs py-2 px-3"
          >
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};

