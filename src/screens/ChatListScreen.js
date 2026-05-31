// 对话列表页面 —— Linear 暗色风格 · v5.2.0 双源（本地 + hermes API sessions）
import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../colors';
import { loadConversations, saveConversations } from '../utils/storage';
import { fetchSessions } from '../utils/api';
import ConversationItem from '../components/ConversationItem';
import EmptyState from '../components/EmptyState';
import { formatTime } from '../utils/time';

export default function ChatListScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);
  const [apiSessions, setApiSessions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [apiError, setApiError] = useState('');

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
    }, [loadData])
  );

  // 新建对话
  const handleNewChat = () => {
    const newId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    navigation.navigate('Chat', { conversationId: newId });
  };

  // 点击本地会话
  const handlePress = (conv) => {
    navigation.navigate('Chat', { conversationId: conv.id });
  };

  // 长按删除本地会话
  const handleLongPress = (conv) => {
    Alert.alert(
      '删除对话',
      `确定要删除「${conv.title || '新对话'}」吗？`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: async () => {
            const updated = conversations.filter(c => c.id !== conv.id);
            setConversations(updated);
            await saveConversations(updated);
          },
        },
      ]
    );
  };

  // v5.2.1: 点击 API session → 直接用云端 sid 打开
  const handleApiPress = (session) => {
    navigation.navigate('Chat', {
      conversationId: session.id,
      presetTitle: session.title || 'Hermes 会话',
      _cloudSession: true,
    });
  };

  // 设置页面头部
  React.useLayoutEffect(() => {
    navigation.setOptions({
      // v5.3.3: 右上角 ⚙️ 设置 + ＋ 新建（设置全局入口下沉到列表页）
      headerRight: () => (
        <View style={styles.headerRightRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Settings')}
            style={styles.headerIconBtn}
          >
            <Text style={styles.headerIcon}>⚙️</Text>
          </TouchableOpacity>
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
    // 本地会话项
    return (
      <ConversationItem
        conversation={item}
        onPress={() => handlePress(item)}
        onLongPress={() => handleLongPress(item)}
      />
    );
  };

  // 构建混合列表
  const mixedList = [];
  if (conversations.length > 0) {
    mixedList.push({ _type: 'section', title: '📱 本地对话', count: conversations.length });
    conversations.forEach(c => mixedList.push(c));
  }
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
