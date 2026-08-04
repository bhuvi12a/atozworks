import { Platform } from 'react-native';

// Dynamically determine the backend API URL.
// 192.168.88.4 is the local IP of your development computer.
const getApiUrl = () => {
  if (__DEV__) {
    return 'http://192.168.88.4:5000/api/v1';
  }
  // Production URL (Render Live Backend)
  return 'https://atozworks.onrender.com/api/v1'; 
};

export const API_URL = getApiUrl();
export const GOOGLE_MAPS_API_KEY = ''; // To be configured by the user if needed
