import React, { createContext, useContext, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
  setIsDark: React.Dispatch<React.SetStateAction<boolean>>;
  transitionState: string;
  setTransitionState: React.Dispatch<React.SetStateAction<string>>;
  clickCoords: { x: number; y: number } | null;
  setClickCoords: React.Dispatch<React.SetStateAction<{ x: number; y: number } | null>>;
  toggleTheme: (e?: React.MouseEvent) => void;
}

const defaultContext: ThemeContextType = {
  isDark: true,
  setIsDark: () => {},
  transitionState: 'idle',
  setTransitionState: () => {},
  clickCoords: null,
  setClickCoords: () => {},
  toggleTheme: () => {},
};

const ThemeContext = createContext<ThemeContextType>(defaultContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const [transitionState, setTransitionState] = useState('idle');
  const [clickCoords, setClickCoords] = useState<{ x: number; y: number } | null>(null);

  const toggleTheme = (e?: React.MouseEvent) => {
    if (e) {
      setClickCoords({ x: e.clientX, y: e.clientY });
    }
    setTransitionState('active');
    setIsDark((prev) => !prev);
    setTimeout(() => {
      setTransitionState('idle');
    }, 1200);
  };

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        setIsDark,
        transitionState,
        setTransitionState,
        clickCoords,
        setClickCoords,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  return context || defaultContext;
};
