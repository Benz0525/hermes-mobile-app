// v5.3.0: 预设标签栏 — 独立于模型，VL 时隐藏，纯展示 no editing
import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { Colors } from '../colors';

export default function PresetTabs({
  activePresetId,
  currentModel,
  presets,
  models,
  onPresetSelect,
  disabled,
}) {
  // VL 模型不支持预设 → 整个组件不渲染
  const modelInfo = (models || []).find(m => m.id === currentModel);
  if (modelInfo && modelInfo.supports_presets === false) {
    return null;
  }

  // 没有预设数据时不显示
  const list = presets || [];
  if (list.length === 0) return null;

  const handleSelect = (preset) => {
    if (disabled) return;
    onPresetSelect(preset.id);
  };

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {list.map(p => (
          <TouchableOpacity
            key={p.id}
            style={[
              styles.tab,
              activePresetId === p.id && styles.tabActive,
            ]}
            onPress={() => handleSelect(p)}
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
});
