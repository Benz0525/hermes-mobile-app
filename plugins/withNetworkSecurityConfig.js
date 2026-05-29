const { withAndroidManifest, AndroidConfig } = require('@expo/config-plugins');

const withNetworkSecurityConfig = (config) => {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    
    app.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    
    return config;
  });
};

module.exports = withNetworkSecurityConfig;
