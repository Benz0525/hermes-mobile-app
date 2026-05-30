// 版本检查 + OTA升级（真实下载+安装）
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
  try {
    // 懒加载 native 模块（避免启动闪退）
    const FileSystem = require('expo-file-system');
    const IntentLauncher = require('expo-intent-launcher');

    const fileUri = FileSystem.cacheDirectory + 'hermes-update.apk';
    onProgress?.(0);

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
    if (!result || !result.uri) {
      throw new Error('下载失败');
    }

    onProgress?.(100);

    // 打开APK安装
    if (Platform.OS === 'android') {
      const contentUri = await FileSystem.getContentUriAsync(result.uri);
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: contentUri,
        flags: 1,
        type: 'application/vnd.android.package-archive',
      });
    }

    return true;
  } catch (err) {
    // 降级：跳浏览器下载
    console.warn('OTA native failed, fallback:', err.message);
    onProgress?.(50);
    await Linking.openURL(apkUrl);
    onProgress?.(100);
    return true;
  }
}
