// v5.4.0: 日期格式化 — 极客风格
// 今天 → HH:MM / 昨天 → "昨天" / 本周 → 周X / 本年 → M月D日 / 跨年 → YYYY/M/D
const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

/**
 * 格式化时间戳为会话列表显示文本
 * @param {number|string} ts - 毫秒时间戳或 ISO 字符串
 * @returns {string}
 */
export function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const now = new Date();

  // 同一天 → HH:MM
  if (isSameDay(d, now)) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  // 昨天
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) {
    return '昨天';
  }

  // 本周（非今天/昨天，但在同一周）
  const diffDays = dayDiff(d, now);
  if (diffDays < 7 && d.getDay() < now.getDay()) {
    return WEEKDAYS[d.getDay()];
  }

  // 本年 → M月D日
  if (d.getFullYear() === now.getFullYear()) {
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  // 跨年 → YYYY/M/D
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

/**
 * 返回分组标签 — 用于 ChatListScreen 日期分组
 * @returns {'今天'|'昨天'|'本周'|'更早'}
 */
export function dateGroup(ts) {
  if (!ts) return '更早';
  const d = new Date(ts);
  const now = new Date();

  if (isSameDay(d, now)) return '今天';
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (isSameDay(d, yesterday)) return '昨天';

  const diffDays = dayDiff(d, now);
  if (diffDays < 7 && d.getDay() < now.getDay()) return '本周';
  return '更早';
}

// ─── helpers ──────────────────────────────────────────
function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
}

function dayDiff(a, b) {
  const oneDay = 86400000;
  return Math.floor((b.getTime() - a.getTime()) / oneDay);
}

function pad(n) {
  return n < 10 ? '0' + n : '' + n;
}
