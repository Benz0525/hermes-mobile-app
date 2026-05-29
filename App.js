import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, SafeAreaView
} from 'react-native';

// ====== 配置 ======
const API_STREAM = 'http://8.163.2.252/app-api/chat/stream';

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
  const streamRef = useRef(null); // 用于取消流式请求

  const sendMessage = () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg = { id: Date.now().toString(), role: 'user', text };
    const botId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, userMsg, { id: botId, role: 'hermes', text: '' }]);
    setInput('');
    setLoading(true);

    // 用 XMLHttpRequest 实现流式——React Native 最兼容的方式
    const xhr = new XMLHttpRequest();
    streamRef.current = xhr;
    let lastIndex = 0;
    let fullText = '';

    xhr.open('POST', API_STREAM);
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onprogress = () => {
      const newText = xhr.responseText.substring(lastIndex);
      lastIndex = xhr.responseText.length;

      // 解析SSE：按行分割，提取data字段
      const lines = newText.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.text) {
              fullText += data.text;
              setMessages(prev => prev.map(m =>
                m.id === botId ? { ...m, text: fullText } : m
              ));
            }
            if (data.sid) setSessionId(data.sid);
            if (data.done) {
              setLoading(false);
            }
          } catch (e) {}
        }
      }
    };

    xhr.onerror = () => {
      setMessages(prev => prev.map(m =>
        m.id === botId && !m.text ? { ...m, text: '连接失败 😢' } : m
      ));
      setLoading(false);
    };

    xhr.onloadend = () => {
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

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

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
          {item.role === 'hermes' && !item.text && loading && (
            <Text style={{ color: C.sub }}>...</Text>
          )}
        </Text>
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
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
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
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
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
});
