
import React from 'react';
import { useTheme, getRadiusClass } from '../../contexts/ThemeContext';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hoverEffect = false, onClick }) => {
  const { primaryColor, borderRadius, density, shadowMode } = useTheme();
  const radiusClass = getRadiusClass(borderRadius, 'lg');
  
  // Dynamic classes
  const paddingClass = density === 'compact' ? 'p-4' : 'p-6';
  
  let shadowClass = '';
  if (shadowMode === 'none') shadowClass = 'shadow-none border border-slate-200';
  else if (shadowMode === 'soft') shadowClass = 'shadow-sm border border-slate-100'; // Default soft look
  else if (shadowMode === 'hard') shadowClass = 'shadow-md border border-slate-200'; // Standard elevated

  const hoverClass = hoverEffect 
    ? `hover:shadow-xl hover:-translate-y-1 hover:border-${primaryColor}-100 cursor-pointer transition-all duration-300` 
    : '';

  return (
    <div 
      onClick={onClick}
      className={`
        bg-white ${paddingClass} ${radiusClass} ${shadowClass} ${hoverClass}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
