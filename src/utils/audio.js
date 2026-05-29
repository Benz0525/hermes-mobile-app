// 音频工具 —— 懒加载 expo-av 防止闪退
// 只在用户点击录音时才初始化 Audio 模块

let AudioModule = null;
let initPromise = null;

/**
 * 获取 Audio 模块（懒加载，首次调用才初始化）
 */
export async function getAudio() {
  if (AudioModule) return AudioModule;
  
  if (!initPromise) {
    initPromise = (async () => {
      const expoAv = require('expo-av');
      AudioModule = expoAv.Audio;
      return AudioModule;
    })();
  }
  
  return initPromise;
}
