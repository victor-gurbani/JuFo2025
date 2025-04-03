import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme } from './index';

type ThemeContextType = {
  theme: typeof lightTheme;
  isThemeDark: boolean;
  toggleTheme: () => void;
};

// Create context with default values
export const ThemeContext = createContext<ThemeContextType>({
  theme: lightTheme,
  isThemeDark: false,
  toggleTheme: () => {},
});

type ThemeProviderProps = {
  children: React.ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const colorScheme = useColorScheme();
  const [isThemeDark, setIsThemeDark] = useState(colorScheme === 'dark');
  
  // Update theme when system preference changes
  useEffect(() => {
    setIsThemeDark(colorScheme === 'dark');
  }, [colorScheme]);
  
  const toggleTheme = () => {
    setIsThemeDark(!isThemeDark);
  };
  
  const theme = isThemeDark ? darkTheme : lightTheme;
  
  return (
    <ThemeContext.Provider value={{ theme, isThemeDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useAppTheme = () => useContext(ThemeContext);
