import React from 'react';
import { Switch, Text, useTheme } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../theme/ThemeContext';

const ThemeToggle = () => {
  const { isThemeDark, toggleTheme } = useAppTheme();
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      <Text style={{ marginRight: 8, color: theme.colors.onSurface }}>
        {isThemeDark ? 'Dark Mode' : 'Light Mode'}
      </Text>
      <Switch value={isThemeDark} onValueChange={toggleTheme} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 8
  }
});

export default ThemeToggle;
