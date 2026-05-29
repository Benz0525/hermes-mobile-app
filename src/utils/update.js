// 版本检查 + 本地OTA升级工具
const VERSION_API = 'http://8.163.2.252/app-api/version';
const APP_VERSION_CODE = 8; // 随每次发布递增

/**
 * 检查是否有新版本（不依赖任何native模块，安全调用）
 * @returns {Promise<{hasUpdate: boolean, info?: object}>}
 */
export async function checkUpdate() {
  try {
    const res = await fetch(VERSION_API, { method: 'GET' });
    const info = await res.json();
    
    if (info.version_code > APP_VERSION_CODE) {
      return { hasUpdate: true, info };
    }
    return { hasUpdate: false };
  } catch {
    // 网络不通，静默跳过
    return { hasUpdate: false };
  }
}

/**
 * 下载APK到本地并弹出系统安装界面
 * native模块懒加载，避免阻塞APP启动
 * @param {string} apkUrl - APK下载地址
 * @param {function} onProgress - 进度回调 (0-100)
 * @returns {Promise<boolean>}
 */
export async function downloadAndInstall(apkUrl, onProgress) {
  // 懒加载native模块——只在真正需要下载时才加载
  const FileSystem = require('expo-file-system');
  const IntentLauncher = require('expo-intent-launcher');

  const fileUri = FileSystem.documentDirectory + 'hermes-update.apk';

  // 如果之前下载过残留文件，先删掉
  const fileInfo = await FileSystem.getInfoAsync(fileUri);
  if (fileInfo.exists) {
    await FileSystem.deleteAsync(fileUri);
  }

  const downloadResumable = FileSystem.createDownloadResumable(
    apkUrl,
    fileUri,
    {},
    (downloadProgress) => {
      const total = downloadProgress.totalBytesExpectedToWrite;
      const written = downloadProgress.totalBytesWritten;
      const pct = total > 0 ? Math.round((written / total) * 100) : 0;
      onProgress?.(pct);
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (!result || !result.uri) {
    throw new Error('APK下载失败');
  }

  // 获取 content:// URI，Android 7+ 安装APK必须走 FileProvider
  const contentUri = await FileSystem.getContentUriAsync(result.uri);

  // 调用系统安装器打开APK
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    type: 'application/vnd.android.package-archive',
    flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
  });

  return true;
}
