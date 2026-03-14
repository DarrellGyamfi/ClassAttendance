import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import firestore, { Timestamp } from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';
import { Attendance, Session, Class, User } from './types';

interface RouteParams {
  sessionId: string;
}

const SessionAttendanceScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { sessionId } = route.params as RouteParams;
  const { user } = useAuth();
  const [presentStudents, setPresentStudents] = useState<User[]>([]);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch session details
    const sessionUnsubscribe = firestore()
      .collection('sessions')
      .doc(sessionId)
      .onSnapshot((doc) => {
        if (doc.exists()) {
          setSession(doc.data() as Session);
        }
      });

    // Real-time listener for attendance
    const attendanceUnsubscribe = firestore()
      .collection('attendance')
      .where('sessionId', '==', sessionId)
      .where('status', '==', 'present')
      .onSnapshot(async (querySnapshot) => {
        const attendances = querySnapshot.docs.map(doc => doc.data() as Attendance);
        const studentIds = attendances.map(att => att.studentId);
        if (studentIds.length > 0) {
          const usersSnapshot = await firestore()
            .collection('users')
            .where('uid', 'in', studentIds)
            .get();
          const users = usersSnapshot.docs.map(doc => doc.data() as User);
          setPresentStudents(users);
        } else {
          setPresentStudents([]);
        }
        setLoading(false);
      });

    return () => {
      sessionUnsubscribe();
      attendanceUnsubscribe();
    };
  }, [sessionId]);

  const endSession = async () => {
    if (!session) return;
    try {
      // Update session status to completed
      await firestore().collection('sessions').doc(sessionId).update({
        status: 'completed',
        updatedAt: Timestamp.now(),
      });

      // Fetch class to get enrolled students
      const classDoc = await firestore().collection('classes').doc(session.classId).get();
      if (classDoc.exists()) {
        const classData = classDoc.data() as Class;
        const enrolledStudents = classData.students;

        // Get present student IDs
        const presentIds = presentStudents.map(s => s.uid);

        // Mark absent for remaining students
        const absentPromises = enrolledStudents
          .filter(studentId => !presentIds.includes(studentId))
          .map(studentId =>
            firestore().collection('attendance').add({
              sessionId,
              studentId,
              status: 'absent',
              timestamp: Timestamp.now(),
              markedBy: user?.uid,
            })
          );

        await Promise.all(absentPromises);
      }

      Alert.alert('Success', 'Session ended and attendance finalized.');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to end session.');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Session Attendance</Text>
      <Text>Present Students: {presentStudents.length}</Text>
      <FlatList
        data={presentStudents}
        keyExtractor={(item) => item.uid}
        renderItem={({ item }) => (
          <View style={styles.studentItem}>
            <Text>{item.displayName}</Text>
          </View>
        )}
      />
      <TouchableOpacity style={styles.button} onPress={endSession}>
        <Text style={styles.buttonText}>End Session</Text>
      </TouchableOpacity>
    </View>
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
  },
  studentItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  button: {
    backgroundColor: '#dc3545',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default SessionAttendanceScreen;