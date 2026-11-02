import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Ship,
  Database,
  Gauge,
  Calculator,
  Cpu,
  Leaf,
  FlaskConical,
  History,
  FileSpreadsheet,
  Settings,
  Anchor,
  Zap,
  Globe,
  Atom,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Executive Dashboard', icon: LayoutDashboard },
  { to: '/geospatial', label: 'Maritime GIS Twin', icon: Globe, badge: 'Live GIS' },
  { to: '/fleet', label: 'Fleet Management', icon: Ship },
  { to: '/datasets', label: 'Dataset Ingestion', icon: Database },
  { to: '/prediction', label: 'Fuel ML Studio', icon: Gauge },
  { to: '/calculator', label: 'Emissions & Cost', icon: Calculator },
  { to: '/optimization', label: 'Optimization Workspace', icon: Cpu, badge: 'Quantum' },
  { to: '/quantum-lab', label: 'Quantum Q-Bit Lab', icon: Atom, badge: 'Bloch' },
  { to: '/scenarios', label: 'Alternative Fuels Lab', icon: Leaf },
  { to: '/benchmarks', label: 'Benchmark Laboratory', icon: FlaskConical },
  { to: '/history', label: 'Experiment History', icon: History },
  { to: '/reports', label: 'Reports & Exports', icon: FileSpreadsheet },
  { to: '/settings', label: 'System & Model Info', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-navy-900 border-r border-navy-750 flex flex-col h-screen sticky top-0 shrink-0 select-none z-30">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-navy-750/80 gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-cyan-brand to-emerald-leaf flex items-center justify-center shadow-glow-cyan">
          <Anchor className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-cyan-200 to-cyan-brand bg-clip-text text-transparent">
              NaviQGreen
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-leaf/20 text-emerald-glow border border-emerald-leaf/30">
              QEA
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Fleet Intelligence & Optimization</p>
        </div>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
          Core Operations
        </div>
        {NAV_ITEMS.slice(0, 7).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-brand/20 to-transparent text-cyan-brand border-l-2 border-cyan-brand font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 text-cyan-brand/80" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-cyan-brand/20 text-cyan-300 border border-cyan-brand/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
          Decarbonization & Analytics
        </div>
        {NAV_ITEMS.slice(7).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-emerald-leaf/20 to-transparent text-emerald-glow border-l-2 border-emerald-leaf font-semibold shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0 text-emerald-leaf/80" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-leaf/20 text-emerald-glow border border-emerald-leaf/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* SIH Identity Footer */}
      <div className="p-4 border-t border-navy-750/80 bg-navy-950/60">
        <div className="flex items-center gap-2 mb-1.5">
          <Zap className="w-4 h-4 text-emerald-glow animate-pulse" />
          <span className="text-xs font-semibold text-slate-300">SIH26138 Platform</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Clean & Green Technology — Maritime Decarbonization Intelligence
        </p>
      </div>
    </aside>
  );
};

