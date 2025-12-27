import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Camera, useCameraDevice } from 'react-native-vision-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import Icon from 'react-native-vector-icons/Ionicons';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

const IDScanner = ({ visible, onClose, onScanComplete }) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  
  const device = useCameraDevice('back');
  const camera = useRef(null);

  useEffect(() => {
    if (visible) {
      checkCameraPermission();
      setIsCameraReady(false);
      setIsProcessing(false);
    }
  }, [visible]);

  const checkCameraPermission = async () => {
    const permission = Platform.OS === 'ios' 
      ? PERMISSIONS.IOS.CAMERA 
      :  PERMISSIONS.ANDROID.CAMERA;

    const result = await check(permission);
    
    if (result === RESULTS. GRANTED) {
      setHasPermission(true);
    } else {
      const requestResult = await request(permission);
      setHasPermission(requestResult === RESULTS.GRANTED);
    }
  };

  // Camera initialization callback
  const onCameraInitialized = () => {
    console.log('✅ Camera initialized successfully');
    setIsCameraReady(true);
  };

  const onCameraError = (error) => {
    console.error('❌ Camera error:', error);
    Alert.alert('Camera Error', 'Failed to initialize camera. Please try again.');
  };

  // Extract Name and Registration Number from OCR text
  const extractStudentInfo = (text) => {
    console.log('📄 OCR Full Text:', text);

    let name = '';
    let regNum = '';

    // Extract Registration Number (Pattern: 7376241CS322)
    const regNumPattern = /\b\d{7}[A-Z]{2,3}\d{3}\b/i;
    const regNumMatch = text.match(regNumPattern);
    if (regNumMatch) {
      regNum = regNumMatch[0]. toUpperCase();
      console.log('🔢 Found Reg Num:', regNum);
    }

    // Extract Name
    const lines = text.split('\n').map(line => line.trim());
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (/^[A-Z\s]{5,50}$/.test(line)) {
        const skipWords = [
          'BANNARI', 'AMMAN', 'INSTITUTE', 'TECHNOLOGY',
          'PRINCIPAL', 'B. E', 'CSE', 'ECE', 'MECH', 'CIVIL',
          'EEE', 'IT', 'DEPARTMENT', 'STUDENT', 'ID', 'CARD'
        ];
        
        const hasSkipWord = skipWords.some(word => line.includes(word));
        
        if(!hasSkipWord && line.split(' ').length >= 2) {
          name = line;
          console.log('👤 Found Name:', name);
          break;
        }
      }
    }
    return { name:  name. trim(), regNum: regNum.trim() };
  };

  // Capture photo and process with OCR
  const handleCapture = async () => {
    if (!camera.current || !isCameraReady) {
      console.log('⚠️ Camera not ready');
      Alert.alert('Please Wait', 'Camera is still initializing.. .');
      return;
    }

    if (isProcessing) {
      console.log('⚠️ Already processing');
      return;
    }

    setIsProcessing(true);
    console.log('📸 Starting capture...');

    try {
      // Take photo (camera stays active)
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'balanced',
        flash: 'off',
        enableShutterSound: false,
      });

      console.log('✅ Photo captured:', photo. path);

      // Small delay to ensure file is written
      await new Promise(resolve => setTimeout(resolve, 200));

      // Process with OCR
      console.log('🔍 Starting OCR.. .');
      const result = await TextRecognition.recognize(`file://${photo.path}`);
      
      console.log('✅ OCR completed.  Text length:', result.text.length);

      const { name, regNum } = extractStudentInfo(result. text);

      if (name && regNum) {
        console.log('✅ Successfully extracted:', { name, regNum });
        onScanComplete({ name, regNum });
        handleClose();
      } else {
        console.log('❌ Extraction failed:', { name, regNum });
        
        const missing = [];
        if (!name) missing.push('name');
        if (!regNum) missing.push('registration number');
        
        Alert. alert(
          'Scan Failed',
          `Could not extract ${missing.join(' and ')}.\n\nTips:\n• Ensure good lighting\n• Hold phone steady\n• Keep card flat\n• Fill the green frame`,
          [
            { text:  'Retry', onPress: () => setIsProcessing(false) },
            { text: 'Manual Entry', onPress: handleClose }
          ]
        );
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('❌ Capture/OCR Error:', error);
      
      let errorMessage = 'Failed to scan ID card. ';
      
      if (error.message) {
        if (error.message.includes('closed')) {
          errorMessage = 'Camera connection lost. Please close and try again.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Camera permission denied. ';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert('Error', errorMessage, [
        { text: 'Retry', onPress: () => setIsProcessing(false) },
        { text: 'Close', onPress: handleClose }
      ]);
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    console.log('🚪 Closing scanner');
    setIsCameraReady(false);
    setIsProcessing(false);
    onClose();
  };

  if (!visible) return null;

  if (!device || !hasPermission) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
        <View style={styles. container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Icon name="close" size={28} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Scan ID Card</Text>
          </View>
          <View style={styles. centerContent}>
            <Icon name="camera-outline" size={64} color="#fff" />
            <Text style={styles.permissionText}>
              {! device ? 'No camera device found' : 'Camera permission required'}
            </Text>
            {!hasPermission && (
              <TouchableOpacity 
                style={styles.permissionButton}
                onPress={checkCameraPermission}
              >
                <Text style={styles. permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        {/* Camera - KEEP ACTIVE DURING PROCESSING */}
        <Camera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={visible}  // ✅ Always active when visible
          photo={true}
          onInitialized={onCameraInitialized}
          onError={onCameraError}
        />

        {/* Loading overlay */}
        {! isCameraReady && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#4ade80" />
            <Text style={styles.loadingText}>Initializing camera...</Text>
          </View>
        )}

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Icon name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan ID Card</Text>
        </View>

        {/* Scanning UI */}
        <View style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles. corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          
          <Text style={styles.instructionText}>
            {! isCameraReady && '⏳ Initializing camera...'}
            {isCameraReady && ! isProcessing && '📸 Position ID card in frame'}
            {isProcessing && '🔍 Processing... '}
          </Text>

          {/* Capture Button */}
          {isCameraReady && !isProcessing && (
            <TouchableOpacity 
              style={styles.captureButton}
              onPress={handleCapture}
              activeOpacity={0.7}
            >
              <View style={styles.captureButtonInner}>
                <Icon name="camera" size={28} color="#000" />
              </View>
            </TouchableOpacity>
          )}

          {/* Processing Indicator */}
          {isProcessing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#4ade80" />
              <Text style={styles.processingText}>Extracting text...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet. create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingOverlay: {
    ... StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems:  'center',
    zIndex: 100,
  },
  loadingText: {
    color: '#fff',
    fontSize:  18,
    fontWeight: '600',
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ?  50 : 16,
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 10,
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 16,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 260,
    height: 390,
    borderRadius: 16,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4ade80',
    borderWidth: 5,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 16,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius:  16,
  },
  bottomLeft: {
    bottom:  0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 16,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 16,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 40,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 24,
    paddingVertical:  16,
    borderRadius: 12,
    marginBottom: 30,
    fontWeight: '600',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    justifyContent: 'center',
    alignItems:  'center',
    borderWidth: 5,
    borderColor: '#4ade80',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#4ade80',
    justifyContent:  'center',
    alignItems: 'center',
  },
  processingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 24,
    borderRadius: 16,
  },
  processingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '600',
  },
  centerContent: {
    flex: 1,
    justifyContent:  'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: '#4ade80',
    paddingHorizontal: 32,
    paddingVertical:  14,
    borderRadius: 12,
  },
  permissionButtonText:  {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default IDScanner;