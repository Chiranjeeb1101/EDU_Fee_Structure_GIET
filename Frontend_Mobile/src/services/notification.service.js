import api from './api';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

class NotificationService {
  async registerForPushNotificationsAsync() {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.warn('Failed to get push token for push notification!');
        return;
      }
      
      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'your-project-id';
      
      try {
        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('Push Token (FCM/Expo):', token);
        
        // ✨ NEW: Send token to Backend to store it
        await this.syncTokenWithBackend(token);

      } catch (e) {
        console.error('Push token error:', e);
      }
    } else {
      console.log('Skipping push notifications setup: Must use physical device');
    }

    return token;
  }

  async syncTokenWithBackend(token) {
    try {
      await api.post('/auth/register-device', { device_token: token });
      console.log('✅ Device token seamlessly synced to backend!');
    } catch (e) {
      console.error('Failed to sync device token:', e.message);
    }
  }

  addNotificationReceivedListener(callback) {
    return Notifications.addNotificationReceivedListener(callback);
  }

  addNotificationResponseReceivedListener(callback) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }
}

export default new NotificationService();
