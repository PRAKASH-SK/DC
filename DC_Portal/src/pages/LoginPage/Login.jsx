import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import styles from './StylesLogin';
import { API_URL } from '../../utils/env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { GOOGLE_WEB_CLIENT_ID } from '@env';

const { width, height } = Dimensions.get('window');

// Simple gradient component using View
const GradientView = ({ children, style }) => (
  <View style={[styles.gradientBackground, style]}>
    {children}
  </View>
);

// Simple loading dots animation
const LoadingDots = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(dot1, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot1, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(dot2, { toValue: 0, duration: 300, useNativeDriver: true }),
        Animated.timing(dot3, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <View style={styles.loadingDotsContainer}>
      <Animated.View style={[styles.loadingDot, { opacity: dot1 }]} />
      <Animated.View style={[styles.loadingDot, { opacity: dot2 }]} />
      <Animated.View style={[styles.loadingDot, { opacity: dot3 }]} />
    </View>
  );
};

const Login = ({ navigation }) => {
  console.log(API_URL);
  
  const [emailId, setEmailId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // Configure Google sign-in once
    GoogleSignin.configure({
      webClientId: GOOGLE_WEB_CLIENT_ID,
      offlineAccess: false,
    });

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!emailId.trim() || !password.trim()) {
      Alert.alert('Validation Error', 'Email and Password are required.');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        emailId,
        password,
      });

      if (response.data.token) {
        const { token, user_id, user_name, role_id, email_id, year } = response.data;
        
        if (role_id === 1 && year) {
          await AsyncStorage.setItem('year', String(year));
        } else {
          await AsyncStorage.removeItem('year');
        }
        
        await AsyncStorage.setItem('token', token);
        await AsyncStorage.setItem('user_id', String(user_id));
        console.log("User",user_id);
        await AsyncStorage.setItem('email_id', String(email_id));
        await AsyncStorage.setItem('user_name', user_name);
        await AsyncStorage.setItem('role_id', String(role_id));
        
        console.log(user_id, user_name, role_id, email_id, year);
      
        if (role_id == 1) {
          navigation.navigate('StudentLayout');
        } else if (role_id == 2) {
          navigation.navigate('FacultyLayout');
        } else if (role_id == 3) {
          navigation.navigate('AdminLayout');
        }
      } else {
        Alert.alert('Login Failed', 'An unexpected error occurred.');
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 401) {
          Alert.alert('Login Failed', 'Invalid email or password.');
        } else if (error.response.status === 403) {
          Alert.alert('Not Registered', 'No such email found. Please contact admin.', [{ text: 'OK' }]);
        } else {
          Alert.alert('Login Error', error.response.data?.message || 'An error occurred while trying to log in.');
        }
      } else {
        console.log('Login Error:', error);
        Alert.alert('Login Error', 'An error occurred while trying to log in.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const animateButton = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      // Force account chooser by clearing any previous Google session
      try {
        await GoogleSignin.signOut();
        await GoogleSignin.revokeAccess();
      } catch (e) {
        // best-effort; ignore
      }

      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.idToken;
      console.log("Id",userInfo.user.id);
      
      if (!idToken) {
        throw new Error('No ID token received from Google');
      }

      const response = await axios.post(
        `${API_URL}/api/auth/google`,
        { idToken },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000,
        }
      );

      const data = response.data;
      if (data.success) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user_id', String(data.user_id));
        console.log("User",data.user_id);
        await AsyncStorage.setItem('user_name', data.user_name);
        await AsyncStorage.setItem('email_id', data.email_id);
        await AsyncStorage.setItem('role_id', String(data.role_id));
        if (data.role_id === 1 && data.year) {
          await AsyncStorage.setItem('year', String(data.year));
        } else {
          await AsyncStorage.removeItem('year');
        }

        if (data.role_id == 1) {
          navigation.navigate('StudentLayout');
        } else if (data.role_id == 2) {
          navigation.navigate('FacultyLayout');
        } else if (data.role_id == 3) {
          navigation.navigate('AdminLayout');
        }
      } else {
        Alert.alert('Google Sign-In Failed', data.message || 'Unauthorized.');
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert('In Progress', 'Sign-in is already in progress');
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available or outdated');
      } else if (error.response) {
        if (error.response.status === 403) {
          Alert.alert('Not Registered', 'No such email found. Please contact admin.', [{ text: 'OK' }]);
        } else {
          Alert.alert('Error', error.response.data?.message || 'Server error during Google sign-in');
        }
      } else {
        Alert.alert('Error', error.message || 'An error occurred during sign-in');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar 
  barStyle="dark-content" 
  backgroundColor="#6200EE" 
  hidden={false} // must be false to see color
/>

      
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <GradientView style={styles.container}>
          <View style={styles.scrollContainer}>
            {/* Header Section */}
            <Animated.View 
              style={[
                styles.headerContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }]
                }
              ]}
            >
              <View style={styles.logoContainer}>
                <Text style={styles.logoText}>📚</Text>
              </View>
              <Text style={styles.appTitle}>DC Portal</Text>
              <Text style={styles.subtitle}>Welcome back! Please sign in to continue</Text>
            </Animated.View>

            {/* Login Form */}
            <Animated.View 
              style={[
                styles.loginBox,
                {
                  opacity: fadeAnim,
                  transform: [
                    { translateY: slideAnim },
                    { scale: scaleAnim }
                  ]
                }
              ]}
            >
              <Text style={styles.welcomeText}>Sign In</Text>

              {/* Email Input */}
              <View style={[
                styles.inputContainer,
                focusedInput === 'email' && styles.inputContainerFocused
              ]}>
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#999"
                  onChangeText={setEmailId}
                  value={emailId}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>

              {/* Password Input */}
              <View style={[
                styles.inputContainer,
                focusedInput === 'password' && styles.inputContainerFocused
              ]}>
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#999"
                  onChangeText={setPassword}
                  value={password}
                  secureTextEntry={!showPassword}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity 
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                >
                  <Text style={styles.eyeIconText}>
                    {showPassword ? '👁️' : '🙈'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <TouchableOpacity 
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
                onPress={() => {
                  animateButton();
                  handleLogin();
                }}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <View style={styles.loginButtonGradient}>
                  {isLoading ? (
                    <View style={styles.loadingContainer}>
                      <LoadingDots />
                      <Text style={styles.loginButtonText}>Signing in...</Text>
                    </View>
                  ) : (
                    <Text style={styles.loginButtonText}>SIGN IN</Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.divider} />
              </View>

              {/* Google Button */}
              <TouchableOpacity style={styles.googleButton} activeOpacity={0.8} onPress={handleGoogleSignIn} disabled={isLoading}>
                <Text style={styles.googleIcon}>🔍</Text>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </TouchableOpacity>

            </Animated.View>
          </View>
        </GradientView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default Login;


// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   TextInput,
//   TouchableOpacity,
//   StyleSheet,
//   ActivityIndicator,
//   Alert,
//   KeyboardAvoidingView,
//   Platform,
//   ScrollView,
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import axios from 'axios';
// import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
// import Config from 'react-native-config'; // or however you access . env variables

// // Configure Google Sign-In (call this once)
// GoogleSignin.configure({
//   webClientId: Config. GOOGLE_WEB_CLIENT_ID, // from Google Cloud Console
//   // iosClientId: Config.GOOGLE_IOS_CLIENT_ID, // iOS - commented out for now
//   offlineAccess: false,
// });

// const LoginScreen = ({ navigation }) => {
//   // State for email/password login
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [googleLoading, setGoogleLoading] = useState(false);

//   // Handle normal email/password login
//   const handleLogin = async () => {
//     // Validation
//     if (!email || !password) {
//       Alert.alert('Error', 'Please enter both email and password');
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await axios.post(
//         `${Config.API_URL}/api/auth/login`, // Adjust your endpoint
//         {
//           email:  email.trim(),
//           password: password,
//         },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           timeout: 10000,
//         }
//       );

//       const data = response. data;

//       if (data. success || data.token) {
//         // Store user data in AsyncStorage
//         await AsyncStorage.setItem('token', data.token);
//         await AsyncStorage.setItem('user_id', String(data.user_id));
//         await AsyncStorage. setItem('user_name', data.user_name);
//         await AsyncStorage.setItem('email_id', data.email_id);
//         await AsyncStorage.setItem('role_id', String(data.role_id));

//         // Store year only if role_id = 1
//         if (data.role_id === 1 && data.year) {
//           await AsyncStorage.setItem('year', String(data.year));
//         }

//         // Clear form
//         setEmail('');
//         setPassword('');

//         // Navigate to home screen (adjust route name as needed)
//         navigation.replace('Home'); // or 'Dashboard', 'Main', etc.
//       } else {
//         Alert.alert('Error', data.message || 'Login failed');
//       }
//     } catch (error) {
//       console.error('Login Error:', error);

//       if (error.response) {
//         // Backend returned error
//         Alert.alert(
//           'Login Failed',
//           error.response.data?.message || 'Invalid credentials'
//         );
//       } else if (error.request) {
//         // Network error
//         Alert.alert('Network Error', 'Please check your internet connection');
//       } else {
//         Alert.alert('Error', error.message || 'An error occurred');
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Handle Google Sign-In
//   const handleGoogleSignIn = async () => {
//     setGoogleLoading(true);
//     try {
//       // Check if device supports Google Play Services
//       await GoogleSignin.hasPlayServices();

//       // Get user info from Google
//       const userInfo = await GoogleSignin.signIn();

//       // Get the ID token
//       const idToken = userInfo.idToken;

//       if (!idToken) {
//         throw new Error('No ID token received from Google');
//       }

//       console.log('Google Sign-In successful, sending to backend...');

//       // Send ID token to your backend
//       const response = await axios.post(
//         `${Config.API_URL}/api/auth/google`,
//         { idToken },
//         {
//           headers: {
//             'Content-Type': 'application/json',
//           },
//           timeout:  10000,
//         }
//       );

//       const data = response.data;

//       if (data.success) {
//         // Store user data in AsyncStorage (same keys as normal login)
//         await AsyncStorage.setItem('token', data.token);
//         await AsyncStorage.setItem('user_id', String(data.user_id));
//         await AsyncStorage. setItem('user_name', data.user_name);
//         await AsyncStorage. setItem('email_id', data.email_id);
//         await AsyncStorage.setItem('role_id', String(data.role_id));

//         // Store year only if role_id = 1
//         if (data.role_id === 1 && data.year) {
//           await AsyncStorage.setItem('year', String(data.year));
//         }

//         console.log('Google sign-in successful, navigating to home...');

//         // Navigate to home screen (adjust route name as needed)
//         navigation.replace('Home'); // or 'Dashboard', 'Main', etc.
//       } else {
//         Alert.alert('Error', data.message || 'Google sign-in failed');
//       }
//     } catch (error) {
//       console.error('Google Sign-In Error:', error);

//       if (error.code === statusCodes.SIGN_IN_CANCELLED) {
//         Alert.alert('Cancelled', 'Sign-in was cancelled');
//       } else if (error. code === statusCodes.IN_PROGRESS) {
//         Alert.alert('In Progress', 'Sign-in is already in progress');
//       } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
//         Alert.alert('Error', 'Google Play Services not available or outdated');
//       } else if (error.response) {
//         // Backend error
//         Alert.alert(
//           'Error',
//           error.response.data?.message || 'Server error during Google sign-in'
//         );
//       } else {
//         Alert. alert('Error', error.message || 'An error occurred during sign-in');
//       }
//     } finally {
//       setGoogleLoading(false);
//     }
//   };

//   return (
//     <KeyboardAvoidingView
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={styles.container}
//     >
//       <ScrollView
//         contentContainerStyle={styles.scrollContainer}
//         keyboardShouldPersistTaps="handled"
//       >
//         <View style={styles.formContainer}>
//           {/* Header */}
//           <Text style={styles.title}>Welcome Back</Text>
//           <Text style={styles.subtitle}>Sign in to continue</Text>

//           {/* Email Input */}
//           <View style={styles.inputContainer}>
//             <Text style={styles.label}>Email</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter your email"
//               placeholderTextColor="#999"
//               value={email}
//               onChangeText={setEmail}
//               keyboardType="email-address"
//               autoCapitalize="none"
//               autoCorrect={false}
//               editable={! loading && !googleLoading}
//             />
//           </View>

//           {/* Password Input */}
//           <View style={styles.inputContainer}>
//             <Text style={styles.label}>Password</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="Enter your password"
//               placeholderTextColor="#999"
//               value={password}
//               onChangeText={setPassword}
//               secureTextEntry
//               autoCapitalize="none"
//               autoCorrect={false}
//               editable={!loading && !googleLoading}
//             />
//           </View>

//           {/* Forgot Password */}
//           <TouchableOpacity
//             style={styles.forgotPassword}
//             onPress={() => navigation.navigate('ForgotPassword')} // Adjust as needed
//           >
//             <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
//           </TouchableOpacity>

//           {/* Login Button */}
//           <TouchableOpacity
//             style={[styles.loginButton, (loading || googleLoading) && styles.disabledButton]}
//             onPress={handleLogin}
//             disabled={loading || googleLoading}
//           >
//             {loading ?  (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <Text style={styles.loginButtonText}>Login</Text>
//             )}
//           </TouchableOpacity>

//           {/* Divider */}
//           <View style={styles.divider}>
//             <View style={styles.dividerLine} />
//             <Text style={styles.dividerText}>OR</Text>
//             <View style={styles.dividerLine} />
//           </View>

//           {/* Google Sign-In Button */}
//           <TouchableOpacity
//             style={[styles.googleButton, (loading || googleLoading) && styles.disabledButton]}
//             onPress={handleGoogleSignIn}
//             disabled={loading || googleLoading}
//           >
//             {googleLoading ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <>
//                 {/* Optional: Add Google Icon */}
//                 <Text style={styles.googleButtonText}>🔍 Sign in with Google</Text>
//               </>
//             )}
//           </TouchableOpacity>

//           {/* Sign Up Link */}
//           <View style={styles.signupContainer}>
//             <Text style={styles.signupText}>Don't have an account? </Text>
//             <TouchableOpacity onPress={() => navigation.navigate('Register')}> {/* Adjust as needed */}
//               <Text style={styles.signupLink}>Sign Up</Text>
//             </TouchableOpacity>
//           </View>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   scrollContainer: {
//     flexGrow: 1,
//     justifyContent: 'center',
//     padding: 20,
//   },
//   formContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 24,
//     shadowColor: '#000',
//     shadowOffset: {
//       width: 0,
//       height: 2,
//     },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   title:  {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#333',
//     marginBottom: 8,
//     textAlign: 'center',
//   },
//   subtitle: {
//     fontSize: 16,
//     color: '#666',
//     marginBottom: 32,
//     textAlign: 'center',
//   },
//   inputContainer: {
//     marginBottom:  20,
//   },
//   label:  {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 8,
//   },
//   input: {
//     backgroundColor: '#f9f9f9',
//     borderWidth: 1,
//     borderColor: '#ddd',
//     borderRadius: 8,
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     fontSize: 16,
//     color: '#333',
//   },
//   forgotPassword: {
//     alignSelf: 'flex-end',
//     marginBottom: 24,
//   },
//   forgotPasswordText: {
//     color:  '#4285F4',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   loginButton: {
//     backgroundColor: '#4CAF50',
//     paddingVertical: 14,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent:  'center',
//     marginBottom: 20,
//   },
//   loginButtonText: {
//     color:  '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   disabledButton: {
//     opacity: 0.6,
//   },
//   divider: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 20,
//   },
//   dividerLine: {
//     flex: 1,
//     height: 1,
//     backgroundColor: '#ddd',
//   },
//   dividerText: {
//     marginHorizontal: 16,
//     color: '#999',
//     fontSize: 14,
//     fontWeight: '600',
//   },
//   googleButton: {
//     backgroundColor: '#4285F4',
//     paddingVertical: 14,
//     borderRadius: 8,
//     alignItems: 'center',
//     justifyContent: 'center',
//     flexDirection: 'row',
//     marginBottom: 20,
//   },
//   googleButtonText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: '600',
//   },
//   signupContainer: {
//     flexDirection: 'row',
//     justifyContent: 'center',
//     marginTop: 16,
//   },
//   signupText: {
//     color: '#666',
//     fontSize: 14,
//   },
//   signupLink: {
//     color: '#4285F4',
//     fontSize: 14,
//     fontWeight: '600',
//   },
// });

// export default LoginScreen;