import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet } from 'react-native';
import { Camera, useCameraDevice, useCodeScanner } from 'react-native-vision-camera';
import { useAuth } from './AuthContext';
import firestore, { Timestamp } from '@react-native-firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { Session, Class } from './types';

const ScanQRScreen: React.FC = () => {
  const { user } = useAuth();
  const navigation = useNavigation();
  const device = useCameraDevice('back');
  const [scanned, setScanned] = useState(false);
  const [message, setMessage] = useState('');

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: async (codes) => {
      if (scanned) return;
      const code = codes[0];
      if (code && code.value) {
        setScanned(true);
        await processQR(code.value);
      }
    }
  });

  const processQR = async (qrValue: string) => {
    try {
      const sessionId = qrValue; // Assume QR contains session ID
      const sessionDoc = await firestore().collection('sessions').doc(sessionId).get();
      if (!sessionDoc.exists) {
        throw new Error('Invalid QR code: Session not found');
      }
      const session = sessionDoc.data() as Session;
      if (session.status !== 'active') {
        throw new Error('Session is not active');
      }
      const classDoc = await firestore().collection('classes').doc(session.classId).get();
      if (!classDoc.exists) {
        throw new Error('Class not found');
      }
      const classData = classDoc.data() as Class;
      if (!classData.students.includes(user!.uid)) {
        throw new Error('You are not enrolled in this class');
      }
      // Create attendance record
      await firestore().collection('attendance').add({
        sessionId,
        studentId: user!.uid,
        status: 'present',
        timestamp: Timestamp.now(),
      });
      setMessage('Attendance marked successfully!');
      setTimeout(() => navigation.goBack(), 2000);
    } catch (error: any) {
      Alert.alert('Error', error.message);
      setScanned(false); // Allow retry
    }
  };

  useEffect(() => {
    const requestPermission = async () => {
      const permission = await Camera.requestCameraPermission();
      if (permission !== 'granted') {
        Alert.alert('Camera permission required');
        navigation.goBack();
      }
    };
    requestPermission();
  }, [navigation]);

  if (!device) {
    return (
      <View style={styles.container}>
        <Text>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={!scanned}
        codeScanner={codeScanner}
      />
      {message ? (
        <Text style={styles.message}>{message}</Text>
      ) : (
        <Text style={styles.instruction}>Scan the QR code to mark attendance</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  instruction: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
  },
});

export default ScanQRScreen;