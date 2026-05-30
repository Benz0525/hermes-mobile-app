// 预设模式定义 + AsyncStorage 持久化 （M1）
import AsyncStorage from '@react-native-async-storage/async-storage';

const PRESETS_KEY = 'hermes_presets';
const CONFIG_KEY = 'hermes_current_config';

// 默认 4 个预设
export const DEFAULT_PRESETS = [
  { id: 'code',     icon: '📝', label: '写代码',   model: 'deepseek-v4-pro',  temperature: 0.2, max_tokens: 8192, thinking: 'on' },
  { id: 'writing',  icon: '✍️', label: '写文案',   model: 'qwen-max',          temperature: 0.7, max_tokens: 4096, thinking: '' },
  { id: 'daily',    icon: '💬', label: '日常问答', model: 'deepseek-chat',     temperature: 0.5, max_tokens: 2048, thinking: '' },
  { id: 'analysis', icon: '🧠', label: '深度分析', model: 'deepseek-reasoner', temperature: 0.3, max_tokens: 8192, thinking: 'high' },
];

// 默认当前配置（对应"日常问答"）
export const DEFAULT_CONFIG = {
  model: 'deepseek-v4-pro',
  temperature: 0.5,
  max_tokens: 4096,
  thinking: '',
  presetId: null, // null = 手动选模型，非 null = 使用某个预设
};

// 加载预设列表（支持用户编辑）
export async function loadPresets() {
  try {
    const raw = await AsyncStorage.getItem(PRESETS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return [...DEFAULT_PRESETS];
}

// 保存预设列表
export async function savePresets(presets) {
  await AsyncStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
}

// 加载当前配置
export async function loadConfig() {
  try {
    const raw = await AsyncStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return { ...DEFAULT_CONFIG };
}

// 保存当前配置
export async function saveConfig(config) {
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

// 从 /models 后端刷新预设（首次启动或重置用）
export async function fetchPresetsFromServer() {
  try {
    const res = await fetch('http://8.163.2.252/app-api/models');
    const data = await res.json();
    if (data.presets && data.presets.length > 0) {
      await savePresets(data.presets);
      return data.presets;
    }
  } catch (e) { /* ignore */ }
  return [...DEFAULT_PRESETS];
}

// 根据预设 ID 获取配置快照
export function getPresetConfig(preset) {
  return {
    model: preset.model,
    temperature: preset.temperature,
    max_tokens: preset.max_tokens,
    thinking: preset.thinking,
    presetId: preset.id,
  };
}
