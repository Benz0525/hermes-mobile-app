// 时间格式化工具

/** 格式化为 HH:mm，如 14:30 */
export function formatTime(timestamp) {
  const d = new Date(timestamp);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/** 格式化为中文日期，如 "5月29日" */
export function formatDate(timestamp) {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/** 判断两个时间戳是否在同一天 */
export function isSameDay(t1, t2) {
  const d1 = new Date(t1);
  const d2 = new Date(t2);
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}
