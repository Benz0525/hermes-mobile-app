// v5.4.0: 极客风重设计 — outline头像 + 时间 + 模型徽章 + 字体三级
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../colors';
import { formatDate } from '../utils/dateFormat';

// ─── 模型徽章映射 ────────────────────────────────────────
const MODEL_BADGE = {
  'deepseek-v4-pro': { abbr: 'DS', color: '#4A90E2' },
  'qwen3.7-max':     { abbr: 'QW', color: '#F59E0B' },
  'glm-5.1':         { abbr: 'GL', color: '#10B981' },
  'qwen-vl-max':     { abbr: 'VL', color: '#8B5CF6' },
};
const DEFAULT_BADGE = { abbr: '??', color: Colors.sub };

function getBadge(model) {
  if (!model) return null;
  // fuzzy match by keyword
  for (const [key, val] of Object.entries(MODEL_BADGE)) {
    if (model.includes(key) || key.includes(model)) return val;
  }
  // fallback: first 2 chars uppercase
  return { abbr: (model || '??').slice(0, 2).toUpperCase(), color: Colors.sub };
}

function getLastPreview(messages) {
  if (!messages || messages.length === 0) return '暂无消息';
  const last = messages[messages.length - 1];
  const text = last.text || '';
  return text.length > 30 ? text.slice(0, 30) + '…' : text;
}

/**
 * ConversationItem — v5.4.0 极客风
 * @param {object} conversation - { id, title, messages, updatedAt, model?, isPinned? }
 * @param {function} onPress
 * @param {function} onLongPress
 * @param {boolean} hasUnread  - v5.4.0 B3: 显示未读红点
 */
export default function ConversationItem({ conversation, onPress, onLongPress, hasUnread }) {
  const {
    title = '新对话',
    messages = [],
    updatedAt,
    model,
    isPinned,
  } = conversation || {};

  const avatarChar = (title || '新')[0];
  const preview = getLastPreview(messages);
  const timeStr = formatDate(updatedAt);
  const badge = getBadge(model);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      {/* 左侧：40px outline 头像 */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarChar}</Text>
      </View>

      {/* 中间：标题 + 预览 + 模型徽章 */}
      <View style={styles.center}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {badge && (
            <View style={[styles.badge, { backgroundColor: badge.color + '22', borderColor: badge.color }]}>
              <View style={[styles.badgeDot, { backgroundColor: badge.color }]} />
              <Text style={[styles.badgeText, { color: badge.color }]}>{badge.abbr}</Text>
            </View>
          )}
        </View>
        <Text style={styles.preview} numberOfLines={1}>{preview}</Text>
      </View>

      {/* 右侧：时间 + 未读红点 */}
      <View style={styles.rightCol}>
        <Text style={styles.time}>{timeStr}</Text>
        {hasUnread && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  // ─── outline 头像 (40px, 描边无填充) ──────────────────
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.sub,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.sub,
  },
  center: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flexShrink: 1,
  },
  // ─── 模型徽章 ────────────────────────────────────────
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  // ─── 字体三级 ────────────────────────────────────────
  preview: {
    fontSize: 13,
    color: '#999',   // 副标题 60% 灰 (FAFAFA * 0.6 ≈ 999)
  },
  time: {
    fontSize: 12,
    color: '#666',   // 时间 40% 灰 (FAFAFA * 0.4 ≈ 666)
  },
  rightCol: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
    marginTop: 4,
  },
});
