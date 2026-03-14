import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Linking } from 'react-native';
import { useAuth } from './AuthContext';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';

const PrivacySettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [exportedData, setExportedData] = useState<string>('');

  const handleViewPrivacyPolicy = () => {
    // For simplicity, open a link or show alert. Assuming a URL.
    const url = 'https://example.com/privacy-policy'; // Replace with actual URL
    Linking.openURL(url).catch(() => {
      Alert.alert('Privacy Policy', 'We collect and process your data to provide attendance tracking services. Data is stored securely and used only for app functionality.');
    });
  };

  const handleExportData = async () => {
    if (!user) return;
    try {
      const uid = user.uid;
      const data: any = {};

      // Fetch user data
      const userDoc = await firestore().collection('users').doc(uid).get();
      if (userDoc.exists()) {
        data.user = userDoc.data();
      }

      // Fetch classes if teacher
      if (user.role === 'teacher') {
        const classes = await firestore().collection('classes').where('teacherId', '==', uid).get();
        data.classes = classes.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      // Fetch sessions if teacher
      if (user.role === 'teacher' && data.classes && data.classes.length > 0) {
        const classIds = data.classes.map((c: any) => c.id).slice(0, 10); // Firestore 'in' limit is 10
        const sessions = await firestore().collection('sessions').where('classId', 'in', classIds).get();
        data.sessions = sessions.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      // Fetch attendance
      const attendance = await firestore().collection('attendance').where('studentId', '==', uid).get();
      data.attendance = attendance.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Fetch notifications
      const notifications = await firestore().collection('notifications').where('userId', '==', uid).get();
      data.notifications = notifications.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const jsonData = JSON.stringify(data, null, 2);
      setExportedData(jsonData);
      Alert.alert('Data Exported', 'Your data has been prepared. Scroll down to view.');
    } catch (error) {
      Alert.alert('Export Error', (error as Error).message);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    Alert.alert(
      'Delete Account',
      'Are you sure? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const uid = user.uid;

              // Delete user data
              await firestore().collection('users').doc(uid).delete();

              // Delete classes if teacher
              if (user.role === 'teacher') {
                const classes = await firestore().collection('classes').where('teacherId', '==', uid).get();
                for (const doc of classes.docs) {
                  await doc.ref.delete();
                  // Also delete related sessions and attendance
                  const sessions = await firestore().collection('sessions').where('classId', '==', doc.id).get();
                  for (const sDoc of sessions.docs) {
                    await sDoc.ref.delete();
                    const attendance = await firestore().collection('attendance').where('sessionId', '==', sDoc.id).get();
                    for (const aDoc of attendance.docs) {
                      await aDoc.ref.delete();
                    }
                  }
                }
              }

              // Delete attendance
              const attendance = await firestore().collection('attendance').where('studentId', '==', uid).get();
              for (const doc of attendance.docs) {
                await doc.ref.delete();
              }

              // Delete notifications
              const notifications = await firestore().collection('notifications').where('userId', '==', uid).get();
              for (const doc of notifications.docs) {
                await doc.ref.delete();
              }

              // Delete auth user
              await auth().currentUser?.delete();

              // Logout
              await logout();
              navigation.navigate('AuthStack' as never);
            } catch (error) {
              Alert.alert('Delete Error', (error as Error).message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Privacy Settings</Text>
      <TouchableOpacity style={styles.button} onPress={handleViewPrivacyPolicy}>
        <Text style={styles.buttonText}>View Privacy Policy</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={handleExportData}>
        <Text style={styles.buttonText}>Export My Data</Text>
      </TouchableOpacity>
      {exportedData ? (
        <View style={styles.dataContainer}>
          <Text style={styles.dataTitle}>Exported Data:</Text>
          <Text style={styles.dataText}>{exportedData}</Text>
        </View>
      ) : null}
      <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeleteAccount}>
        <Text style={styles.buttonText}>Delete Account</Text>
      </TouchableOpacity>
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
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  dataContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 5,
  },
  dataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  dataText: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
});

export default PrivacySettingsScreen;