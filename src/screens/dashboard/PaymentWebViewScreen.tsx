import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../../theme/colors';

export const PaymentWebViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { checkoutUrl } = route.params as { checkoutUrl: string };
  
  const [isLoading, setIsLoading] = useState(true);
  const [pageTitle, setPageTitle] = useState('Secure Payment');
  const webViewRef = useRef<any>(null);

  const handleNavigationChange = (navState: any) => {
    const { url, title } = navState;
    if (title) setPageTitle(title);
    
    // Check if user landed on our success page
    if (url.includes('/api/payments/success')) {
      // Payment was successful — go back to dashboard after short delay
      setTimeout(() => {
        navigation.navigate('MainTabs' as any, { screen: 'Dashboard' });
      }, 3000); // Let user see success page for 3 seconds
    }
    
    // Check if user cancelled
    if (url.includes('/api/payments/cancel')) {
      setTimeout(() => {
        navigation.goBack();
      }, 2000);
    }
  };

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Custom Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
            <MaterialIcons name="close" size={22} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <MaterialIcons name="lock" size={14} color={colors.success} />
            <Text style={styles.headerTitle} numberOfLines={1}>{pageTitle}</Text>
          </View>
          <View style={styles.headerRight}>
            <MaterialIcons name="verified-user" size={18} color={colors.success} />
          </View>
        </View>

        {/* Secure Badge */}
        <View style={styles.secureBanner}>
          <MaterialIcons name="shield" size={12} color={colors.primary} />
          <Text style={styles.secureBannerText}>256-bit SSL Encrypted • Payments by Stripe</Text>
        </View>

        {/* WebView */}
        <WebView
          ref={webViewRef}
          source={{ uri: checkoutUrl }}
          style={styles.webView}
          onNavigationStateChange={handleNavigationChange}
          onLoadStart={() => setIsLoading(true)}
          onLoadEnd={() => setIsLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
          renderLoading={() => (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading Secure Gateway...</Text>
            </View>
          )}
        />

        {/* Loading Bar */}
        {isLoading && (
          <View style={styles.loadingBar}>
            <View style={styles.loadingBarFill} />
          </View>
        )}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090e1c',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? 40 : 12,
    backgroundColor: '#0d1323',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  closeBtn: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  headerTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 6,
  },
  headerRight: {
    padding: 8,
  },
  secureBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: 'rgba(28, 92, 242, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(28, 92, 242, 0.1)',
  },
  secureBannerText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  webView: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#090e1c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: 16,
    fontWeight: '600',
  },
  loadingBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? 92 : 64,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(28, 92, 242, 0.1)',
  },
  loadingBarFill: {
    height: '100%',
    width: '60%',
    backgroundColor: colors.primary,
    borderRadius: 1,
  },
});
