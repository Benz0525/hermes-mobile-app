// 版本检查 + OTA升级（当前用浏览器下载，后续再加native模块）
import { Linking } from 'react-native';

const VERSION_API = 'http://8.163.2.252/app-api/version';
const APP_VERSION_CODE = 9;

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
  // 临时方案：跳浏览器下载（native模块移除后兜底）
  // TODO: 等排查完native模块兼容性再加回来
  onProgress?.(50);
  await Linking.openURL(apkUrl);
  onProgress?.(100);
  return true;
}
