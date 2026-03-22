import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from './src/context/AuthContext';
import { WelcomeScreen } from './src/screens/auth/WelcomeScreen';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { ForgotPasswordScreen } from './src/screens/auth/ForgotPasswordScreen';
import { SupportCenterScreen } from './src/screens/auth/SupportCenterScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { RegistrationSuccessScreen } from './src/screens/auth/RegistrationSuccessScreen';
import { ResetPasswordCompletionScreen } from './src/screens/auth/ResetPasswordCompletionScreen';
import { DashboardScreen } from './src/screens/dashboard/DashboardScreen';
import { NotificationScreen } from './src/screens/dashboard/NotificationScreen';
import { HistoryScreen } from './src/screens/dashboard/HistoryScreen';
import { ReceiptsScreen } from './src/screens/dashboard/ReceiptsScreen';
import { CalendarScreen } from './src/screens/dashboard/CalendarScreen';
import { DocumentsScreen } from './src/screens/dashboard/DocumentsScreen';
import { SettingsScreen } from './src/screens/dashboard/SettingsScreen';
import { ProfileScreen } from './src/screens/dashboard/ProfileScreen';
import { IdentityCardScreen } from './src/screens/dashboard/IdentityCardScreen';
import SecurityScreen from './src/screens/dashboard/SecurityScreen';
import PaymentMethodsScreen from './src/screens/dashboard/PaymentMethodsScreen';
import { PaymentWebViewScreen } from './src/screens/dashboard/PaymentWebViewScreen';
import { AdminDashboardScreen } from './src/screens/admin/AdminDashboardScreen';
import { AdminStudentsScreen } from './src/screens/admin/AdminStudentsScreen';
import { AdminFeeStructureScreen } from './src/screens/admin/AdminFeeStructureScreen';
import { AdminPaymentsScreen } from './src/screens/admin/AdminPaymentsScreen';
import { AdminAnalyticsScreen } from './src/screens/admin/AdminAnalyticsScreen';
import { AdminStudentDetailScreen } from './src/screens/admin/AdminStudentDetailScreen';
import { AdminSettingsScreen } from './src/screens/admin/AdminSettingsScreen';
import { AdminAddStudentScreen } from './src/screens/admin/AdminAddStudentScreen';
import { AdminNotificationsScreen } from './src/screens/admin/AdminNotificationsScreen';
import { AdminResetRequestsScreen } from './src/screens/admin/AdminResetRequestsScreen';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomNav } from './src/components/navigation/BottomNav';
import { AdminBottomNav } from './src/components/navigation/AdminBottomNav';
import { PanResponder, View } from 'react-native';
import { NavContext } from './src/context/NavContext';
import { BioLockScreen } from './src/screens/auth/BioLockScreen';
import { useAuth } from './src/context/AuthContext';

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  ForgotPassword: undefined;
  ResetPasswordCompletion: { requestId?: string };
  SupportCenter: undefined;
  Register: undefined;
  RegistrationSuccess: { user: any; student: any; token: string };
  BioLock: undefined;
  MainTabs: { screen: string } | undefined;
  AdminTabs: { screen: string } | undefined;
  Notification: undefined;
  Calendar: undefined;
  Profile: undefined;
  DigitalIdentityCard: undefined;
  Security: undefined;
  PaymentMethods: undefined;
  PaymentWebView: { checkoutUrl: string };
  AdminStudentDetail: { studentId: string };
  AdminAddStudent: undefined;
  AdminNotifications: undefined;
  AdminFeeStructure: undefined;
  AdminAnalytics: undefined;
  AdminPayments: undefined;
  AdminSettings: undefined;
  AdminResetRequests: undefined;
  Dashboard: undefined;
  History: undefined;
  Receipts: undefined;
  Documents: undefined;
  Settings: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator 
      initialRouteName="Dashboard" 
      tabBar={props => <BottomNav {...props} />} 
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Receipts" component={ReceiptsScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Documents" component={DocumentsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator 
      initialRouteName="AdminDashboard" 
      tabBar={props => <AdminBottomNav {...props} />} 
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="AdminDashboard" component={AdminDashboardScreen} />
      <Tab.Screen name="AdminStudents" component={AdminStudentsScreen} />
      <Tab.Screen name="AdminFeeStructure" component={AdminFeeStructureScreen} />
      <Tab.Screen name="AdminPayments" component={AdminPaymentsScreen} />
      <Tab.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
    </Tab.Navigator>
  );
}

