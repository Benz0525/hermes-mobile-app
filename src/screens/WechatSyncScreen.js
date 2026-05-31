// v5.4.1: 微信同步 — 查看 Hermes 在微信上的推送消息
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, RefreshControl, StyleSheet, TouchableOpacity,
} from 'react-native';
import { Colors } from '../colors';

const API_BASE = 'http://8.163.2.252/app-api';

export default function WechatSyncScreen({ navigation }) {
  const [messages, setMessages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/wechat-sync/messages?limit=100`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setMessages(data);
      }
    } catch (e) {
      console.warn('WechatSync fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  const formatTime = (isoStr) => {
    try {
      const d = new Date(isoStr);
      const now = new Date();
      const diffMs = now - d;
      if (diffMs < 60000) return '刚刚';
      if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)} 分钟前`;
      if (diffMs < 86400000) {
        const h = d.getHours().toString().padStart(2, '0');
        const m = d.getMinutes().toString().padStart(2, '0');
        return `今天 ${h}:${m}`;
      }
      const M = (d.getMonth() + 1).toString().padStart(2, '0');
      const D = d.getDate().toString().padStart(2, '0');
      const h = d.getHours().toString().padStart(2, '0');
      const min = d.getMinutes().toString().padStart(2, '0');
      return `${M}-${D} ${h}:${min}`;
    } catch {
      return isoStr;
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.time}>{formatTime(item.created_at)}</Text>
        <View style={styles.modelBadge}>
          <Text style={styles.modelBadgeText}>{item.model || 'hermes'}</Text>
        </View>
        <Text style={styles.source}>{item.source === 'wechat' ? '微信' : item.source}</Text>
      </View>
      <Text style={styles.content} numberOfLines={8}>
        {item.content}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>加载中...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {messages.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyIcon}>📥</Text>
          <Text style={styles.emptyText}>暂无微信同步消息</Text>
          <Text style={styles.emptyHint}>Hermes 通过微信推送的消息会出现在这里</Text>
        </View>
      ) : (
        <FlatList
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  list: {
    padding: 12,
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  time: {
    color: Colors.sub,
    fontSize: 12,
  },
  modelBadge: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  modelBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  source: {
    color: Colors.sub,
    fontSize: 12,
  },
  content: {
    color: Colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHint: {
    color: Colors.sub,
    fontSize: 13,
    textAlign: 'center',
  },
});
