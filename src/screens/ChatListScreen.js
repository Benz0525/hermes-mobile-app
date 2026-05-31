// 对话列表页面 —— Linear 暗色风格 · v5.4.0 极客风分组 + 会话交互
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  TextInput,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../colors';
import { loadConversations, saveConversations } from '../utils/storage';
import { fetchSessions } from '../utils/api';
import ConversationItem from '../components/ConversationItem';
import EmptyState from '../components/EmptyState';
import ActionSheet from '../components/ActionSheet';
import SwipeableRow from '../components/SwipeableRow';
import DrawerMenu from '../components/DrawerMenu';
import { formatTime } from '../utils/time';
import { dateGroup } from '../utils/dateFormat';
// v5.4.1: persona + depth
import { PERSONAS, DEFAULT_PERSONA_ID } from '../constants/personas';
import { DEPTHS, DEFAULT_DEPTH_ID } from '../constants/depths';

export default function ChatListScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [apiSessions, setApiSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState('');
  // v5.4.0 B1: 长按菜单
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [selectedConv, setSelectedConv] = useState(null);
  // v5.4.0 B3: 未读 badge
  const [unreadMap, setUnreadMap] = useState({});
  // v5.4.0 D1: 抽屉菜单
  const [drawerVisible, setDrawerVisible] = useState(false);
  // v5.4.1: persona + depth
  const [currentPersonaId, setCurrentPersonaId] = useState(DEFAULT_PERSONA_ID);
  const [currentDepthId, setCurrentDepthId] = useState(DEFAULT_DEPTH_ID);

  // 加载数据
  const loadData = useCallback(async (silent) => {
    if (!silent) setRefreshing(true);
    try {
      const [convs, sessions] = await Promise.all([
        loadConversations(),
        fetchSessions().catch(e => {
          setApiError(e.message || '无法连接');
          return [];
        }).then(sessions => sessions.filter(
          s => s.user_id != null && s.source !== 'api_server'
        )),
      ]);
      convs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
      setConversations(convs);
      setApiSessions(sessions);
      setApiError('');
    } catch (e) {
      // 本地加载失败忽略
    }
    setRefreshing(false);
  }, []);

  // 每次页面获得焦点时重新加载
  useFocusEffect(
    useCallback(() => {
      loadData(true);
      loadUnreadBadges();
    }, [loadData])
  );

  // v5.4.1: 加载 persona + depth
  useEffect(() => {
    AsyncStorage.getItem('current_persona').then(v => { if (v) setCurrentPersonaId(v); });
    AsyncStorage.getItem('current_depth').then(v => { if (v) setCurrentDepthId(v); });
  }, []);

  // v5.4.0 B3: 加载未读 badge — hermes_last_seen_{convId}
  const loadUnreadBadges = async () => {
    try {
      const convs = await loadConversations();
      const map = {};
      for (const c of convs) {
        const key = `hermes_last_seen_${c.id}`;
        const lastSeen = await AsyncStorage.getItem(key);
        if (lastSeen && c.messages && c.messages.length > 0) {
          const lastMsg = c.messages[c.messages.length - 1];
          if (lastMsg.role === 'hermes' && lastMsg.timestamp > parseInt(lastSeen)) {
            map[c.id] = true;
          }
        }
      }
      setUnreadMap(map);
    } catch (e) { /* ignore */ }
  };

  // 新建对话
  const handleNewChat = () => {
    const newId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    navigation.navigate('Chat', { conversationId: newId });
  };

  // 点击本地会话
  const handlePress = (conv) => {
    navigation.navigate('Chat', { conversationId: conv.id });
  };

  // 长按 → B1: ActionSheet (删除/重命名/置顶)
  const handleLongPress = (conv) => {
    setSelectedConv(conv);
    setActionSheetVisible(true);
  };

  // B1: ActionSheet 选择
  const handleActionSelect = async (action) => {
    if (!selectedConv) return;
    const conv = selectedConv;
    switch (action) {
      case 'delete':
        await handleDelete(conv);
        break;
      case 'rename':
        handleRename(conv);
        break;
      case 'pin':
        await handlePin(conv);
        break;
    }
  };

  // B1: 删除
  const handleDelete = async (conv) => {
    const updated = conversations.filter(c => c.id !== conv.id);
    setConversations(updated);
    await saveConversations(updated);
  };

  // B1: 重命名
  const handleRename = (conv) => {
    Alert.prompt
      ? Alert.prompt('重命名', '输入新名称', [
          { text: '取消', style: 'cancel' },
          { text: '确定', onPress: async (text) => {
              const updated = conversations.map(c =>
                c.id === conv.id ? { ...c, title: text || conv.title } : c
              );
              setConversations(updated);
              await saveConversations(updated);
            }
          },
        ], 'plain-text', conv.title || '')
      : Alert.alert('重命名', '请输入新名称', [
          { text: '取消', style: 'cancel' },
          { text: '确定', onPress: () => {} },
        ]);
  };

  // B4: 置顶/取消置顶
  const handlePin = async (conv) => {
    const newPinned = !conv.isPinned;
    const updated = conversations.map(c =>
      c.id === conv.id ? { ...c, isPinned: newPinned } : c
    );
    setConversations(updated);
    await saveConversations(updated);
  };

  // B3: 清除未读 — 进入聊天时调用
  const markRead = async (convId) => {
    await AsyncStorage.setItem(`hermes_last_seen_${convId}`, Date.now().toString());
    setUnreadMap(prev => { const n = { ...prev }; delete n[convId]; return n; });
  };

  // v5.4.1: 角色/深度切换
  const handlePersonaSelect = async (id) => {
    setCurrentPersonaId(id);
    await AsyncStorage.setItem('current_persona', id);
  };
  const handleDepthSelect = async (id) => {
    setCurrentDepthId(id);
    await AsyncStorage.setItem('current_depth', id);
  };

  // v5.4.0 D3: 抽屉菜单选择
  const handleDrawerSelect = (id) => {
    switch (id) {
      case 'new_chat':
        handleNewChat();
        break;
      case 'tasks':
        navigation.navigate('Tasks');
        break;
      case 'settings':
        navigation.navigate('Settings');
        break;
      case 'about':
        Alert.alert('关于 Hermes', 'Hermes Mobile v5.4.0\nAI 智能助手\n由阿Ben的 Hermes 驱动');
        break;
      case 'wechat_sync':
        navigation.navigate('WechatSync');
        break;
    }
  };

  // v5.2.1: 点击 API session → 直接用云端 sid 打开
  const handleApiPress = (session) => {
    navigation.navigate('Chat', {
      conversationId: session.id,
      presetTitle: session.title || 'Hermes 会话',
      _cloudSession: true,
    });
  };

  // 设置页面头部 — v5.4.0 D2: 左侧 ☰ 抽屉 + 右侧 ＋
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => setDrawerVisible(true)}
          style={styles.headerIconBtn}
        >
          <Text style={styles.headerIcon}>☰</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <View style={styles.headerRightRow}>
          <TouchableOpacity onPress={handleNewChat} style={styles.addBtn}>
            <Text style={styles.addBtnText}>＋</Text>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation]);

  // 渲染列表项
  const renderItem = ({ item }) => {
    if (item._type === 'section') {
      return (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{item.title}</Text>
          {item.count != null && (
            <Text style={styles.sectionCount}>{item.count}</Text>
          )}
        </View>
      );
    }
    if (item._api) {
      // API session 项
      return (
        <TouchableOpacity
          style={styles.apiCard}
          activeOpacity={0.7}
          onPress={() => handleApiPress(item)}
        >
          <View style={styles.apiAvatar}>
            <Text style={styles.apiAvatarText}>🤖</Text>
          </View>
          <View style={styles.apiCenter}>
            <Text style={styles.apiTitle} numberOfLines={1}>
              {item.title || '(无标题)'}
            </Text>
            <Text style={styles.apiMeta} numberOfLines={1}>
              {item.model || 'unknown'} · {item.message_count || 0} 条消息
            </Text>
          </View>
          <Text style={styles.apiTime}>
            {item.started_at ? formatTime(item.started_at * 1000) : ''}
          </Text>
        </TouchableOpacity>
      );
    }
    // 本地会话项 — v5.4.0: SwipeableRow + 未读 badge
    return (
      <SwipeableRow onDelete={() => handleDelete(item)}>
        <ConversationItem
          conversation={item}
          onPress={() => { markRead(item.id); handlePress(item); }}
          onLongPress={() => handleLongPress(item)}
          hasUnread={!!unreadMap[item.id]}
        />
      </SwipeableRow>
    );
  };

  // 构建混合列表 — v5.4.0: 日期分组（今天/昨天/本周/更早）
  const mixedList = [];

  // 按日期分组本地会话
  const groups = { '今天': [], '昨天': [], '本周': [], '更早': [] };
  conversations.forEach(c => {
    const g = dateGroup(c.updatedAt);
    (groups[g] || groups['更早']).push(c);
  });

  // 置顶优先排序
  const GROUP_ORDER = ['今天', '昨天', '本周', '更早'];
  GROUP_ORDER.forEach(g => {
    if (groups[g] && groups[g].length > 0) {
      // 置顶在前
      groups[g].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      mixedList.push({ _type: 'section', title: g, count: groups[g].length });
      groups[g].forEach(c => mixedList.push(c));
    }
  });

  if (apiSessions.length > 0) {
    mixedList.push({ _type: 'section', title: '☁️ Hermes 云端', count: apiSessions.length });
    apiSessions.forEach(s => mixedList.push({ ...s, _api: true }));
  }

  // 空状态
  if (mixedList.length === 0) {
    return <EmptyState icon="💬" title="还没有对话" subtitle="点击右上角开始" />;
  }

  return (
    <View style={styles.container}>
      {apiError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>⚠️ 云端会话加载失败: {apiError}</Text>
        </View>
      ) : null}
      <FlatList
        data={mixedList}
        keyExtractor={(item, i) => item.id || `s_${i}`}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(false)}
            tintColor={Colors.accent}
          />
        }
      />

      {/* v5.4.0 B1: 长按菜单 */}
      <ActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        title={selectedConv?.title || ''}
        items={[
          { id: 'pin', title: selectedConv?.isPinned ? '取消置顶' : '置顶', icon: '📌' },
          { id: 'rename', title: '重命名', icon: '✏️' },
          { id: 'delete', title: '删除', icon: '🗑', danger: true },
        ]}
        onSelect={handleActionSelect}
      />

      {/* v5.4.1: 抽屉菜单 — 含 AI 角色 + 深度 */}
      <DrawerMenu
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onSelect={handleDrawerSelect}
        currentPersonaId={currentPersonaId}
        currentDepthId={currentDepthId}
        onPersonaSelect={handlePersonaSelect}
        onDepthSelect={handleDepthSelect}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  list: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  // v5.3.3 头部按钮容器
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  headerIcon: {
    fontSize: 20,
    color: Colors.text,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.sub,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionCount: {
    fontSize: 12,
    color: Colors.accent,
    marginLeft: 8,
  },
  apiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    marginHorizontal: 12,
    marginVertical: 4,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.accent + '33',
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  apiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accent + '22',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  apiAvatarText: {
    fontSize: 22,
  },
  apiCenter: {
    flex: 1,
    marginRight: 12,
  },
  apiTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  apiMeta: {
    fontSize: 12,
    color: Colors.sub,
  },
  apiTime: {
    fontSize: 12,
    color: Colors.sub,
  },
  errorBanner: {
    backgroundColor: Colors.danger + '22',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.danger + '44',
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
  },
});
