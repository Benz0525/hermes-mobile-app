import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, SafeAreaView
} from 'react-native';

// ====== 配置 ======
const API_STREAM = 'http://8.163.2.252/app-api/chat/stream';
const REQUEST_TIMEOUT = 120000; // P1-11: 2分钟超时
const THROTTLE_MS = 50;        // P1-9: 50ms节流

// ====== 颜色 ======
const C = {
  bg: '#08090a',
  card: '#111318',
  border: '#1e2430',
  text: '#e4e5e7',
  sub: '#6b7280',
  accent: '#5e6ad2',
  accentLight: '#7c82e0',
  userBubble: '#5e6ad2',
  botBubble: '#1a1d26',
  inputBg: '#111318',
  danger: '#ef4444',
};

export default function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const flatListRef = useRef(null);
  const streamRef = useRef(null);

  const stopStream = () => {
    // P1-8: 停止生成
    if (streamRef.current) {
      streamRef.current.abort();
      streamRef.current = null;
    }
    setLoading(false);
  };

  const sendMessage = () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text };
    const botId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, userMsg, { id: botId, role: 'hermes', text: '' }]);
    setInput('');
    setLoading(true);

    const xhr = new XMLHttpRequest();
    streamRef.current = xhr;

    // P1-5: SSE缓冲区——解决半行数据丢失
    let buffer = '';
    let fullText = '';
    let lastIndex = 0;
    let lastUpdate = 0; // P1-9: 节流计时

    xhr.open('POST', API_STREAM);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = REQUEST_TIMEOUT; // P1-11

    xhr.onprogress = () => {
      const newText = xhr.responseText.substring(lastIndex);
      lastIndex = xhr.responseText.length;
      buffer += newText;

      // P1-5: 按完整事件（\n\n）分割，最后不完整的留到下次
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        // 按行提取 data: 字段
        for (const line of event.split('\n')) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.substring(6);
            if (dataStr === '[DONE]') {
              setLoading(false);
              return;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.text) {
                fullText += data.text;

                // P1-9: 节流——每50ms最多更新一次UI
                const now = Date.now();
                if (now - lastUpdate > THROTTLE_MS) {
                  lastUpdate = now;
                  setMessages(prev => prev.map(m =>
                    m.id === botId ? { ...m, text: fullText } : m
                  ));
                }
              }
              if (data.sid) setSessionId(data.sid);
              if (data.done) {
                // 最后一次不丢
                if (fullText) {
                  setMessages(prev => prev.map(m =>
                    m.id === botId ? { ...m, text: fullText } : m
                  ));
                }
                setLoading(false);
              }
            } catch (e) {
              console.warn('SSE解析失败:', dataStr.substring(0, 50), e); // P1-7
            }
          }
        }
      }
    };

    xhr.onerror = () => {
      setMessages(prev => prev.map(m =>
        m.id === botId && !m.text ? { ...m, text: '网络错误 😢' } : m
      ));
      setLoading(false);
    };

    xhr.ontimeout = () => {
      // P1-11: 超时处理
      setMessages(prev => prev.map(m =>
        m.id === botId ? { ...m, text: fullText || '请求超时，请重试 ⏰' } : m
      ));
      setLoading(false);
    };

    xhr.onloadend = () => {
      // P1-9: 确保最后一次更新不丢
      if (fullText && loading) {
        setMessages(prev => prev.map(m =>
          m.id === botId ? { ...m, text: fullText } : m
        ));
      }
      setLoading(false);
    };

    xhr.send(JSON.stringify({ message: text, session_id: sessionId }));
  };

  // 组件卸载时取消请求
  useEffect(() => {
    return () => {
      if (streamRef.current) streamRef.current.abort();
    };
  }, []);

  // P1-15: 只用 onContentSizeChange，删掉重复的滚动监听
  const scrollToEnd = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: false });
    }, 50);
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.msgRow,
      item.role === 'user' ? styles.msgUser : styles.msgHermes,
    ]}>
      <View style={[
        styles.bubble,
        item.role === 'user' ? styles.bubbleUser : styles.bubbleHermes,
      ]}>
        <Text style={[
          styles.bubbleText,
          item.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextHermes,
        ]}>
          {item.text}
        </Text>
        {/* P1-10: 用转圈+文字代替三个点 */}
        {item.role === 'hermes' && !item.text && loading && (
          <View style={styles.thinking}>
            <ActivityIndicator size="small" color={C.sub} />
            <Text style={styles.thinkingText}>思考中...</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* 顶栏 */}
      <View style={styles.header}>
        <View style={styles.headerDot} />
        <Text style={styles.headerTitle}>Hermes</Text>
        <Text style={styles.headerSub}>AI 助手</Text>
      </View>

      {/* 消息列表 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={scrollToEnd}
        onLayout={scrollToEnd}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⚕️</Text>
            <Text style={styles.emptyTitle}>Hermes</Text>
            <Text style={styles.emptySub}>有什么可以帮你？</Text>
          </View>
        }
      />

      {/* 输入栏 */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="发消息..."
            placeholderTextColor={C.sub}
            multiline
            maxLength={2000}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            blurOnSubmit={false}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() && !loading) && styles.sendBtnDisabled]}
            onPress={loading ? stopStream : sendMessage}
            disabled={!input.trim() && !loading}
          >
            {loading ? (
              <Text style={styles.stopBtn}>■</Text>
            ) : (
              <Text style={styles.sendBtnText}>↑</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    marginRight: 10,
  },
  headerTitle: {
    color: C.text,
    fontSize: 18,
    fontWeight: '700',
  },
  headerSub: {
    color: C.sub,
    fontSize: 13,
    marginLeft: 8,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 8,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: C.text,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptySub: {
    color: C.sub,
    fontSize: 15,
  },
  msgRow: {
    marginBottom: 12,
    flexDirection: 'row',
  },
  msgUser: {
    justifyContent: 'flex-end',
  },
  msgHermes: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bubbleUser: {
    backgroundColor: C.userBubble,
    borderBottomRightRadius: 4,
  },
  bubbleHermes: {
    backgroundColor: C.bubbleHermes,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 16,
    lineHeight: 22,
  },
  bubbleTextUser: {
    color: '#fff',
  },
  bubbleTextHermes: {
    color: C.text,
  },
  // P1-10: 思考中动画
  thinking: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  thinkingText: {
    color: C.sub,
    fontSize: 13,
    marginLeft: 6,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.bg,
  },
  input: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 10,
    color: C.text,
    fontSize: 16,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: C.border,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: C.border,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  stopBtn: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
