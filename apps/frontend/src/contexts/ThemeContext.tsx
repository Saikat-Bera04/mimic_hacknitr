"use client";

import React, { createContext, useState, useContext, useMemo } from 'react';

type ThemeContextType = {
  dynamicTextColor: string;
  setDynamicTextColor: (color: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [dynamicTextColor, setDynamicTextColor] = useState('hsl(0 0% 98%)');

  const value = useMemo(() => ({
    dynamicTextColor,
    setDynamicTextColor,
  }), [dynamicTextColor]);

  return (
    <ThemeContext.Provider value={value}>
      <div style={{ '--dynamic-text-color': dynamicTextColor } as React.CSSProperties}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
