// 聊天页面 v5.0 — 多模型切换 + 4 预设模式
// v5.2.2: 版本号单一真源（package.json） + weixin会话筛选
import React, { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react';
import { APP_VERSION } from '../constants/version';
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
  ActivityIndicator,
} from 'react-native';
// [版本D] 恢复图片+文件，音频仍禁用
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
// import { Audio } from 'expo-av';
import { Colors } from '../colors';
import { loadConversations, saveConversations } from '../utils/storage';
import { sendMessageStream, uploadImage, uploadFile, fetchSessionMessages } from '../utils/api';
// expo-av 在部分设备上导致闪退，暂用懒加载（需进一步定位）
// import { getAudio } from '../utils/audio';
import MessageBubble from '../components/MessageBubble';
import EmptyState from '../components/EmptyState';
// [版本D] 恢复 AttachMenu
import AttachMenu from '../components/AttachMenu';
// [M1] 模型切换 + 预设 — v5.3.0 解耦
import ModelSelector from '../components/ModelSelector';
import PresetTabs from '../components/PresetTabs';
import { loadModel, saveModel, loadPreset, savePreset, loadOverrides, saveOverrides, loadPresetsList, savePresetsList, fetchPresetsFromServer, getSendParams, DEFAULT_MODEL, DEFAULT_PRESET, FALLBACK_OVERRIDES } from '../utils/presets';

