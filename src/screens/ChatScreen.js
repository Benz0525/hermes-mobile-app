// 聊天页面 —— 收发消息、流式响应
import React, { useState, useRef, useCallback, useLayoutEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Colors } from '../colors';
import { loadConversations, saveConversations } from '../utils/storage';
import { sendMessageStream } from '../utils/api';
import MessageBubble from '../components/MessageBubble';
import EmptyState from '../components/EmptyState';

export default function ChatScreen({ route, navigation }) {
  const { conversationId } = route.params;

  const [messages, setMessages] = useState([]);       // 当前消息列表
  const [inputText, setInputText] = useState('');      // 输入框文本
  const [isStreaming, setIsStreaming] = useState(false); // 是否正在接收流
  const [sessionId, setSessionId] = useState('');       // 后端 sid
  const [convTitle, setConvTitle] = useState('新对话');  // 会话标题

  const flatListRef = useRef(null);
  const abortRef = useRef(null);           // 取消请求的函数
  const messagesRef = useRef([]);          // 最新消息引用（避免闭包旧值）

  // 加载该会话的历史消息
  const loadMessages = useCallback(async () => {
    const convs = await loadConversations();
    const conv = convs.find(c => c.id === conversationId);
    if (conv) {
      setMessages(conv.messages || []);
      messagesRef.current = conv.messages || [];
      if (conv.title) setConvTitle(conv.title);
    } else {
      setMessages([]);
      messagesRef.current = [];
    }
  }, [conversationId]);

  // 保存消息到 storage
  const persistMessages = useCallback(async (msgs) => {
    const convs = await loadConversations();
    const idx = convs.findIndex(c => c.id === conversationId);
    const title = convTitle !== '新对话' ? convTitle : (msgs.length > 0 && msgs[0].role === 'user' ? msgs[0].text.slice(0, 20) : '新对话');
    const conv = {
      id: conversationId,
      title,
      messages: msgs,
      updatedAt: Date.now(),
    };
    if (idx >= 0) {
      convs[idx] = conv;
    } else {
      convs.unshift(conv);
    }
    await saveConversations(convs);
  }, [conversationId, convTitle]);

  // 滚动到底部
  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // 初次加载
  React.useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // 页面销毁时取消请求
  React.useEffect(() => {
    return () => {
      abortRef.current?.();
    };
  }, []);

  // 右上角设置按钮
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsBtn}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // 发送消息
  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;

    // 1. 添加用户消息
    const userMsg = {
      id: 'u_' + Date.now(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    const withUser = [...messagesRef.current, userMsg];
    setMessages(withUser);
    messagesRef.current = withUser;
    setInputText('');
    persistMessages(withUser);
    scrollToBottom();

    // 2. 添加占位 bot 消息（思考中）
    const botMsg = {
      id: 'b_' + Date.now(),
      role: 'hermes',
      text: '',
      timestamp: Date.now(),
    };
    const withBot = [...withUser, botMsg];
    setMessages(withBot);
    messagesRef.current = withBot;
    setIsStreaming(true);

    // 3. 发起 SSE 流式请求
    abortRef.current = sendMessageStream(
      text,
      sessionId,
      // onChunk
      (chunk) => {
        // 记录后端 sid
        if (chunk.sid && !sessionId) {
          setSessionId(chunk.sid);
        }
        // 累加文本
        if (chunk.text) {
          const msgs = [...messagesRef.current];
          const last = msgs[msgs.length - 1];
          if (last && last.role === 'hermes') {
            last.text += chunk.text;
            setMessages([...msgs]);
            messagesRef.current = msgs;
          }
        }
      },
      // onDone
      async () => {
        setIsStreaming(false);
        abortRef.current = null;
        // 流结束后的最终保存
        const msgs = [...messagesRef.current];
        await persistMessages(msgs);
      },
      // onError
      (error) => {
        setIsStreaming(false);
        abortRef.current = null;
        const msgs = [...messagesRef.current];
        const last = msgs[msgs.length - 1];
        if (last && last.role === 'hermes') {
          last.text = last.text || `❌ ${error}`;
          setMessages([...msgs]);
          messagesRef.current = msgs;
        }
        persistMessages(msgs);
      }
    );

    scrollToBottom();
  };

  // 停止生成
  const handleStop = () => {
    abortRef.current?.();
    setIsStreaming(false);
    abortRef.current = null;
  };

  // 渲染消息
  const renderMessage = ({ item }) => {
    const isThinking = isStreaming && item.role === 'hermes' && !item.text;
    return <MessageBubble message={item} isThinking={isThinking} />;
  };

  // 空状态
  if (messages.length === 0) {
    return (
      <View style={styles.container}>
        <EmptyState icon="⚕️" title="Hermes" subtitle="有什么可以帮你？" />
        {/* 底部输入栏 */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            placeholder="输入消息…"
            placeholderTextColor={Colors.sub}
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={4000}
            editable={!isStreaming}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={scrollToBottom}
        onLayout={scrollToBottom}
      />

      {/* 底部输入栏 */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="输入消息…"
          placeholderTextColor={Colors.sub}
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={4000}
          editable={!isStreaming}
        />
        {isStreaming ? (
          <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
            <Text style={styles.stopBtnText}>■</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendBtnText}>↑</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  messageList: {
    paddingTop: 12,
    paddingBottom: 16,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    paddingBottom: 16,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.bg,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.border,
  },
  sendBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  stopBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  stopBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  settingsBtn: {
    padding: 6,
    marginRight: 4,
  },
  settingsIcon: {
    fontSize: 20,
  },
});
