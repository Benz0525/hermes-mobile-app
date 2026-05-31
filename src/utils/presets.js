// v5.3.0: 模型×预设完全解耦 + model_overrides 后端驱动
import AsyncStorage from '@react-native-async-storage/async-storage';

const MODEL_KEY = 'hermes_current_model';
const PRESET_KEY = 'hermes_current_preset';
const OVERRIDES_KEY = 'hermes_model_overrides';
const PRESETS_LIST_KEY = 'hermes_basic_presets';

// 默认值（网络不通时的 fallback）
export const DEFAULT_MODEL = 'deepseek-v4-pro';
export const DEFAULT_PRESET = 'daily';

export const FALLBACK_OVERRIDES = {
  "deepseek-v4-pro": {
    "code":     {"temperature":0.1,"max_tokens":8192,"thinking":"on"},
    "writing":  {"temperature":0.7,"max_tokens":4096,"thinking":"off"},
    "daily":    {"temperature":0.5,"max_tokens":2048,"thinking":"off"},
    "analysis": {"temperature":0.3,"max_tokens":8192,"thinking":"high"}
  },
  "qwen3.7-max": {
    "code":     {"temperature":0.1,"max_tokens":8192,"thinking":"on"},
    "writing":  {"temperature":0.8,"max_tokens":4096,"thinking":"off"},
    "daily":    {"temperature":0.6,"max_tokens":2048,"thinking":"off"},
    "analysis": {"temperature":0.3,"max_tokens":8192,"thinking":"high"}
  },
  "glm-5.1": {
    "code":     {"temperature":0.15,"max_tokens":8192,"thinking":"on"},
    "writing":  {"temperature":0.8,"max_tokens":4096,"thinking":"off"},
    "daily":    {"temperature":0.6,"max_tokens":2048,"thinking":"off"},
    "analysis": {"temperature":0.3,"max_tokens":8192,"thinking":"high"}
  }
};

const FALLBACK_PRESETS_LIST = [
  {"id":"code","icon":"📝","label":"写代码"},
  {"id":"writing","icon":"✍️","label":"写文案"},
  {"id":"daily","icon":"💬","label":"日常问答"},
  {"id":"analysis","icon":"🧠","label":"深度分析"}
];

// ─── 旧数据检测 + 清理 ──────────────────────────
async function clearOldFormat() {
  try {
    const raw = await AsyncStorage.getItem('hermes_presets');
    if (raw) {
      const old = JSON.parse(raw);
      // 旧格式预设里带 model 字段（如 model: 'deepseek-v4-pro'）
      if (old.length > 0 && old[0].model) {
        await AsyncStorage.removeItem('hermes_presets');
        await AsyncStorage.removeItem('hermes_current_config');
        console.log('[v5.3.0] 已清除旧格式预设数据');
      }
    }
  } catch(e) {}
}

clearOldFormat();

// ─── 当前模型（独立持久化） ─────────────────────
export async function loadModel() {
  try {
    const raw = await AsyncStorage.getItem(MODEL_KEY);
    if (raw) return raw;
  } catch(e) {}
  return DEFAULT_MODEL;
}

export async function saveModel(modelId) {
  await AsyncStorage.setItem(MODEL_KEY, modelId);
}

// ─── 当前预设（独立持久化） ─────────────────────
export async function loadPreset() {
  try {
    const raw = await AsyncStorage.getItem(PRESET_KEY);
    if (raw) return raw;
  } catch(e) {}
  return DEFAULT_PRESET;
}

export async function savePreset(presetId) {
  await AsyncStorage.setItem(PRESET_KEY, presetId);
}

// ─── model_overrides（从 /presets 后端拉取） ────
export async function loadOverrides() {
  try {
    const raw = await AsyncStorage.getItem(OVERRIDES_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && Object.keys(data).length > 0) return data;
    }
  } catch(e) {}
  return null; // null=还没从后端拉过
}

export async function saveOverrides(data) {
  await AsyncStorage.setItem(OVERRIDES_KEY, JSON.stringify(data));
}

// ─── basic_presets 列表 ─────────────────────────
export async function loadPresetsList() {
  try {
    const raw = await AsyncStorage.getItem(PRESETS_LIST_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data && data.length > 0) return data;
    }
  } catch(e) {}
  return [...FALLBACK_PRESETS_LIST];
}

export async function savePresetsList(data) {
  await AsyncStorage.setItem(PRESETS_LIST_KEY, JSON.stringify(data));
}

// ─── 从后端刷新 preset 元数据 ───────────────────
export async function fetchPresetsFromServer() {
  try {
    const [pr, mo] = await Promise.all([
      fetch('http://8.163.2.252/app-api/presets').then(r => r.json()),
      fetch('http://8.163.2.252/app-api/models').then(r => r.json()),
    ]);
    if (pr && pr.basic_presets) {
      await savePresetsList(pr.basic_presets);
    }
    if (pr && pr.model_overrides) {
      await saveOverrides(pr.model_overrides);
    }
    return true;
  } catch(e) {
    return false;
  }
}

// ─── 核心：获取当前发送参数 ─────────────────────
// modelId: 当前选中的模型，presetId: 当前选中的预设（VL时为null）
// 返回 { model, temperature, max_tokens, thinking }
export async function getSendParams(modelId, presetId, overrides) {
  if (!presetId || !overrides || !overrides[modelId]) {
    // VL 或 无预设 → 默认参数
    return { model: modelId, temperature: 0.5, max_tokens: 4096, thinking: '' };
  }
  const mo = overrides[modelId];
  const params = mo[presetId];
  if (params) {
    return {
      model: modelId,
      temperature: params.temperature,
      max_tokens: params.max_tokens,
      thinking: params.thinking || '',
    };
  }
  return { model: modelId, temperature: 0.5, max_tokens: 4096, thinking: '' };
}
