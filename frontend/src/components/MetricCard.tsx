import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  color?: 'cyan' | 'emerald' | 'ocean' | 'amber';
  subtitle?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  trendType = 'neutral',
  color = 'cyan',
  subtitle,
}) => {
  const colorMap = {
    cyan: {
      border: 'border-cyan-brand/20',
      iconBg: 'bg-cyan-brand/10 text-cyan-brand',
      glow: 'hover:border-cyan-brand/40',
    },
    emerald: {
      border: 'border-emerald-leaf/20',
      iconBg: 'bg-emerald-leaf/10 text-emerald-glow',
      glow: 'hover:border-emerald-leaf/40',
    },
    ocean: {
      border: 'border-ocean-400/20',
      iconBg: 'bg-ocean-400/10 text-ocean-400',
      glow: 'hover:border-ocean-400/40',
    },
    amber: {
      border: 'border-amber-500/20',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'hover:border-amber-500/40',
    },
  };

  const trendColor = {
    positive: 'text-emerald-glow bg-emerald-leaf/10 border-emerald-leaf/20',
    negative: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    neutral: 'text-slate-400 bg-slate-800 border-slate-700',
  }[trendType];

  const cfg = colorMap[color];

  return (
    <div className={`card-maritime p-5 border ${cfg.border} ${cfg.glow} transition-all duration-200`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </span>
        <div className={`p-2 rounded-lg ${cfg.iconBg}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-2xl font-extrabold tracking-tight text-white">
          {value}
        </span>
        {unit && <span className="text-xs text-slate-400 font-medium">{unit}</span>}
      </div>

      <div className="flex items-center justify-between mt-2">
        {subtitle && <p className="text-[11px] text-slate-400 truncate">{subtitle}</p>}
        {trend && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${trendColor} shrink-0 ml-auto`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
};

