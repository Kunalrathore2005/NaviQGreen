import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="card-maritime p-12 text-center flex flex-col items-center justify-center max-w-lg mx-auto border-dashed border-navy-700">
      <div className="w-14 h-14 rounded-2xl bg-cyan-brand/10 border border-cyan-brand/20 flex items-center justify-center text-cyan-brand mb-4">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-slate-400 mb-6 max-w-sm leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button onClick={onAction} className="btn-cyan text-sm">
          {actionLabel}
        </button>
      )}
    </div>
  );
};

