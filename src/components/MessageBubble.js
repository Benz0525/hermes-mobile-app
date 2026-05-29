// 消息气泡 —— 用户紫色靠右，Hermes 深灰靠左
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

/**
 * MessageBubble
 * @param {object} message    - { id, role, text, timestamp }
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

  return (
    <View style={[styles.row, isUser ? styles.rowRight : styles.rowLeft]}>
      {/* 气泡 */}
      <TouchableOpacity
        style={[
          styles.bubble,
          isUser ? styles.bubbleUser : styles.bubbleHermes,
        ]}
        activeOpacity={0.8}
        onLongPress={handleLongPress}
        delayLongPress={400}
      >
        {isThinking ? (
          // 思考中：转圈动画
          <View style={styles.thinkingRow}>
            <ActivityIndicator size="small" color={Colors.sub} />
            <Text style={styles.thinkingText}>思考中…</Text>
          </View>
        ) : (
          <Text style={[styles.text, isUser ? styles.textUser : styles.textHermes]}>
            {text}
          </Text>
        )}
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
