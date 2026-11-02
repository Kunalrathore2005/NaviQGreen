import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'navy' | 'purple';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'cyan',
  size = 'sm',
}) => {
  const variantStyles = {
    cyan: 'bg-cyan-brand/15 text-cyan-300 border-cyan-brand/30',
    emerald: 'bg-emerald-leaf/15 text-emerald-glow border-emerald-leaf/30',
    amber: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    navy: 'bg-navy-800 text-slate-300 border-navy-700',
    purple: 'bg-purple-500/15 text-purple-300 border-purple-500/30',
  }[variant];

  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
  }[size];

  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-md border ${variantStyles} ${sizeStyles}`}>
      {children}
    </span>
  );
};

