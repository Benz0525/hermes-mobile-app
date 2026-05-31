// 模型选择下拉（M1）
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, StyleSheet,
} from 'react-native';
import { Colors } from '../colors';

export default function ModelSelector({ currentModel, models, onSelect }) {
  const [visible, setVisible] = useState(false);
  const [list, setList] = useState(models || []);

  useEffect(() => {
    if (models && models.length > 0) {
      setList(models);
    }
  }, [models]);

  // 尝试从后端拉取模型列表
  useEffect(() => {
    fetch('http://8.163.2.252/app-api/models')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d) && d.length > 0) setList(d);
      })
      .catch(() => {});
  }, []);

  const current = list.find(m => m.id === currentModel) || { id: currentModel, name: currentModel, icon: '🤖' };

  // 排序：chat 模型在前，vision 在末尾加分隔
  const chatModels = list.filter(m => m.category !== 'vision');
  const visionModels = list.filter(m => m.category === 'vision');

  const renderItem = ({ item, isFirstVision }) => (
    <>
      {isFirstVision && (
        <View style={styles.separator}>
          <View style={styles.sepLine} />
          <Text style={styles.sepText}>视觉</Text>
          <View style={styles.sepLine} />
        </View>
      )}
      <TouchableOpacity
        style={[styles.item, item.id === currentModel && styles.itemActive]}
        onPress={() => { onSelect(item.id); setVisible(false); }}
      >
        <Text style={styles.itemIcon}>{item.icon || '🤖'}</Text>
        <Text style={[styles.itemText, item.id === currentModel && styles.itemTextActive]}>
          {item.name}
        </Text>
        {item.id === currentModel && <Text style={styles.check}>✓</Text>}
      </TouchableOpacity>
    </>
  );

  return (
    <View>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.triggerIcon}>{current.icon || '🤖'}</Text>
        <Text style={styles.triggerText} numberOfLines={1}>
          {current.name || current.id}
        </Text>
        <Text style={styles.arrow}>▼</Text>
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdown}>
            <Text style={styles.title}>选择模型</Text>
            <FlatList
              data={[...chatModels, ...visionModels]}
              keyExtractor={item => item.id}
              renderItem={({ item, index }) => renderItem({
                item,
                isFirstVision: item.category === 'vision' && (index === chatModels.length)
              })}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  triggerIcon: {
    fontSize: 14,
    marginRight: 4,
  },
  triggerText: {
    color: Colors.text,
    fontSize: 13,
    maxWidth: 120,
  },
  arrow: {
    color: Colors.sub,
    fontSize: 10,
    marginLeft: 6,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    width: 280,
    maxHeight: 400,
    backgroundColor: Colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  title: {
    color: Colors.sub,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  itemActive: {
    backgroundColor: Colors.activeBg,
    borderWidth: 1,
    borderColor: Colors.activeBorder,
  },
  itemIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  itemText: {
    color: Colors.text,
    fontSize: 15,
  },
  itemTextActive: {
    color: Colors.activeText,
    fontWeight: '600',
  },
  check: {
    color: Colors.activeText,
    fontSize: 16,
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    paddingHorizontal: 4,
  },
  sepLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  sepText: {
    color: Colors.sub,
    fontSize: 11,
    marginHorizontal: 10,
    textTransform: 'uppercase',
  },
});
