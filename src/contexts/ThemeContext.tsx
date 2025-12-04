import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type FontSize = 'small' | 'medium' | 'large' | 'xlarge';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const fontSizeMap: Record<FontSize, string> = {
  small: '0.875rem',
  medium: '1rem',
  large: '1.125rem',
  xlarge: '1.25rem',
};

const fontSizeOrder: FontSize[] = ['small', 'medium', 'large', 'xlarge'];

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('theme');
      return (saved as Theme) || 'light';
    } catch (e) {
      return 'light';
    }
  });

  const [fontSize, setFontSizeState] = useState<FontSize>(() => {
    try {
      const saved = localStorage.getItem('fontSize');
      return (saved as FontSize) || 'medium';
    } catch (e) {
      return 'medium';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('theme', theme);
    } catch (e) {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = fontSizeMap[fontSize];
    try {
      localStorage.setItem('fontSize', fontSize);
    } catch (e) {
      // ignore
    }
  }, [fontSize]);

  const toggleTheme = () => setThemeState((t) => (t === 'dark' ? 'light' : 'dark'));
  const setTheme = (t: Theme) => setThemeState(t);
  
  const setFontSize = (size: FontSize) => setFontSizeState(size);
  
  const increaseFontSize = () => {
    setFontSizeState((current) => {
      const currentIndex = fontSizeOrder.indexOf(current);
      if (currentIndex < fontSizeOrder.length - 1) {
        return fontSizeOrder[currentIndex + 1];
      }
      return current;
    });
  };
  
  const decreaseFontSize = () => {
    setFontSizeState((current) => {
      const currentIndex = fontSizeOrder.indexOf(current);
      if (currentIndex > 0) {
        return fontSizeOrder[currentIndex - 1];
      }
      return current;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, fontSize, setFontSize, increaseFontSize, decreaseFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};

export default ThemeContext;
