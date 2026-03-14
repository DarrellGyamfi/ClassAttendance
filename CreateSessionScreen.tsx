import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { useAuth } from './AuthContext';
import firestore, { Timestamp } from '@react-native-firebase/firestore';
import QRCode from 'react-native-qrcode-svg';
import RNCalendarEvents from 'react-native-calendar-events';
import { Class, Session } from './types';

const CreateSessionScreen: React.FC = () => {
  const { user } = useAuth();
  const [classes, setClasses] = useState<Class[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [qrCodeValue, setQrCodeValue] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    if (user) {
      const unsubscribe = firestore()
        .collection('classes')
        .where('teacherId', '==', user.uid)
        .onSnapshot(snapshot => {
          const classList: Class[] = [];
          snapshot.forEach(doc => {
            classList.push({ id: doc.id, ...doc.data() } as Class);
          });
          setClasses(classList);
        });
      return unsubscribe;
    }
  }, [user]);

  const generateSession = async () => {
    if (!selectedClassId || !date || !startTime || !endTime) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }

    const newSessionId = firestore().collection('sessions').doc().id;
    const qrCode = newSessionId; // Use session ID as QR code value

    const sessionData: Omit<Session, 'id'> = {
      classId: selectedClassId,
      date: Timestamp.fromDate(new Date(date)),
      startTime,
      endTime,
      location,
      status: 'active',
      qrCode,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    try {
      await firestore().collection('sessions').doc(newSessionId).set(sessionData);
      setSessionId(newSessionId);
      setQrCodeValue(qrCode);
      Alert.alert('Success', 'Session created successfully!');

      // Add calendar event
      const selectedClass = classes.find(cls => cls.id === selectedClassId);
      const className = selectedClass ? selectedClass.name : 'Class Session';

      const permissionStatus = await RNCalendarEvents.requestPermissions();
      if (permissionStatus === 'authorized') {
        const startDateTime = new Date(`${date}T${startTime}:00`);
        const endDateTime = new Date(`${date}T${endTime}:00`);
        const eventDetails = {
          startDate: startDateTime.toISOString(),
          endDate: endDateTime.toISOString(),
          location: location || undefined,
        };
        try {
          await RNCalendarEvents.saveEvent(`${className} Session`, eventDetails);
        } catch (error) {
          console.error('Failed to add calendar event:', error);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create session.');
      console.error(error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Create New Session</Text>

      <Text style={styles.label}>Select Class:</Text>
      {classes.map(cls => (
        <TouchableOpacity
          key={cls.id}
          style={[styles.classOption, selectedClassId === cls.id && styles.selectedClass]}
          onPress={() => setSelectedClassId(cls.id)}
        >
          <Text>{cls.name}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>Date (YYYY-MM-DD):</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="e.g., 2023-09-15"
      />

      <Text style={styles.label}>Start Time (HH:MM):</Text>
      <TextInput
        style={styles.input}
        value={startTime}
        onChangeText={setStartTime}
        placeholder="e.g., 09:00"
      />

      <Text style={styles.label}>End Time (HH:MM):</Text>
      <TextInput
        style={styles.input}
        value={endTime}
        onChangeText={setEndTime}
        placeholder="e.g., 10:30"
      />

      <Text style={styles.label}>Location (optional):</Text>
      <TextInput
        style={styles.input}
        value={location}
        onChangeText={setLocation}
        placeholder="e.g., Room 101"
      />

      <TouchableOpacity style={styles.button} onPress={generateSession}>
        <Text style={styles.buttonText}>Create Session & Generate QR Code</Text>
      </TouchableOpacity>

      {qrCodeValue ? (
        <View style={styles.qrContainer}>
          <Text style={styles.label}>QR Code:</Text>
          <QRCode value={qrCodeValue} size={200} />
          <Text style={styles.qrText}>Session ID: {sessionId}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  classOption: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 5,
  },
  selectedClass: {
    backgroundColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  qrContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  qrText: {
    marginTop: 10,
    fontSize: 14,
  },
});

export default CreateSessionScreen;