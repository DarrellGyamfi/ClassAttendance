import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import firestore from '@react-native-firebase/firestore';
import { useAuth } from './AuthContext';
import { Attendance, Session } from './types';

interface AttendanceWithSession extends Attendance {
  session?: Session;
}

const AttendanceHistoryScreen: React.FC = () => {
  const { user } = useAuth();
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceWithSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = firestore()
      .collection('attendance')
      .where('studentId', '==', user.uid)
      .onSnapshot(async (querySnapshot) => {
        const attendances = querySnapshot.docs.map(doc => doc.data() as Attendance);
        // Fetch session details for each attendance
        const recordsWithSessions = await Promise.all(
          attendances.map(async (att) => {
            const sessionDoc = await firestore().collection('sessions').doc(att.sessionId).get();
            const session = sessionDoc.exists() ? (sessionDoc.data() as Session) : undefined;
            return { ...att, session };
          })
        );
        setAttendanceRecords(recordsWithSessions);
        setLoading(false);
      });

    return unsubscribe;
  }, [user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance History</Text>
      <FlatList
        data={attendanceRecords}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.recordItem}>
            <Text>Session: {item.session?.date ? (item.session.date as any).toDate().toDateString() : 'N/A'} {item.session?.startTime} - {item.session?.endTime}</Text>
            <Text>Status: {item.status}</Text>
            <Text>Timestamp: {(item.timestamp as any).toDate().toLocaleString()}</Text>
          </View>
        )}
      />
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
  recordItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    marginBottom: 10,
  },
});

export default AttendanceHistoryScreen;