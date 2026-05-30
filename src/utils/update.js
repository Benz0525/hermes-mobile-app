// 版本检查 + OTA升级（Android系统下载器，零原生模块依赖）
import { Linking, Platform } from 'react-native';

const VERSION_API = 'http://8.163.2.252/app-api/version';
const APP_VERSION_CODE = 11;

export async function checkUpdate() {
  try {
    const res = await fetch(VERSION_API, { method: 'GET' });
    const info = await res.json();
    if (info.version_code > APP_VERSION_CODE) {
      return { hasUpdate: true, info };
    }
    return { hasUpdate: false };
  } catch {
    return { hasUpdate: false };
  }
}

export async function downloadAndInstall(apkUrl, onProgress) {
  if (Platform.OS === 'android') {
    // 用 intent:// 直接唤起系统下载管理器，不跳浏览器
    const path = apkUrl.replace('http://', '');
    const intentUrl = `intent://${path}#Intent;scheme=http;type=application/vnd.android.package-archive;end`;
    
    onProgress?.(30);
    await Linking.openURL(intentUrl).catch(() => {
      // 降级：普通浏览器下载
      return Linking.openURL(apkUrl);
    });
    onProgress?.(100);
    return true;
  }
  
  await Linking.openURL(apkUrl);
  return true;
}
