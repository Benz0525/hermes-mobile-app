// 版本检查 + OTA升级（App内真下载+真安装）
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
  let ReactNativeBlobUtil;
  try {
    ReactNativeBlobUtil = require('react-native-blob-util').default;
  } catch {
    // 模块加载失败，降级浏览器
    onProgress?.(50);
    await Linking.openURL(apkUrl);
    onProgress?.(100);
    return true;
  }

  const filePath = ReactNativeBlobUtil.fs.dirs.DownloadDir + '/hermes-update.apk';
  onProgress?.(0);

  try {
    const res = await ReactNativeBlobUtil.config({
      fileCache: true,
      path: filePath,
    })
      .fetch('GET', apkUrl)
      .progress((received, total) => {
        onProgress?.(Math.round((Number(received) / Number(total)) * 100));
      });

    onProgress?.(100);

    if (Platform.OS === 'android') {
      ReactNativeBlobUtil.android.actionViewIntent(
        res.path(),
        'application/vnd.android.package-archive'
      );
    }

    return true;
  } catch (err) {
    console.warn('OTA failed:', err.message);
    onProgress?.(50);
    await Linking.openURL(apkUrl);
    onProgress?.(100);
    return true;
  }
}