function AppContent() {
  const { isAuthenticated, isBioEnabled, isBioVerified, isLoading, token, user } = useAuth();
  const [isNavVisible, setIsNavVisible] = React.useState(true);
  const idleTimer = React.useRef<NodeJS.Timeout | null>(null);

  const resetIdleTimer = () => {
    setIsNavVisible(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      setIsNavVisible(false);
    }, 3000); // 3 seconds idle time
  };

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () => {
        resetIdleTimer();
        return false; // let touch pass through
      },
      onMoveShouldSetPanResponderCapture: () => {
        resetIdleTimer();
        return false;
      },
    })
  ).current;

  React.useEffect(() => {
    resetIdleTimer();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  if (isLoading) return null;

  return (
    <NavContext.Provider value={{ isNavVisible }}>
      <View style={{ flex: 1 }} {...panResponder.panHandlers}>
        <NavigationContainer>
          <StatusBar style="light" />
          <Stack.Navigator 
            screenOptions={{ 
              headerShown: false,
              animation: 'fade_from_bottom', 
            }}
          >
            {!token ? (
              <>
                <Stack.Screen name="Welcome" component={WelcomeScreen} />
                <Stack.Screen name="Login" component={LoginScreen} />
                <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                <Stack.Screen name="ResetPasswordCompletion" component={ResetPasswordCompletionScreen} />
                <Stack.Screen name="SupportCenter" component={SupportCenterScreen} />
                <Stack.Screen name="Register" component={RegisterScreen} />
                <Stack.Screen name="RegistrationSuccess" component={RegistrationSuccessScreen} />
              </>
            ) : (isBioEnabled && !isBioVerified) ? (
              <Stack.Screen name="BioLock" component={BioLockScreen} />
            ) : (
              <>
                {user?.role === 'admin' ? (
                  <>
                    <Stack.Screen name="AdminTabs" component={AdminTabs} />
                    <Stack.Screen name="AdminStudentDetail" component={AdminStudentDetailScreen} />
                    <Stack.Screen name="AdminAddStudent" component={AdminAddStudentScreen} />
                    <Stack.Screen name="AdminNotifications" component={AdminNotificationsScreen} />
                    <Stack.Screen name="AdminFeeStructure" component={AdminFeeStructureScreen} />
                    <Stack.Screen name="AdminAnalytics" component={AdminAnalyticsScreen} />
                    <Stack.Screen name="AdminPayments" component={AdminPaymentsScreen} />
                    <Stack.Screen name="AdminSettings" component={AdminSettingsScreen} />
                    <Stack.Screen name="AdminResetRequests" component={AdminResetRequestsScreen} />
                  </>
                ) : (
                  <>
                    <Stack.Screen name="MainTabs" component={MainTabs} />
                    <Stack.Screen name="RegistrationSuccess" component={RegistrationSuccessScreen} />
                    <Stack.Screen name="Notification" component={NotificationScreen} />
                    <Stack.Screen name="Calendar" component={CalendarScreen} />
                    <Stack.Screen name="Profile" component={ProfileScreen} />
                    <Stack.Screen name="DigitalIdentityCard" component={IdentityCardScreen} />
                    <Stack.Screen name="Security" component={SecurityScreen} />
                    <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
                    <Stack.Screen name="PaymentWebView" component={PaymentWebViewScreen} />
                  </>
                )}
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </View>
    </NavContext.Provider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
