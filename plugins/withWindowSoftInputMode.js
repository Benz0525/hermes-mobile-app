// 自定义 Expo Config Plugin —— 直接往 AndroidManifest.xml 注入 windowSoftInputMode
// 绕过 expo-build-properties 的已知 bug (issue #19088)
const { withAndroidManifest } = require('@expo/config-plugins');

function withWindowSoftInputMode(config, mode = 'adjustResize') {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults.manifest;
    
    // 确保 application 标签存在
    if (!manifest.application) {
      manifest.application = [{ $: {} }];
    }
    
    // 获取或创建 main activity
    let mainActivity = null;
    manifest.application[0].activity = manifest.application[0].activity || [];
    
    for (const activity of manifest.application[0].activity) {
      const intentFilters = activity['intent-filter'] || [];
      for (const filter of intentFilters) {
        const actions = filter.action || [];
        for (const action of actions) {
          if (action.$ && action.$['android:name'] === 'android.intent.action.MAIN') {
            mainActivity = activity;
            break;
          }
        }
        if (mainActivity) break;
      }
      if (mainActivity) break;
    }
    
    if (mainActivity) {
      // 在 activity 层级设置 windowSoftInputMode
      mainActivity.$ = mainActivity.$ || {};
      mainActivity.$['android:windowSoftInputMode'] = mode;
      console.log(`[withWindowSoftInputMode] Set activity windowSoftInputMode=${mode}`);
    }
    
    return config;
  });
}

module.exports = withWindowSoftInputMode;
