import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useAuth } from './AuthContext';
import firestore from '@react-native-firebase/firestore';
import { Class, Session, Attendance } from './types';

const screenWidth = Dimensions.get('window').width;

interface AnalyticsData {
  overallRate: number;
  trendData: { labels: string[]; datasets: { data: number[] }[] };
  perClassData: { labels: string[]; datasets: { data: number[] }[] };
}

const AnalyticsDashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      try {
        // Get classes for the teacher
        const classesSnapshot = await firestore()
          .collection('classes')
          .where('teacherId', '==', user.uid)
          .get();
        const classes = classesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Class));

        if (classes.length === 0) {
          setAnalytics({ overallRate: 0, trendData: { labels: [], datasets: [{ data: [] }] }, perClassData: { labels: [], datasets: [{ data: [] }] } });
          setLoading(false);
          return;
        }

        const classIds = classes.map(c => c.id);

        // Get sessions for these classes
        const sessionsSnapshot = await firestore()
          .collection('sessions')
          .where('classId', 'in', classIds.slice(0, 10)) // Firestore 'in' limit is 10
          .get();
        const sessions = sessionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));

        if (sessions.length === 0) {
          setAnalytics({ overallRate: 0, trendData: { labels: [], datasets: [{ data: [] }] }, perClassData: { labels: [], datasets: [{ data: [] }] } });
          setLoading(false);
          return;
        }

        const sessionIds = sessions.map(s => s.id);

        // Get attendance for these sessions
        const attendanceSnapshot = await firestore()
          .collection('attendance')
          .where('sessionId', 'in', sessionIds.slice(0, 10))
          .get();
        const attendances = attendanceSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Attendance));

        // Calculate overall rate
        const totalRecords = attendances.length;
        const presentCount = attendances.filter(a => a.status === 'present').length;
        const overallRate = totalRecords > 0 ? (presentCount / totalRecords) * 100 : 0;

        // Trends over time: group by date
        const dateMap: { [date: string]: { total: number; present: number } } = {};
        attendances.forEach(att => {
          const session = sessions.find(s => s.id === att.sessionId);
          if (session) {
            const dateStr = (session.date as any).toDate().toISOString().split('T')[0];
            if (!dateMap[dateStr]) dateMap[dateStr] = { total: 0, present: 0 };
            dateMap[dateStr].total++;
            if (att.status === 'present') dateMap[dateStr].present++;
          }
        });
        const sortedDates = Object.keys(dateMap).sort();
        const trendLabels = sortedDates;
        const trendData = sortedDates.map(date => dateMap[date].total > 0 ? (dateMap[date].present / dateMap[date].total) * 100 : 0);

        // Per-class stats
        const classMap: { [classId: string]: { name: string; total: number; present: number } } = {};
        classes.forEach(cls => {
          classMap[cls.id] = { name: cls.name, total: 0, present: 0 };
        });
        attendances.forEach(att => {
          const session = sessions.find(s => s.id === att.sessionId);
          if (session && classMap[session.classId]) {
            classMap[session.classId].total++;
            if (att.status === 'present') classMap[session.classId].present++;
          }
        });
        const perClassLabels = Object.values(classMap).map(c => c.name);
        const perClassData = Object.values(classMap).map(c => c.total > 0 ? (c.present / c.total) * 100 : 0);

        setAnalytics({
          overallRate,
          trendData: { labels: trendLabels, datasets: [{ data: trendData }] },
          perClassData: { labels: perClassLabels, datasets: [{ data: perClassData }] }
        });
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading analytics...</Text>
      </View>
    );
  }

  if (!analytics) {
    return (
      <View style={styles.container}>
        <Text>No data available</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Attendance Analytics</Text>
      <Text style={styles.metric}>Overall Attendance Rate: {analytics.overallRate.toFixed(2)}%</Text>

      <Text style={styles.subtitle}>Attendance Trends Over Time</Text>
      {analytics.trendData.labels.length > 0 ? (
        <LineChart
          data={analytics.trendData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: '#e26a00',
            backgroundGradientFrom: '#fb8c00',
            backgroundGradientTo: '#ffa726',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
            propsForDots: {
              r: '6',
              strokeWidth: '2',
              stroke: '#ffa726',
            },
          }}
          bezier
          style={styles.chart}
        />
      ) : (
        <Text>No trend data</Text>
      )}

      <Text style={styles.subtitle}>Per-Class Attendance Rates</Text>
      {analytics.perClassData.labels.length > 0 ? (
        <BarChart
          data={analytics.perClassData}
          width={screenWidth - 40}
          height={220}
          yAxisLabel=""
          yAxisSuffix="%"
          chartConfig={{
            backgroundColor: '#1cc910',
            backgroundGradientFrom: '#43a047',
            backgroundGradientTo: '#66bb6a',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          style={styles.chart}
        />
      ) : (
        <Text>No per-class data</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  metric: {
    fontSize: 18,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});

export default AnalyticsDashboardScreen;