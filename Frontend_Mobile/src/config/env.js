const Constants = require('expo-constants');

// Environment variables configuration using Expo Constants.
// These variables are injected via app.json.

const ENV = {
  // Use backend's active host (change IP to match your Local Network for testing on device)
  API_BASE_URL: Constants.default?.expoConfig?.extra?.API_BASE_URL || 'http://192.168.1.100:5000/api',
  STRIPE_PUBLISHABLE_KEY: Constants.default?.expoConfig?.extra?.STRIPE_PUBLISHABLE_KEY || 'pk_test_51TClxgDXylI037LMG1hZn7vGOgzwSPsYkKCKjlpm9mgT3JLHrTqkGrhrWi54UQnCaCJkoDr8Tj9wQppOJyT6TTtN00bSv49HSX',
};

export default ENV;
