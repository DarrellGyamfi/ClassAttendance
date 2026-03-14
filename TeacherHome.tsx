import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from './AuthContext';
import firestore from '@react-native-firebase/firestore';
import { Session } from './types';

const TeacherHome: React.FC = () => {
  const { user, logout } = useAuth();
  const navigation = useNavigation();
  const [activeSessions, setActiveSessions] = useState<Session[]>([]);

  useEffect(() => {
    if (!user) return;

    // First get classes taught by this teacher
    const fetchSessions = async () => {
      const classesSnapshot = await firestore()
        .collection('classes')
        .where('teacherId', '==', user.uid)
        .get();
      
      const classIds = classesSnapshot.docs.map(doc => doc.id);
      
      if (classIds.length === 0) {
        setActiveSessions([]);
        return;
      }

      // Then get active sessions for those classes
      const unsubscribe = firestore()
        .collection('sessions')
        .where('classId', 'in', classIds.slice(0, 10)) // Firestore 'in' limit is 10
        .where('status', '==', 'active')
        .onSnapshot((querySnapshot) => {
          const sessions = querySnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
          } as Session));
          setActiveSessions(sessions);
        });

      return unsubscribe;
    };

    const unsubscribe = fetchSessions();
    return () => {
      unsubscribe.then(unsub => unsub && unsub());
    };
  }, [user]);

  const navigateToSession = (sessionId: string) => {
    (navigation.navigate as any)('SessionAttendanceScreen', { sessionId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome, {user?.displayName} (Teacher)</Text>
      <Text>Teacher Dashboard</Text>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('CreateSessionScreen' as never)}>
        <Text style={styles.buttonText}>Create New Session</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('AnalyticsDashboardScreen' as never)}>
        <Text style={styles.buttonText}>View Analytics</Text>
      </TouchableOpacity>
      <Text style={styles.subtitle}>Active Sessions</Text>
      <FlatList
        data={activeSessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.sessionItem} onPress={() => navigateToSession(item.id)}>
            <Text>{(item.date as any).toDate().toDateString()} {item.startTime} - {item.endTime}</Text>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={logout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  sessionItem: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    width: '100%',
    alignItems: 'center',
  },
});

export default TeacherHome;