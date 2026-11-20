import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  size = 'md',
  className = '',
  dot = true
}) => {
  const styles: Record<BadgeVariant, { bg: string; dot: string }> = {
    success: {
      bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      dot: 'bg-emerald-500'
    },
    warning: {
      bg: 'bg-amber-50 text-amber-800 border-amber-200',
      dot: 'bg-amber-500'
    },
    danger: {
      bg: 'bg-rose-50 text-rose-800 border-rose-200',
      dot: 'bg-rose-500'
    },
    info: {
      bg: 'bg-sky-50 text-sky-800 border-sky-200',
      dot: 'bg-sky-500'
    },
    neutral: {
      bg: 'bg-slate-100 text-slate-700 border-slate-200',
      dot: 'bg-slate-400'
    }
  };

  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'text-xs font-medium px-2.5 py-1';
  const current = styles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${current.bg} ${sizeClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${current.dot} shrink-0`} />}
      <span>{children}</span>
    </span>
  );
};
