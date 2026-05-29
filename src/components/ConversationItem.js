// 对话列表项 —— Linear 暗色风格卡片
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '../colors';
import { formatTime } from '../utils/time';

/**
 * 截取最后一条消息的文字预览（最多30字）
 */
function getLastPreview(messages) {
  if (!messages || messages.length === 0) return '暂无消息';
  const last = messages[messages.length - 1];
  const text = last.text || '';
  return text.length > 30 ? text.slice(0, 30) + '…' : text;
}

/**
 * ConversationItem
 * @param {object} conversation - { id, title, messages, updatedAt }
 * @param {function} onPress      - 点击回调
 * @param {function} onLongPress  - 长按回调
 */
export default function ConversationItem({ conversation, onPress, onLongPress }) {
  const { title = '新对话', messages = [], updatedAt } = conversation || {};

  // 头像占位圈：取标题第一个字
  const avatarChar = (title || '新')[0];

  // 最后消息预览
  const preview = getLastPreview(messages);

  // 时间显示
  const timeStr = updatedAt ? formatTime(updatedAt) : '';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={500}
    >
      {/* 左侧：头像占位圈 */}
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{avatarChar}</Text>
      </View>

      {/* 中间：标题 + 预览 */}
      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.preview} numberOfLines={1}>
          {preview}
        </Text>
      </View>

      {/* 右侧：时间 */}
      {timeStr ? <Text style={styles.time}>{timeStr}</Text> : null}
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  center: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  preview: {
    fontSize: 13,
    color: Colors.sub,
  },
  time: {
    fontSize: 12,
    color: Colors.sub,
  },
});
