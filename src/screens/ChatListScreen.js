// 对话列表页面 —— Linear 暗色风格
import React, { useState, useCallback } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  Text,
  Alert,
  StyleSheet,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../colors';
import { loadConversations, saveConversations } from '../utils/storage';
import ConversationItem from '../components/ConversationItem';
import EmptyState from '../components/EmptyState';

export default function ChatListScreen({ navigation }) {
  const [conversations, setConversations] = useState([]);

  // 每次页面获得焦点时重新加载对话列表
  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        const convs = await loadConversations();
        if (active) {
          // 按更新时间倒序排列
          convs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          setConversations(convs);
        }
      })();
      return () => { active = false; };
    }, [])
  );

  // 新建对话：生成新 ID，跳转 ChatScreen
  const handleNewChat = () => {
    const newId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    navigation.navigate('Chat', { conversationId: newId });
  };

  // 点击会话进入聊天
  const handlePress = (conv) => {
    navigation.navigate('Chat', { conversationId: conv.id });
  };

  // 长按删除会话
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

  // 设置页面头部右侧 + 按钮
  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={handleNewChat} style={styles.addBtn}>
          <Text style={styles.addBtnText}>＋</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  // 空状态
  if (conversations.length === 0) {
    return <EmptyState icon="💬" title="还没有对话" subtitle="点击右上角开始" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            onPress={() => handlePress(item)}
            onLongPress={() => handleLongPress(item)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
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
    paddingBottom: 24,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  addBtnText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 24,
  },
});
