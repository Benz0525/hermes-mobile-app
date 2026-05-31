// v5.4.1: 思考深度档位 — 3 档 × 温度系数 × token 上限
export const DEPTHS = [
  { id: 'fast',     name: '快速', emoji: '⚡', tempMultiplier: 0.8, maxTokens: 1024 },
  { id: 'standard', name: '标准', emoji: '⚖️', tempMultiplier: 1.0, maxTokens: 4096 },
  { id: 'deep',     name: '深度', emoji: '🧠', tempMultiplier: 1.0, maxTokens: 8192, reasoning: true },
];

export const DEFAULT_DEPTH_ID = 'standard';

export function getDepth(id) {
  return DEPTHS.find(d => d.id === id) || DEPTHS[1];
}
