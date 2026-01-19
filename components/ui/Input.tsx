
import React from 'react';
import { useTheme, getRadiusClass } from '../../contexts/ThemeContext';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({ label, icon, className = '', ...props }) => {
  const { primaryColor, borderRadius, density } = useTheme();
  const radiusClass = getRadiusClass(borderRadius, 'md');

  // Padding based on density
  const pyClass = density === 'compact' ? 'py-2' : 'py-3.5';

  return (
    <div className="w-full">
      {label && <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</label>}
      <div className="relative">
        <input 
          className={`
            w-full bg-slate-50 border border-slate-100 
            font-bold text-slate-700 text-sm outline-none 
            focus:ring-4 focus:ring-${primaryColor}-100 focus:border-${primaryColor}-400 focus:bg-white
            transition-all placeholder-slate-300 ${radiusClass}
            ${icon ? 'pl-10' : 'px-5'} ${pyClass}
            ${className}
          `}
          {...props} 
        />
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  icon?: React.ReactNode;
  options?: { label: string; value: string | number }[];
}

export const Select: React.FC<SelectProps> = ({ label, icon, options, children, className = '', ...props }) => {
  const { primaryColor, borderRadius, density } = useTheme();
  const radiusClass = getRadiusClass(borderRadius, 'md');
  const pyClass = density === 'compact' ? 'py-2' : 'py-3.5';

  return (
    <div className="w-full">
      {label && <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{label}</label>}
      <div className="relative">
        <select 
          className={`
            w-full bg-slate-50 border border-slate-100 
            font-bold text-slate-700 text-sm outline-none appearance-none cursor-pointer
            focus:ring-4 focus:ring-${primaryColor}-100 focus:border-${primaryColor}-400 focus:bg-white
            transition-all ${radiusClass}
            ${icon ? 'pl-10' : 'px-5'} ${pyClass}
            ${className}
          `}
          {...props}
        >
          {options ? options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          )) : children}
        </select>
        {icon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {icon}
          </div>
        )}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
        </div>
      </div>
    </div>
  );
};
