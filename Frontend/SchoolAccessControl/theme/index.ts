import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Extend the default themes
export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Custom colors for light theme
    success: '#4CAF50',
    error: '#f44336',
    warning: '#FFC107',
    cardBg: '#ffffff',
    cardBorder: '#e0e0e0',
    placeholder: '#666666',
    skeleton: '#e0e0e0',
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Custom colors for dark theme
    success: '#66bb6a',
    error: '#ef5350',
    warning: '#ffca28',
    cardBg: '#1e1e1e',
    cardBorder: '#333333',
    placeholder: '#aaaaaa',
    skeleton: '#424242',
  },
};
