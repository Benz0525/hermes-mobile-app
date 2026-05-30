// 版本检查 + OTA升级（Android系统下载器，零原生模块依赖）
// ⚠️ 每次发版前必须同步：此处 APP_VERSION_CODE = server.py 的 version_code
// TODO: 后续改用 expo-constants 从 app.json extra.versionCode 读取，消除手动同步
import { Linking } from 'react-native';

const VERSION_API = 'http://8.163.2.252/app-api/version';
const APP_VERSION_CODE = 15;

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

export async function downloadAndInstall(apkUrl) {
  // 直接用系统浏览器打开APK链接，nginx已配Content-Disposition:attachment强制下载
  await Linking.openURL(apkUrl);
  return true;
}
