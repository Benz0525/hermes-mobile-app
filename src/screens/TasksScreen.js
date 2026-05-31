// v5.4.0: 定时任务列表 + 最近运行记录
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '../colors';

const API = 'http://8.163.2.252/app-api';

export default function TasksScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTasks = useCallback(async () => {
    try {
      const res = await fetch(`${API}/tasks`);
      const data = await res.json();
      setTasks(Array.isArray(data) ? data : []);
    } catch (e) {
      // ignore
    }
  }, []);

  useFocusEffect(useCallback(() => {
    setRefreshing(true);
    loadTasks().finally(() => setRefreshing(false));
  }, [loadTasks]));

  const toggleTask = async (task) => {
    try {
      await fetch(`${API}/tasks/${task.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: task.enabled ? 0 : 1 }),
      });
      loadTasks();
    } catch (e) {
      Alert.alert('出错', e.message);
    }
  };

  const deleteTask = (task) => {
    Alert.alert('删除任务', `确定删除「${task.name}」？`, [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        await fetch(`${API}/tasks/${task.id}`, { method: 'DELETE' });
        loadTasks();
      }},
    ]);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('TaskForm', { taskId: item.id })}
      onLongPress={() => deleteTask(item)}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.taskName}>{item.name}</Text>
        <View style={[styles.statusDot, { backgroundColor: item.enabled ? '#10B981' : '#666' }]} />
      </View>
      <Text style={styles.taskMeta} numberOfLines={2}>{item.prompt}</Text>
      <View style={styles.cardFooter}>
        <Text style={styles.footerText}>{item.cron}</Text>
        <Text style={styles.footerText}>{item.model}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadTasks} tintColor={Colors.accent} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>⏰</Text>
            <Text style={styles.emptyText}>暂无定时任务</Text>
            <Text style={styles.emptySub}>点击右上角创建</Text>
          </View>
        }
      />
      {/* 新建按钮 */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('TaskForm', {})}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  list: { padding: 12, paddingBottom: 80 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  taskMeta: {
    fontSize: 13,
    color: Colors.sub,
    marginBottom: 10,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 11,
    color: '#666',
    fontFamily: 'monospace',
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 17, color: Colors.text, fontWeight: '600' },
  emptySub: { fontSize: 13, color: Colors.sub, marginTop: 4 },
  fab: {
    position: 'absolute', right: 20, bottom: 30,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 6,
  },
  fabText: {
    color: '#fff', fontSize: 28, fontWeight: '300', lineHeight: 30,
  },
});
