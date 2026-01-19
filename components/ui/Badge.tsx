
import React from 'react';
import { useTheme, getRadiusClass } from '../../contexts/ThemeContext';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'danger' | 'neutral' | 'primary';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', className = '', dot = false }) => {
  const { primaryColor, borderRadius } = useTheme();
  const radiusClass = getRadiusClass(borderRadius, 'sm');

  const styles = {
    success: "bg-emerald-50 text-emerald-600",
    warning: "bg-amber-50 text-amber-600",
    danger: "bg-rose-50 text-rose-600",
    neutral: "bg-slate-100 text-slate-500",
    primary: `bg-${primaryColor}-50 text-${primaryColor}-600`
  };

  const dotColors = {
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    neutral: "bg-slate-400",
    primary: `bg-${primaryColor}-500`
  };

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${radiusClass} ${styles[variant]} ${className}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`}></span>}
      {children}
    </span>
  );
};
