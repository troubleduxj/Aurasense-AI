
import React, { useEffect } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, subtitle, children, footer, size = 'lg' }) => {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      {/* Content */}
      <div className={`relative bg-white rounded-[40px] shadow-2xl border border-white/40 w-full ${sizeClasses[size]} overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300 z-10`}>
        {/* Header */}
        <div className="p-8 border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/30 flex justify-between items-center flex-shrink-0">
           <div>
            <h3 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h3>
            {subtitle && <p className="text-[10px] text-indigo-500 font-black uppercase tracking-[0.2em] mt-1">{subtitle}</p>}
           </div>
           <button 
             onClick={onClose} 
             className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all duration-300"
           >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
           </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            {children}
        </div>

        {/* Footer */}
        {footer && (
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 flex-shrink-0">
                {footer}
            </div>
        )}
      </div>
    </div>
  );
};
