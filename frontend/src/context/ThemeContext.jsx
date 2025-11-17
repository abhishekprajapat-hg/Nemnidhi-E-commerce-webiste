import React, { createContext, useContext, useEffect, useState } from 'react';

// Default theme 'light' hai
const initialState = {
  theme: 'light',
  setTheme: () => {},
};

const ThemeContext = createContext(initialState);

// Function jo initial theme load karega
const getInitialTheme = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const storedPrefs = window.localStorage.getItem('theme');
    if (typeof storedPrefs === 'string') {
      return storedPrefs;
    }

    const userMedia = window.matchMedia('(prefers-color-scheme: dark)');
    if (userMedia.matches) {
      return 'dark';
    }
  }
  return 'light'; // fallback
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  // Yeh effect theme change hone par <html> tag par class add/remove karega
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark';

    root.classList.remove(isDark ? 'light' : 'dark');
    root.classList.add(theme);

    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Ek custom hook taaki hum ise aasani se istemal kar sakein
export const useTheme = () => useContext(ThemeContext);