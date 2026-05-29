// 版本检查工具 —— 启动时自动检测更新
const VERSION_API = 'http://8.163.2.252/app-api/version';
const APP_VERSION_CODE = 7; // 随每次发布递增

/**
 * 检查是否有新版本
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
