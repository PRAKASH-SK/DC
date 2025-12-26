import React, { useState } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Config from 'react-native-config'; // or your env manager

// Configure Google Sign-In
GoogleSignin.configure({
  webClientId: Config.GOOGLE_WEB_CLIENT_ID, // from Google Cloud Console
//   iosClientId: Config.GOOGLE_IOS_CLIENT_ID, // optional
  offlineAccess: false,
});

const GoogleSignInButton = ({ navigation }) => {
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      // Check if device supports Google Play Services
      await GoogleSignin.hasPlayServices();

      // Get user info from Google
      const userInfo = await GoogleSignin.signIn();
      
      // Get the ID token
      const idToken = userInfo.idToken;

      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      // Send ID token to your backend
      const response = await axios.post(
        `${Config.API_URL}/api/auth/google`,
        { idToken },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      const data = response.data;

      if (data.success) {
        // Store user data in AsyncStorage (same keys as normal login)
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user_id', String(data.user_id));
        await AsyncStorage.setItem('user_name', data.user_name);
        await AsyncStorage. setItem('email_id', data.email_id);
        await AsyncStorage.setItem('role_id', String(data.role_id));
        
        // Store year only if role_id = 1
        if (data.role_id === 1 && data.year) {
          await AsyncStorage. setItem('year', String(data.year));
        }

        // Navigate to home screen (adjust route name as needed)
        navigation.replace('Home');
      } else {
        Alert.alert('Error', data.message || 'Google sign-in failed');
      }

    } catch (error) {
      console.error('Google Sign-In Error:', error);

      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Cancelled', 'Sign-in was cancelled');
      } else if (error. code === statusCodes.IN_PROGRESS) {
        Alert.alert('In Progress', 'Sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available');
      } else if (error.response) {
        // Backend error
        Alert.alert('Error', error.response.data?. message || 'Server error');
      } else {
        Alert.alert('Error', error.message || 'An error occurred during sign-in');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.googleButton}
      onPress={handleGoogleSignIn}
      disabled={loading}
    >
      {loading ?  (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.googleButtonText}>Sign in with Google</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  googleButton: {
    backgroundColor:  '#4285F4',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    flexDirection: 'row',
  },
  googleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GoogleSignInButton;