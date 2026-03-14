import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from './AuthContext';
import TeacherHome from './TeacherHome';
import StudentHome from './StudentHome';
import CreateSessionScreen from './CreateSessionScreen';
import ScanQRScreen from './ScanQRScreen';
import AnalyticsDashboardScreen from './AnalyticsDashboardScreen';
import PrivacySettingsScreen from './PrivacySettingsScreen';
import SessionAttendanceScreen from './SessionAttendanceScreen';

const Stack = createNativeStackNavigator();

const MainStack: React.FC = () => {
  const { user } = useAuth();

  return (
    <Stack.Navigator>
      {user?.role === 'teacher' ? (
        <>
          <Stack.Screen name="TeacherHome" component={TeacherHome} />
          <Stack.Screen name="CreateSessionScreen" component={CreateSessionScreen} />
          <Stack.Screen name="SessionAttendanceScreen" component={SessionAttendanceScreen} />
          <Stack.Screen name="AnalyticsDashboardScreen" component={AnalyticsDashboardScreen} />
          <Stack.Screen name="PrivacySettingsScreen" component={PrivacySettingsScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="StudentHome" component={StudentHome} />
          <Stack.Screen name="ScanQRScreen" component={ScanQRScreen} />
          <Stack.Screen name="PrivacySettingsScreen" component={PrivacySettingsScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default MainStack;