export default function ChatScreen({ route, navigation }) {
  const { conversationId } = route.params;

  const [messages, setMessages] = useState([]);       // 当前消息列表
  const [inputText, setInputText] = useState('');      // 输入框文本
  const [isStreaming, setIsStreaming] = useState(false); // 是否正在接收流
  const [sessionId, setSessionId] = useState('');       // 后端 sid
  const [convTitle, setConvTitle] = useState('新对话');  // 会话标题
  // [版本D] 恢复附件菜单状态
  const [attachVisible, setAttachVisible] = useState(false); // 附件菜单
  // [M1 v5.3.0] 模型 + 预设解耦
  const [currentModel, setCurrentModel] = useState(DEFAULT_MODEL);
  const [currentPreset, setCurrentPreset] = useState(DEFAULT_PRESET);
  const [models, setModels] = useState([]);
  const [presets, setPresets] = useState([]);
  const [overrides, setOverrides] = useState(FALLBACK_OVERRIDES);
  // v5.3.1: API 调试信息开关
  const [showDebugInfo, setShowDebugInfo] = useState(true);

  // ─── Phase 1: 滚底检测 ────────────────────────────────
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const flatListRef = useRef(null);
  const abortRef = useRef(null);           // 取消请求的函数
  const messagesRef = useRef([]);          // 最新消息引用（避免闭包旧值）
  // [版本D] 恢复录音引用（handleAttachSelect 里用）
  const recordingRef = useRef(null);       // Audio.Recording 实例
  const [keyboardHeight, setKeyboardHeight] = useState(0); // 键盘高度

  // ─── v5.1.3: typewriter 打字机 refs ──────────────────
  const typewriterTimerRef = useRef(null);    // setInterval handle
  const pendingRef = useRef({ text: '', reasoning: '', toolCalls: [] }); // 字符蓄水池

  // ─── Phase 1: reasoning 状态 refs ─────────────────────
  const reasoningStartRef = useRef(null);  // 推理开始时间戳

  // v5.2.1: 双源加载消息历史（本地优先 → 云端 fallback）
  const [loadingHistory, setLoadingHistory] = useState(false);
  const loadMessages = useCallback(async () => {
    // 1. 先查本地
    const convs = await loadConversations();
    const conv = convs.find(c => c.id === conversationId);
    if (conv) {
      setMessages(conv.messages || []);
      messagesRef.current = conv.messages || [];
      if (conv.title) setConvTitle(conv.title);
      return;
    }

    // 2. 本地没有 → 调云端 API 拉历史
    setLoadingHistory(true);
    try {
      const raw = await fetchSessionMessages(conversationId);
      // 映射：role=assistant→hermes, content→text, id→_id
      const msgs = raw
        .filter(m => m.role !== 'tool') // 跳过工具调用
        .map(m => ({
          id: 'c_' + m.id,
          role: m.role === 'assistant' ? 'hermes' : 'user',
          text: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
          timestamp: m.created_at ? m.created_at * 1000 : Date.now(),
          _fromCloud: true,
        }));
      setMessages(msgs);
      messagesRef.current = msgs;
      if (route.params?.presetTitle) setConvTitle(route.params.presetTitle);
    } catch (e) {
      console.warn('云端历史加载失败:', e);
      setMessages([]);
      messagesRef.current = [];
    } finally {
      setLoadingHistory(false);
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

  // ─── Phase 1: 滚底检测 ────────────────────────────────
  const handleScroll = useCallback((event) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;
    const atBottom = distanceFromBottom < 50;
    setIsAtBottom(atBottom);
    setShowScrollBtn(!atBottom);
  }, []);

  // 滚动到底部（主动调用）
  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);
  };

  // 智能滚底：仅当用户在底部时才自动滚动
  const smartScrollToBottom = useCallback(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [isAtBottom]);

  // 初次加载
  React.useEffect(() => {
    loadMessages();
    // [M1 v5.3.0] 加载模型/预设/overrides
    Promise.all([loadModel(), loadPreset(), loadOverrides()]).then(([m, p, ov]) => {
      setCurrentModel(m);
      setCurrentPreset(p);
      if (ov) setOverrides(ov);
    });
    // 拉取后端模型列表 + 预设元数据
    fetch('http://8.163.2.252/app-api/models')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setModels(d); })
      .catch(() => {});
    fetchPresetsFromServer().then(ok => {
      if (ok) {
        loadPresetsList().then(setPresets);
        loadOverrides().then(ov => { if (ov) setOverrides(ov); });
      }
    });
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

  // 页面销毁时取消请求 + 停止 typewriter + 停止录音
  React.useEffect(() => {
    return () => {
      abortRef.current?.();
      recordingRef.current?.stopAndUnloadAsync?.();
      if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    };
  }, []);

  // v5.3.1: 初始化读取 API 调试开关
  React.useEffect(() => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    AsyncStorage.getItem('hermes_show_api_debug').then((v) => {
      if (v !== null) setShowDebugInfo(v === 'true');
    });
  }, []);

  // 右上角设置按钮 + [M1] 左上角模型选择
  useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <ModelSelector
          currentModel={currentModel}
          models={models}
          onSelect={handleModelSelect}
        />
      ),
      headerRight: () => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Settings')}
          style={styles.settingsBtn}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, currentModel, models]);

  // ─── 多媒体处理 ───────────────────────────────────────

  /**
   * v5.1.3: typewriter 打字机 tick
   * 每 35ms 从 pendingRef.text 头部取 N 字追加到消息，
   * N=1 默认，pending>80字时 N=2 加速，>200 字时 N=3 防积压
   */
  const typewriterTick = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending.text) return;
    const N = pending.text.length > 200 ? 3 : pending.text.length > 80 ? 2 : 1;
    const chunk = pending.text.slice(0, N);
    pending.text = pending.text.slice(N);

    const msgs = [...messagesRef.current];
    const last = msgs[msgs.length - 1];
    if (last && last.role === 'hermes') {
      last.text = (last.text || '') + chunk;
      messagesRef.current = msgs;
      setMessages([...msgs]);
      smartScrollToBottom();
    }
  }, [smartScrollToBottom]);

  /** 立即 flush reasoning + toolCalls（不做 typewriter） */
  const flushMeta = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending.reasoning && pending.toolCalls.length === 0) return;
    const msgs = [...messagesRef.current];
    const last = msgs[msgs.length - 1];
    if (!last || last.role !== 'hermes') return;
    let changed = false;
    if (pending.reasoning) {
      last.reasoning = (last.reasoning || '') + pending.reasoning;
      pending.reasoning = '';
      changed = true;
    }
    if (pending.toolCalls.length > 0) {
      last.toolCalls = [...(last.toolCalls || []), ...pending.toolCalls];
      pending.toolCalls = [];
      changed = true;
    }
    if (changed) {
      messagesRef.current = msgs;
      setMessages([...msgs]);
    }
  }, []);

  /** 发送一条用户消息 + 一条 bot 占位消息，然后走 SSE */
  const sendToAI = async (userMsg) => {
    // 清空旧 typewriter
    if (typewriterTimerRef.current) clearInterval(typewriterTimerRef.current);
    pendingRef.current = { text: '', reasoning: '', toolCalls: [] };
    reasoningStartRef.current = null;

    const withUser = [...messagesRef.current, userMsg];
    setMessages(withUser);
    messagesRef.current = withUser;
    persistMessages(withUser);
    scrollToBottom();

    // 添加占位 bot 消息（含 reasoning + toolCalls 空字段）
    const botMsg = {
      id: 'b_' + Date.now(),
      role: 'hermes',
      text: '',
      reasoning: '',
      toolCalls: [],
      reasoningOpen: true,
      timestamp: Date.now(),
    };
    const withBot = [...withUser, botMsg];
    setMessages(withBot);
    messagesRef.current = withBot;
    setIsStreaming(true);

    // ─── v5.1.3: 启动 typewriter 定时器（35ms/tick） ──
    typewriterTimerRef.current = setInterval(typewriterTick, 35);

    const textToSend = userMsg.text;

    abortRef.current = sendMessageStream(
      textToSend,
      sessionId,
      await getSendParams(currentModel, currentPreset, overrides, models),
      (chunk) => {
        if (chunk.sid && !sessionId) {
          setSessionId(chunk.sid);
        }

        // reasoning → 立即 flush
        if (chunk.reasoning) {
          if (!reasoningStartRef.current) {
            reasoningStartRef.current = Date.now();
          }
          pendingRef.current.reasoning += chunk.reasoning;
          flushMeta();
        }

        // tool_calls → 立即 flush
        if (chunk.tool_calls) {
          const tc = Array.isArray(chunk.tool_calls) ? chunk.tool_calls : [chunk.tool_calls];
          pendingRef.current.toolCalls.push(...tc);
          flushMeta();
        }

        // text → 囤入蓄水池，typewriter 定时器自动消费
        if (chunk.text) {
          pendingRef.current.text += chunk.text;
        }
      },
      async () => {
        // 流结束：停 typewriter + 一次性 flush 剩余文本
        if (typewriterTimerRef.current) {
          clearInterval(typewriterTimerRef.current);
          typewriterTimerRef.current = null;
        }
        // 把 pendingRef 里剩余的文字一次性追加
        const remaining = pendingRef.current.text;
        pendingRef.current.text = '';
        if (remaining) {
          const msgs = [...messagesRef.current];
          const last = msgs[msgs.length - 1];
          if (last && last.role === 'hermes') {
            last.text = (last.text || '') + remaining;
            messagesRef.current = msgs;
            setMessages([...msgs]);
          }
        }

        const reasoningSec = reasoningStartRef.current
          ? Math.round((Date.now() - reasoningStartRef.current) / 1000)
          : 0;

        setIsStreaming(false);
        abortRef.current = null;

        const msgs = [...messagesRef.current];
        const last = msgs[msgs.length - 1];
        if (last && last.role === 'hermes') {
          if (reasoningSec > 0) {
            last.reasoningDuration = reasoningSec;
          }
          if (last.reasoning) {
            setTimeout(() => {
              const fresh = [...messagesRef.current];
              const bot = fresh[fresh.length - 1];
              if (bot && bot.role === 'hermes') {
                bot.reasoningOpen = false;
                setMessages([...fresh]);
                messagesRef.current = fresh;
              }
            }, 1000);
          }
        }

        await persistMessages(msgs);
      },
      (error) => {
        // 出错：停 typewriter + flush 剩余
        if (typewriterTimerRef.current) {
          clearInterval(typewriterTimerRef.current);
          typewriterTimerRef.current = null;
        }
        const remaining = pendingRef.current.text;
        pendingRef.current = { text: '', reasoning: '', toolCalls: [] };
        setIsStreaming(false);
        abortRef.current = null;
        const msgs = [...messagesRef.current];
        const last = msgs[msgs.length - 1];
        if (last && last.role === 'hermes') {
          if (remaining) last.text = (last.text || '') + remaining;
          last.text = last.text || `❌ ${error}`;
          setMessages([...msgs]);
          messagesRef.current = msgs;
        }
        persistMessages(msgs);
      },
      // v5.3.1: meta 调试信息回调 (type=meta 的 SSE 事件)
      (meta) => {
        const msgs = [...messagesRef.current];
        const last = msgs[msgs.length - 1];
        if (last && last.role === 'hermes') {
          last.meta = {
            model: meta.model || '',
            endpoint: meta.endpoint || '',
            latency_ms: meta.latency_ms || 0,
            temperature: meta.temperature,
            max_tokens: meta.max_tokens,
          };
          messagesRef.current = msgs;
          setMessages([...msgs]);
        }
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

      default:
        if (key === 'audio') {
          Alert.alert('语音功能暂不可用', '因技术原因，语音录制暂不支持');
        }
        break;
    }
  };

  // ─── M1 v5.3.0: 模型/预设完全解耦 ──────────────────
  const handleModelSelect = async (modelId) => {
    setCurrentModel(modelId);
    await saveModel(modelId);
    // 切模型不动预设
  };

  const handlePresetSelect = async (presetId) => {
    setCurrentPreset(presetId);
    await savePreset(presetId);
    // 切预设不动模型
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
    if (throttleRef.current) clearTimeout(throttleRef.current);
    flushPending();
    setIsStreaming(false);
    abortRef.current = null;
  };

  // ─── Phase 1: 推理区折叠切换 ─────────────────────────
  const toggleReasoning = useCallback((msgId) => {
    const msgs = [...messagesRef.current];
    const msg = msgs.find(m => m.id === msgId);
    if (msg) {
      msg.reasoningOpen = !msg.reasoningOpen;
      setMessages([...msgs]);
      messagesRef.current = msgs;
    }
  }, []);

  // 渲染消息
  const renderMessage = ({ item }) => {
    const isThinking = isStreaming && item.role === 'hermes' && !item.text && !item.reasoning;
    return (
      <MessageBubble
        message={item}
        isThinking={isThinking}
        isStreaming={item.role === 'hermes' && isStreaming}
        onToggleReasoning={item.reasoning ? () => toggleReasoning(item.id) : undefined}
        showDebugInfo={showDebugInfo}
      />
    );
  };

  // ─── 输入栏（共用） ─────────────────────────────────
  const renderInputBar = () => (
    <View style={[styles.inputBar, { paddingBottom: 36 }]}>
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
      <View style={styles.container}>
        <PresetTabs
          activePresetId={currentPreset}
          currentModel={currentModel}
          presets={presets}
          models={models}
          onPresetSelect={handlePresetSelect}
          disabled={isStreaming}
        />
        <View style={styles.emptyFull}>
          {keyboardHeight > 0 ? null : loadingHistory ? (
            <View style={styles.loadingCloud}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.loadingCloudText}>加载云端历史中…</Text>
            </View>
          ) : (
            <>
              <EmptyState icon="⚕️" title="Hermes" subtitle="有什么可以帮你？" />
              <Text style={styles.versionText}>v{APP_VERSION}</Text>
            </>
          )}
        </View>
        {renderInputBar()}
        <AttachMenu
          visible={attachVisible}
          onClose={() => setAttachVisible(false)}
          onSelect={handleAttachSelect}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PresetTabs
        activePresetId={currentPreset}
        currentModel={currentModel}
        presets={presets}
        models={models}
        onPresetSelect={handlePresetSelect}
        disabled={isStreaming}
      />
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        style={{ flex: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={smartScrollToBottom}
        onLayout={scrollToBottom}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      />

      {/* Phase 1: 回到底部浮动按钮 */}
      {showScrollBtn && (
        <TouchableOpacity
          style={styles.scrollBtn}
          onPress={scrollToBottom}
          activeOpacity={0.8}
        >
          <Text style={styles.scrollBtnText}>↓</Text>
        </TouchableOpacity>
      )}

      {renderInputBar()}

      {/* [版本D] AttachMenu 已恢复 */}
      <AttachMenu
        visible={attachVisible}
        onClose={() => setAttachVisible(false)}
        onSelect={handleAttachSelect}
      />
    </View>
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
    marginHorizontal: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    paddingHorizontal: 10,
    paddingVertical: 10,
    paddingBottom: 36,
    paddingTop: 12,
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
  emptyFull: {
    flex: 1,
    flexShrink: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  versionText: {
    color: Colors.sub,
    fontSize: 12,
    marginTop: -8,
    opacity: 0.5,
  },
  // v5.2.1: 云端历史加载中
  loadingCloud: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingCloudText: {
    color: Colors.sub,
    fontSize: 14,
  },
  // ─── Phase 1: 滚底浮动按钮 ─────────────────────────
  scrollBtn: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 10,
  },
  scrollBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
});
