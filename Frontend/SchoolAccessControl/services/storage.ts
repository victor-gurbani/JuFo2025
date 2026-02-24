import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

export const setToken = async (token: string) => {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('authToken', token);
    }
  } else {
    await SecureStore.setItemAsync('authToken', token);
  }
};

export const getToken = async () => {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('authToken');
    }
    return null;
  } else {
    return await SecureStore.getItemAsync('authToken');
  }
};

export const deleteToken = async () => {
  if (Platform.OS === 'web') {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('authToken');
    }
  } else {
    await SecureStore.deleteItemAsync('authToken');
  }
};
