
import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeColor = 'indigo' | 'blue' | 'emerald' | 'rose' | 'amber' | 'slate' | 'violet' | 'cyan';
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ThemeDensity = 'compact' | 'normal';
export type ThemeShadow = 'none' | 'soft' | 'hard';

interface ThemeState {
  primaryColor: ThemeColor;
  borderRadius: BorderRadius;
  density: ThemeDensity;
  shadowMode: ThemeShadow;
  setPrimaryColor: (color: ThemeColor) => void;
  setBorderRadius: (radius: BorderRadius) => void;
  setDensity: (d: ThemeDensity) => void;
  setShadowMode: (s: ThemeShadow) => void;
}

const ThemeContext = createContext<ThemeState | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [primaryColor, setPrimaryColor] = useState<ThemeColor>('indigo');
  const [borderRadius, setBorderRadius] = useState<BorderRadius>('xl');
  const [density, setDensity] = useState<ThemeDensity>('normal');
  const [shadowMode, setShadowMode] = useState<ThemeShadow>('soft');

  return (
    <ThemeContext.Provider value={{ 
        primaryColor, setPrimaryColor, 
        borderRadius, setBorderRadius,
        density, setDensity,
        shadowMode, setShadowMode
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper to get rounded classes based on theme
export const getRadiusClass = (radius: BorderRadius, size: 'sm' | 'md' | 'lg' = 'md') => {
    const map: Record<BorderRadius, Record<string, string>> = {
        none: { sm: 'rounded-none', md: 'rounded-none', lg: 'rounded-none' },
        sm: { sm: 'rounded-sm', md: 'rounded', lg: 'rounded-md' },
        md: { sm: 'rounded', md: 'rounded-lg', lg: 'rounded-xl' },
        lg: { sm: 'rounded-md', md: 'rounded-xl', lg: 'rounded-2xl' },
        xl: { sm: 'rounded-lg', md: 'rounded-2xl', lg: 'rounded-[32px]' }, // Our original "AuraSense" look
        full: { sm: 'rounded-xl', md: 'rounded-2xl', lg: 'rounded-3xl' } // Softer
    };
    return map[radius][size];
};
