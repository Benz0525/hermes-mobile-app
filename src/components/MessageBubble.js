// 消息气泡 —— 支持文字、图片、文件、语音
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Clipboard,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { TouchableOpacity } from 'react-native';
import { Colors } from '../colors';
import { formatTime } from '../utils/time';
// [版本D] 恢复多媒体气泡组件
import ImageBubble from './ImageBubble';
import FileBubble from './FileBubble';

/**
 * MessageBubble
 * @param {object} message
 *   - 纯文字：{ id, role, text, timestamp }
 *   - 图片：   { id, role, text, timestamp, imageUri }
 *   - 文件：   { id, role, text, timestamp, file: { name, size } }
 *   - 语音：   { id, role, text, timestamp, audio: { uri, duration } }
 * @param {boolean} isThinking - 是否正在思考中（显示转圈动画）
 */
export default function MessageBubble({ message, isThinking = false }) {
  if (!message) return null;

  const { role = 'hermes', text = '', timestamp } = message;
  const isUser = role === 'user';

  // 长按复制文本
  const handleLongPress = () => {
    if (!text) return;
    Clipboard.setString(text);
    Alert.alert('已复制', '消息文本已复制到剪贴板', [{ text: '好的' }]);
  };

  // 时间 HH:mm
  const timeStr = timestamp ? formatTime(timestamp) : '';

  // ─── 多媒体内容渲染 ──────────────────────────────────

  const renderContent = () => {
    // [版本D] 图片/文件气泡已恢复
    // 图片
    if (message.imageUri) {
      return <ImageBubble imageUri={message.imageUri} />;
    }
    // 文件
    if (message.file) {
      return <FileBubble file={message.file} />;
    }
    // 语音
    if (message.audio) {
      const { duration } = message.audio;
      return (
        <View style={styles.audioRow}>
          <Text style={styles.audioIcon}>🎤</Text>
          <Text style={styles.audioText}>
            语音消息{duration != null ? ` (${duration}秒)` : ''}
          </Text>
        </View>
      );
    }
    // 纯文字
    if (isThinking) {
      return (
        <View style={styles.thinkingRow}>
          <ActivityIndicator size="small" color={Colors.sub} />
          <Text style={styles.thinkingText}>思考中…</Text>
        </View>
      );
    }
    return (
      <Text style={[styles.text, isUser ? styles.textUser : styles.textHermes]}>
        {text}
      </Text>
    );
  };

  // [版本D] 恢复完整 hasMedia 检查（图片+文件+音频）
  const hasMedia = !!message.imageUri || !!message.file || !!message.audio;

  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      {/* 气泡 */}
      <TouchableOpacity
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleHermes,
          hasMedia && styles.bubbleMedia, // 多媒体气泡无内边距
        ]}
        activeOpacity={0.8}
        onLongPress={hasMedia ? undefined : handleLongPress}
        delayLongPress={400}
        disabled={hasMedia}
      >
        {renderContent()}
      </TouchableOpacity>

      {/* 时间（气泡下方） */}
      {timeStr ? (
        <Text style={[styles.time, isUser ? styles.timeRight : styles.timeLeft]}>
          {timeStr}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  /* 行容器 */
  row: {
    marginVertical: 4,
    marginHorizontal: 12,
    maxWidth: '80%',
  },
  rowRight: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  rowLeft: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },

  /* 气泡本体 */
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: Colors.userBubble,
    borderBottomRightRadius: 4,
  },
  bubbleHermes: {
    backgroundColor: Colors.botBubble,
    borderBottomLeftRadius: 4,
  },
  bubbleMedia: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
    borderBottomRightRadius: 12,
    borderBottomLeftRadius: 12,
    overflow: 'visible',
  },

  /* 文字 */
  text: {
    fontSize: 15,
    lineHeight: 22,
  },
  textUser: {
    color: '#fff',
  },
  textHermes: {
    color: Colors.text,
  },

  /* 思考中 */
  thinkingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thinkingText: {
    fontSize: 14,
    color: Colors.sub,
  },

  /* 语音消息 */
  audioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.userBubble,
    borderRadius: 16,
    borderBottomRightRadius: 4,
  },
  audioIcon: {
    fontSize: 22,
  },
  audioText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },

  /* 时间 */
  time: {
    fontSize: 11,
    color: Colors.sub,
    marginTop: 4,
  },
  timeRight: {
    textAlign: 'right',
    marginRight: 4,
  },
  timeLeft: {
    textAlign: 'left',
    marginLeft: 4,
  },
});
