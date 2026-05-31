// 消息气泡 v5.1.3 — typewriter 打字机 + 分段渲染（React.memo 防长文本卡顿）
import React, { memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Clipboard,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../colors';
import { formatTime } from '../utils/time';
// [版本D] 恢复多媒体气泡组件
import ImageBubble from './ImageBubble';
import FileBubble from './FileBubble';

/** v5.1.3: 分段渲染 — 每段独立 React.memo，typewriter 只触发最后一段重绘 */
const SegmentText = memo(function SegmentText({ text, style }) {
  return <Text style={style}>{text}</Text>;
});

/**
 * MessageBubble
 * @param {object} message
 *   - 纯文字：{ id, role, text, timestamp }
 *   - 图片：   { id, role, text, timestamp, imageUri }
 *   - 文件：   { id, role, text, timestamp, file: { name, size } }
 *   - 语音：   { id, role, text, timestamp, audio: { uri, duration } }
 *   - Phase 1: reasoning  { reasoning, reasoningOpen, reasoningDuration }
 *   - Phase 1: toolCalls  [{ name, arguments, result, status }]
 *   - v5.3.1: meta        { model, endpoint, latency_ms, temperature, max_tokens }
 * @param {boolean} isThinking - 是否正在思考中（显示转圈动画）
 * @param {boolean} isStreaming - 当前 bot 消息是否在流式接收中
 * @param {function} onToggleReasoning - 切换推理折叠区
 * @param {boolean} showDebugInfo - 是否显示 API 调试信息（设置开关）
 */
export default function MessageBubble({
  message,
  isThinking = false,
  isStreaming = false,
  onToggleReasoning,
  showDebugInfo = true,
}) {
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

  // ─── Phase 1: Reasoning 折叠区 ─────────────────────────

  const renderReasoning = () => {
    const reasoning = message.reasoning;
    if (!reasoning && !isStreaming) return null;
    // 流式进行中但还没收到reasoning→不显示
    if (isStreaming && !reasoning) return null;

    const isOpen = message.reasoningOpen !== false;  // 默认展开
    const durationSec = message.reasoningDuration;

    const headerLabel = isStreaming
      ? '🌿 思考中…'
      : durationSec
        ? `🌿 思考了 ${durationSec} 秒`
        : '🌿 推理过程';

    return (
      <View style={styles.reasoningWrap}>
        <TouchableOpacity
          style={styles.reasoningHeader}
          onPress={onToggleReasoning}
          activeOpacity={0.6}
        >
          <Text style={styles.reasoningChevron}>{isOpen ? '▾' : '▸'}</Text>
          {isStreaming ? (
            <View style={styles.reasoningShimmerRow}>
              <ActivityIndicator size="small" color={Colors.accent} />
              <Text style={styles.reasoningLabel}>{headerLabel}</Text>
            </View>
          ) : (
            <Text style={styles.reasoningLabel}>{headerLabel}</Text>
          )}
        </TouchableOpacity>

        {isOpen && (
          <View style={styles.reasoningContent}>
            <Text style={styles.reasoningText}>{reasoning}</Text>
          </View>
        )}
      </View>
    );
  };

  // ─── Phase 1: Tool Call 展示 ──────────────────────────

  const renderToolCalls = () => {
    const toolCalls = message.toolCalls;
    if (!toolCalls || toolCalls.length === 0) return null;

    return (
      <View style={styles.toolCallsWrap}>
        {toolCalls.map((tc, i) => {
          const status = tc.status || 'running';
          const statusConfig = TOOL_STATUS_MAP[status] || TOOL_STATUS_MAP.running;

          return (
            <View key={i} style={styles.toolCallItem}>
              <View style={styles.toolCallHeader}>
                <Text style={styles.toolCallIcon}>🔧</Text>
                <Text style={styles.toolCallName}>{tc.name || tc.function?.name || '工具调用'}</Text>
                <View style={[styles.toolStatusBadge, { backgroundColor: statusConfig.bg }]}>
                  <Text style={[styles.toolStatusText, { color: statusConfig.color }]}>
                    {statusConfig.label}
                  </Text>
                </View>
              </View>
              {/* 参数 */}
              {tc.arguments ? (
                <View style={styles.toolCallSection}>
                  <Text style={styles.toolCallSectionTitle}>参数</Text>
                  <Text style={styles.toolCallCode}>
                    {typeof tc.arguments === 'string' ? tc.arguments : JSON.stringify(tc.arguments, null, 2)}
                  </Text>
                </View>
              ) : null}
              {/* 结果 / 错误 */}
              {tc.result ? (
                <View style={styles.toolCallSection}>
                  <Text style={styles.toolCallSectionTitle}>
                    {status === 'error' ? '错误' : '结果'}
                  </Text>
                  <Text style={[styles.toolCallCode, status === 'error' && { color: '#ef4444' }]}>
                    {typeof tc.result === 'string' ? tc.result : JSON.stringify(tc.result, null, 2)}
                  </Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
    );
  };

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
    // 思考中（无文本无reasoning）
    if (isThinking) {
      return (
        <View style={styles.thinkingRow}>
          <ActivityIndicator size="small" color={Colors.sub} />
          <Text style={styles.thinkingText}>思考中…</Text>
        </View>
      );
    }
    // 纯文字 → v5.1.3: 按 \n\n 分段，每段独立 memo
    if (!text) return null;
    const segments = text.split('\n\n');
    return segments.map((seg, i) => (
      <SegmentText
        key={`seg_${i}`}
        text={seg + (i < segments.length - 1 ? '\n\n' : '')}
        style={[styles.text, isUser ? styles.textUser : styles.textHermes]}
      />
    ));
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
        {/* Phase 1: Reasoning（仅 hermes 消息） */}
        {!isUser && renderReasoning()}

        {/* Phase 1: Tool Calls（仅 hermes 消息） */}
        {!isUser && renderToolCalls()}

        {/* 正文（图片/文件/语音/文字） */}
        {renderContent()}

        {/* v5.3.1: API 调试信息 badge（气泡底部，仅 hermes + 开启时） */}
        {!isUser && showDebugInfo && message.meta ? (
          <View style={styles.metaBadge}>
            <Text style={styles.metaLine1} numberOfLines={1}>
              {message.meta.model} · T={message.meta.temperature} · max={message.meta.max_tokens}
            </Text>
            <Text style={styles.metaLine2} numberOfLines={1}>
              ↳ {message.meta.endpoint} · {message.meta.latency_ms}ms
            </Text>
          </View>
        ) : null}
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

// ─── Tool 状态机（对标 expo-ai-elements） ──────────────

const TOOL_STATUS_MAP = {
  pending:       { label: '等待中', bg: '#1e293b', color: '#94a3b8' },
  'input-streaming': { label: '接收参数', bg: '#1e293b', color: '#94a3b8' },
  running:       { label: '执行中', bg: '#422006', color: '#fbbf24' },
  completed:     { label: '已完成', bg: '#052e16', color: '#4ade80' },
  error:         { label: '出错', bg: '#450a0a', color: '#ef4444' },
  denied:        { label: '被拒绝', bg: '#431407', color: '#fb923c' },
};

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

  // ─── Phase 1: Reasoning 样式 ────────────────────────

  reasoningWrap: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.accent + '44',
    marginBottom: 8,
    paddingLeft: 8,
  },
  reasoningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  reasoningChevron: {
    color: Colors.sub,
    fontSize: 12,
    width: 16,
  },
  reasoningShimmerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reasoningLabel: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  reasoningContent: {
    paddingTop: 4,
    paddingBottom: 2,
  },
  reasoningText: {
    color: Colors.sub,
    fontSize: 13,
    lineHeight: 19,
    opacity: 0.75,
  },

  // ─── Phase 1: Tool Call 样式 ────────────────────────

  toolCallsWrap: {
    marginBottom: 8,
    gap: 6,
  },
  toolCallItem: {
    backgroundColor: Colors.bg + '88',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
  },
  toolCallHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolCallIcon: {
    fontSize: 14,
  },
  toolCallName: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  toolStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  toolStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  toolCallSection: {
    marginTop: 8,
  },
  toolCallSectionTitle: {
    color: Colors.sub,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  toolCallCode: {
    color: Colors.text,
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: Colors.bg,
    borderRadius: 6,
    padding: 8,
    overflow: 'hidden',
  },
  // v5.3.1: API 调试信息 badge
  metaBadge: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  metaLine1: {
    fontSize: 10,
    color: Colors.sub,
    opacity: 0.55,
  },
  metaLine2: {
    fontSize: 10,
    color: Colors.sub,
    opacity: 0.4,
    marginTop: 2,
  },
});
