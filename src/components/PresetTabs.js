// 预设模式标签栏（M1）— 4 tab + 长按编辑
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, Modal,
  TextInput, StyleSheet, Alert,
} from 'react-native';
import { Colors } from '../colors';
import { loadPresets, savePresets, getPresetConfig, DEFAULT_PRESETS } from '../utils/presets';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PresetTabs({ activePresetId, onPresetSelect, disabled }) {
  const [presets, setPresets] = useState([]);
  const [editing, setEditing] = useState(null); // 正在编辑的 preset

  useEffect(() => {
    loadPresets().then(setPresets);
  }, []);

  const handleSelect = (preset) => {
    if (disabled) return;
    const config = getPresetConfig(preset);
    onPresetSelect(config);
  };

  const handleLongPress = (preset) => {
    setEditing({ ...preset });
  };

  const handleSave = async () => {
    if (!editing) return;
    const updated = presets.map(p => p.id === editing.id ? editing : p);
    await savePresets(updated);
    setPresets(updated);
    setEditing(null);
  };

  const handleReset = async () => {
    await savePresets([...DEFAULT_PRESETS]);
    setPresets([...DEFAULT_PRESETS]);
    setEditing(null);
  };

  if (presets.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {presets.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.tab,
              activePresetId === p.id && styles.tabActive,
            ]}
            onPress={() => handleSelect(p)}
            onLongPress={() => handleLongPress(p)}
            activeOpacity={0.7}
            disabled={disabled}
          >
            <Text style={styles.icon}>{p.icon}</Text>
            <Text style={[
              styles.label,
              activePresetId === p.id && styles.labelActive,
            ]}>{p.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 长按编辑弹窗 */}
      <Modal visible={!!editing} transparent animationType="fade">
        <SafeAreaView style={styles.editBackdrop}>
          <View style={styles.editCard}>
            <Text style={styles.editTitle}>编辑预设：{editing?.label}</Text>

            <Text style={styles.fieldLabel}>模型</Text>
            <TextInput
              style={styles.input}
              value={editing?.model}
              onChangeText={t => setEditing(e => ({ ...e, model: t }))}
              placeholderTextColor="#555"
            />

            <Text style={styles.fieldLabel}>温度 (0-2)</Text>
            <TextInput
              style={styles.input}
              value={String(editing?.temperature ?? '')}
              onChangeText={t => setEditing(e => ({ ...e, temperature: parseFloat(t) || 0 }))}
              keyboardType="decimal-pad"
              placeholderTextColor="#555"
            />

            <Text style={styles.fieldLabel}>最大 Tokens</Text>
            <TextInput
              style={styles.input}
              value={String(editing?.max_tokens ?? '')}
              onChangeText={t => setEditing(e => ({ ...e, max_tokens: parseInt(t) || 1024 }))}
              keyboardType="number-pad"
              placeholderTextColor="#555"
            />

            <Text style={styles.fieldLabel}>思考模式</Text>
            <View style={styles.thinkRow}>
              {['', 'on', 'high'].map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.thinkBtn, editing?.thinking === opt && styles.thinkBtnActive]}
                  onPress={() => setEditing(e => ({ ...e, thinking: opt }))}
                >
                  <Text style={[styles.thinkText, editing?.thinking === opt && styles.thinkTextActive]}>
                    {opt === '' ? '关' : opt === 'on' ? '开' : '深度'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(null)}>
                <Text style={styles.cancelText}>取消</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
                <Text style={styles.resetText}>恢复默认</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  scroll: {
    paddingHorizontal: 12,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.activeBg,
    borderColor: Colors.activeBorder,
  },
  icon: {
    fontSize: 13,
    marginRight: 4,
  },
  label: {
    color: Colors.sub,
    fontSize: 13,
  },
  labelActive: {
    color: Colors.activeText,
    fontWeight: '600',
  },
  // 编辑弹窗
  editBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editCard: {
    width: 320,
    backgroundColor: '#12141c',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2a2d3e',
    padding: 20,
  },
  editTitle: {
    color: Colors.text,
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  fieldLabel: {
    color: Colors.subtext,
    fontSize: 12,
    marginBottom: 4,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#0d0f14',
    color: Colors.text,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#2a2d3e',
  },
  thinkRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  thinkBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#0d0f14',
    borderWidth: 1,
    borderColor: '#2a2d3e',
    alignItems: 'center',
  },
  thinkBtnActive: {
    borderColor: Colors.accent,
    backgroundColor: '#1a1d2e',
  },
  thinkText: {
    color: Colors.subtext,
    fontSize: 14,
  },
  thinkTextActive: {
    color: Colors.accent,
    fontWeight: '600',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1a1d2e',
    alignItems: 'center',
  },
  cancelText: {
    color: Colors.subtext,
    fontSize: 14,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3a1515',
    alignItems: 'center',
  },
  resetText: {
    color: '#ef4444',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.accent,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
