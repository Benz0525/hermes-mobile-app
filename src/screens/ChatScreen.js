// 聊天页面 —— 收发消息、流式响应、多媒体支持
import React, { useState, useRef, useCallback, useLayoutEffect } from 'react';
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StyleSheet,
  Alert,
} from 'react-native';
// [版本D] 恢复图片+文件，音频仍禁用
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
// import { Audio } from 'expo-av';
import { Colors } from '../colors';
import { loadConversations, saveConversations } from '../utils/storage';
import { sendMessageStream, uploadImage, uploadFile } from '../utils/api';
// expo-av 在部分设备上导致闪退，暂用懒加载（需进一步定位）
// import { getAudio } from '../utils/audio';
import MessageBubble from '../components/MessageBubble';
import EmptyState from '../components/EmptyState';
// [版本D] 恢复 AttachMenu
import AttachMenu from '../components/AttachMenu';

export default function ChatScreen({ route, navigation }) {
  const { conversationId } = route.params;

  const [messages, setMessages] = useState([]);       // 当前消息列表
  const [inputText, setInputText] = useState('');      // 输入框文本
  const [isStreaming, setIsStreaming] = useState(false); // 是否正在接收流
  const [sessionId, setSessionId] = useState('');       // 后端 sid
  const [convTitle, setConvTitle] = useState('新对话');  // 会话标题
  // [版本D] 恢复附件菜单状态
  const [attachVisible, setAttachVisible] = useState(false); // 附件菜单

  const flatListRef = useRef(null);
  const abortRef = useRef(null);           // 取消请求的函数
  const messagesRef = useRef([]);          // 最新消息引用（避免闭包旧值）
  // [版本D] 恢复录音引用（handleAttachSelect 里用）
  const recordingRef = useRef(null);       // Audio.Recording 实例
  const [keyboardHeight, setKeyboardHeight] = useState(0); // 键盘高度

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

  // 键盘监听 —— Android 上动态调整输入栏位置
  React.useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        scrollToBottom();
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // 页面销毁时取消请求 + 停止录音
  React.useEffect(() => {
    return () => {
      abortRef.current?.();
      recordingRef.current?.stopAndUnloadAsync?.();
      // expo-av 已移除，录音清理暂禁用
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

  // ─── 多媒体处理 ───────────────────────────────────────

  /** 发送一条用户消息 + 一条 bot 占位消息，然后走 SSE */
  const sendToAI = (userMsg) => {
    const withUser = [...messagesRef.current, userMsg];
    setMessages(withUser);
    messagesRef.current = withUser;
    persistMessages(withUser);
    scrollToBottom();

    // 添加占位 bot 消息
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

    const textToSend = userMsg.text;

    abortRef.current = sendMessageStream(
      textToSend,
      sessionId,
      (chunk) => {
        if (chunk.sid && !sessionId) {
          setSessionId(chunk.sid);
        }
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
      async () => {
        setIsStreaming(false);
        abortRef.current = null;
        const msgs = [...messagesRef.current];
        await persistMessages(msgs);
      },
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

  /** [版本D] 附件菜单回调 — 图片+文件已恢复，音频仍禁用 */
  const handleAttachSelect = async (key) => {
    switch (key) {
      case 'gallery': {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('权限不足', '需要相册权限才能选择图片');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.8,
        });
        if (result.canceled || !result.assets?.length) return;
        const uri = result.assets[0].uri;
        try {
          const uploadRes = await uploadImage(uri);
          const desc = uploadRes?.description || '';
          const userMsg = {
            id: 'u_' + Date.now(),
            role: 'user',
            text: desc ? `[用户发送了一张图片] 图片描述：${desc}` : '[用户发送了一张图片]',
            imageUri: uri,
            timestamp: Date.now(),
            uploadData: uploadRes,
          };
          sendToAI(userMsg);
        } catch (e) {
          Alert.alert('上传失败', e.message || '网络错误');
        }
        break;
      }

      case 'camera': {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('权限不足', '需要相机权限才能拍照');
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
        });
        if (result.canceled || !result.assets?.length) return;
        const uri = result.assets[0].uri;
        try {
          const uploadRes = await uploadImage(uri);
          const desc = uploadRes?.description || '';
          const userMsg = {
            id: 'u_' + Date.now(),
            role: 'user',
            text: desc ? `[用户发送了一张图片] 图片描述：${desc}` : '[用户发送了一张图片]',
            imageUri: uri,
            timestamp: Date.now(),
            uploadData: uploadRes,
          };
          sendToAI(userMsg);
        } catch (e) {
          Alert.alert('上传失败', e.message || '网络错误');
        }
        break;
      }

      case 'file': {
        try {
          const result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
          });
          if (result.canceled || !result.assets?.length) return;
          const file = result.assets[0];
          const uploadRes = await uploadFile(
            file.uri,
            file.name || 'file',
            file.mimeType
          );
          const fallbackText = uploadRes?.extracted_text || '[用户发送了一个文件]';
          const userMsg = {
            id: 'u_' + Date.now(),
            role: 'user',
            text: fallbackText,
            file: { name: file.name || '未知文件', size: file.size || 0 },
            timestamp: Date.now(),
            uploadData: uploadRes,
          };
          sendToAI(userMsg);
        } catch (e) {
          Alert.alert('上传失败', e.message || '网络错误');
        }
        break;
      }

      // expo-av 原生库在部分设备导致闪退，音频功能暂时禁用
      /*
        try {
          const Audio = await getAudio();
          const perm = await Audio.requestPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('权限不足', '需要麦克风权限才能录音');
            return;
          }
          await Audio.setAudioModeAsync({
            allowsRecordingIOS: true,
            playsInSilentModeIOS: true,
          });
          const { recording } = await Audio.Recording.createAsync(
            Audio.RecordingOptionsPresets.HIGH_QUALITY
          );
          recordingRef.current = recording;

          Alert.alert(
            '录音中',
            '点击确定结束录音',
            [
              { text: '停止录音', onPress: async () => {
                try {
                  await recording.stopAndUnloadAsync();
                  const uri = recording.getURI();
                  const status = await recording.getStatusAsync();
                  recordingRef.current = null;

                  const durationSec = Math.round(status.durationMillis / 1000);
                  const userMsg = {
                    id: 'u_' + Date.now(),
                    role: 'user',
                    text: `[语音消息]`,
                    audio: { uri, duration: durationSec },
                    timestamp: Date.now(),
                  };
                  const withUser = [...messagesRef.current, userMsg];
                  setMessages(withUser);
                  messagesRef.current = withUser;
                  persistMessages(withUser);
                  scrollToBottom();
                } catch (err) {
                  Alert.alert('录音出错', err.message);
                }
              }}
            ],
            { cancelable: false }
          );
        } catch (e) {
          Alert.alert('录音失败', e.message || '无法启动录音');
        }
        break;
      }
      */

      default:
        break;
    }
  };

  // ─── 文字发送 ───────────────────────────────────────

  const handleSend = () => {
    const text = inputText.trim();
    if (!text || isStreaming) return;

    const userMsg = {
      id: 'u_' + Date.now(),
      role: 'user',
      text,
      timestamp: Date.now(),
    };
    setInputText('');
    sendToAI(userMsg);
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

  // ─── 输入栏（共用） ─────────────────────────────────
  const renderInputBar = () => (
    <View style={[styles.inputBar, { paddingBottom: keyboardHeight > 0 ? keyboardHeight + 8 : 16 }]}>
      {/* [版本D] ➕ 附件按钮已恢复 */}
      <TouchableOpacity
        style={styles.attachBtn}
        onPress={() => setAttachVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.attachBtnText}>＋</Text>
      </TouchableOpacity>

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
  );

  // ─── 空状态 ─────────────────────────────────────────
  if (messages.length === 0) {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {keyboardHeight > 0 ? (
          // 键盘弹出时 —— 紧凑模式
          <View style={styles.emptyCompact}>
            <Text style={styles.emptyCompactText}>Hermes</Text>
          </View>
        ) : (
          // 键盘收起时 —— 完整空状态
          <EmptyState icon="⚕️" title="Hermes" subtitle="有什么可以帮你？" />
        )}
        {renderInputBar()}
        {/* [版本D] AttachMenu 已恢复 */}
        <AttachMenu
          visible={attachVisible}
          onClose={() => setAttachVisible(false)}
          onSelect={handleAttachSelect}
        />
      </KeyboardAvoidingView>
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

      {renderInputBar()}

      {/* [版本D] AttachMenu 已恢复 */}
      <AttachMenu
        visible={attachVisible}
        onClose={() => setAttachVisible(false)}
        onSelect={handleAttachSelect}
      />
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    paddingBottom: 16,
    gap: 8,
  },
  attachBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.botBubble,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  attachBtnText: {
    color: Colors.sub,
    fontSize: 22,
    lineHeight: 24,
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
  emptyCompact: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyCompactText: {
    color: Colors.accent,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 2,
  },
});
