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
        if (d.models && d.models.length > 0) setList(d.models);
      })
      .catch(() => {});
  }, []);

  const current = list.find(m => m.id === currentModel) || { id: currentModel, name: currentModel };

  return (
    <View>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
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
              data={list}
              keyExtractor={item => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.item, item.id === currentModel && styles.itemActive]}
                  onPress={() => { onSelect(item.id); setVisible(false); }}
                >
                  <Text style={[styles.itemText, item.id === currentModel && styles.itemTextActive]}>
                    {item.name}
                  </Text>
                  {item.id === currentModel && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              )}
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
    backgroundColor: '#1a1d2e',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#2a2d3e',
  },
  triggerText: {
    color: Colors.text,
    fontSize: 13,
    maxWidth: 120,
  },
  arrow: {
    color: Colors.subtext,
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
    backgroundColor: '#12141c',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2d3e',
    padding: 16,
  },
  title: {
    color: Colors.subtext,
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
    backgroundColor: '#1a1d2e',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  itemText: {
    color: Colors.text,
    fontSize: 15,
  },
  itemTextActive: {
    color: Colors.accent,
    fontWeight: '600',
  },
  check: {
    color: Colors.accent,
    fontSize: 16,
  },
});
