// 版本检查 + OTA升级（App内下载+安装，不走浏览器）
import { Linking, Platform } from 'react-native';

const VERSION_API = 'http://8.163.2.252/app-api/version';
const APP_VERSION_CODE = 10;

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
  // 懒加载 native 模块（避免启动闪退）
  let FileSystem;
  try {
    FileSystem = require('expo-file-system');
  } catch {
    // 模块加载失败，降级浏览器
    onProgress?.(50);
    await Linking.openURL(apkUrl);
    onProgress?.(100);
    return true;
  }

  const fileUri = FileSystem.cacheDirectory + 'hermes-update.apk';
  onProgress?.(0);

  try {
    const downloadResumable = FileSystem.createDownloadResumable(
      apkUrl,
      fileUri,
      {},
      (progress) => {
        const pct = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
        onProgress?.(Math.round(pct * 100));
      }
    );

    const result = await downloadResumable.downloadAsync();
    if (!result || result.status !== 200) {
      throw new Error('下载失败: ' + (result?.status || 'unknown'));
    }

    onProgress?.(95);

    if (Platform.OS === 'android') {
      // 获取 content:// URI 并用 Linking 打开 → 系统自动弹出安装
      const contentUri = await FileSystem.getContentUriAsync(result.uri);
      await Linking.openURL(contentUri);
    } else {
      await Linking.openURL(result.uri);
    }

    onProgress?.(100);
    return true;
  } catch (err) {
    console.warn('OTA download failed:', err.message);
    // 降级：跳浏览器
    onProgress?.(50);
    await Linking.openURL(apkUrl);
    onProgress?.(100);
    return true;
  }
}
