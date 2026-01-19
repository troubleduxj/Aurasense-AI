
import React from 'react';
import { useTheme, getRadiusClass, ThemeColor } from '../../contexts/ThemeContext';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
}

const COLOR_MAP: Record<ThemeColor, { bg: string, text: string, hoverBg: string }> = {
    indigo: { bg: '#4f46e5', text: '#ffffff', hoverBg: '#4338ca' },
    blue: { bg: '#2563eb', text: '#ffffff', hoverBg: '#1d4ed8' },
    emerald: { bg: '#10b981', text: '#ffffff', hoverBg: '#059669' },
    rose: { bg: '#e11d48', text: '#ffffff', hoverBg: '#be123c' },
    amber: { bg: '#d97706', text: '#ffffff', hoverBg: '#b45309' },
    slate: { bg: '#475569', text: '#ffffff', hoverBg: '#334155' },
    violet: { bg: '#7c3aed', text: '#ffffff', hoverBg: '#6d28d9' },
    cyan: { bg: '#0891b2', text: '#ffffff', hoverBg: '#0e7490' },
};

export const Button: React.FC<ButtonProps> = ({ 
  className = '', 
  variant = 'primary', 
  size = 'md', 
  icon, 
  children, 
  style,
  ...props 
}) => {
  const { primaryColor, borderRadius, density, shadowMode } = useTheme();
  
  const radiusClass = getRadiusClass(borderRadius, size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'md');
  const baseStyles = `flex items-center justify-center font-bold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${radiusClass}`;
  
  // Define dynamic styles based on variant
  let dynamicStyle: React.CSSProperties = {};
  
  if (variant === 'primary') {
      const themeColors = COLOR_MAP[primaryColor];
      dynamicStyle = {
          backgroundColor: themeColors.bg,
          color: themeColors.text,
      };
      
      // Shadow Logic
      if (shadowMode === 'soft') {
          dynamicStyle.boxShadow = `0 10px 15px -3px ${themeColors.bg}40`; // Colored shadow
      } else if (shadowMode === 'hard') {
          dynamicStyle.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'; // Standard gray shadow
      } else {
          dynamicStyle.boxShadow = 'none';
      }

  } else if (variant === 'secondary') {
      dynamicStyle = {
          borderColor: '#e2e8f0', // slate-200
      };
  }

  // Combine with existing Tailwind classes for non-dynamic parts
  const staticClasses = {
    primary: "", // Handled by inline style
    secondary: `bg-white text-slate-500 border hover:shadow-sm hover:text-${primaryColor}-600 hover:border-${primaryColor}-300`, 
    danger: "bg-rose-50 text-rose-500 border border-transparent hover:bg-rose-100 hover:border-rose-200",
    success: "bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-200 hover:shadow-emerald-300",
    ghost: "bg-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50",
    outline: "bg-transparent border border-slate-200 text-slate-500 hover:border-slate-300"
  };

  // Density Mapping
  const paddingMap = {
      compact: {
          sm: "px-2 py-1 text-[10px]",
          md: "px-3 py-1.5 text-xs uppercase tracking-wider",
          lg: "px-5 py-2.5 text-sm uppercase tracking-widest"
      },
      normal: {
          sm: "px-3 py-1.5 text-[10px]",
          md: "px-5 py-2.5 text-xs uppercase tracking-wider",
          lg: "px-8 py-4 text-sm uppercase tracking-widest"
      }
  };

  const sizes = paddingMap[density];

  return (
    <button 
      className={`${baseStyles} ${staticClasses[variant]} ${sizes[size]} ${className}`} 
      style={{ ...dynamicStyle, ...style }}
      {...props}
    >
      {icon && <span className={`${children ? 'mr-2' : ''}`}>{icon}</span>}
      {children}
    </button>
  );
};
