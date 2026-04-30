const config = require('./app.json');

module.exports = () => ({
  ...config,
  expo: {
    ...config.expo,
    extra: {
      ...config.expo.extra,
      revenueCatAppleApiKey: process.env.IOS_REVENUECAT_API_KEY,
      revenueCatAndroidApiKey: process.env.ANDROID_REVENUECAT_API_KEY,
    },
  },
});