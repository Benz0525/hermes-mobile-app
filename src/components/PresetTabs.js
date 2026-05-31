// v5.3.3: 预设标签栏 — 每个按钮下方显示当前 model 下该档的 API 参数（调试用）
import React from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
} from 'react-native';
import { Colors } from '../colors';

// 把 max_tokens 数字转成紧凑 k 单位字符串
function fmtMax(n) {
  if (!n && n !== 0) return '-';
  if (n >= 1024 && n % 1024 === 0) return (n / 1024) + 'k';
  if (n >= 1000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k';
  return String(n);
}

// 把 thinking 字段转成短标签
function fmtThink(t) {
  if (!t) return '';
  if (t === 'on')   return 'th:on';
  if (t === 'off')  return '';            // off 不显示，省空间
  if (t === 'high') return 'th:hi';
  if (t === 'low')  return 'th:lo';
  return 'th:' + t;
}

export default function PresetTabs({
  activePresetId,
  currentModel,
  presets,
  models,
  overrides,
  onPresetSelect,
  onPresetLongPress,
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

  // 当前 model 下的参数表 {presetId: {temperature, max_tokens, thinking}}
  const modelOv = (overrides && overrides[currentModel]) || {};

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {list.map(p => {
          const params = modelOv[p.id] || {};
          const hasParams = params.temperature !== undefined || params.max_tokens !== undefined;
          const thinkLabel = fmtThink(params.thinking);
          const paramText = hasParams
            ? 'T=' + (params.temperature !== undefined ? params.temperature : '-') + ' · ' + fmtMax(params.max_tokens) + (thinkLabel ? ' · ' + thinkLabel : '')
            : '';
          const isActive = activePresetId === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.tab,
                isActive && styles.tabActive,
              ]}
              onPress={() => handleSelect(p)}
              onLongPress={() => onPresetLongPress && onPresetLongPress(p)}
              delayLongPress={400}
              activeOpacity={0.7}
              disabled={disabled}
            >
              <View style={styles.tabRow}>
                <Text style={styles.icon}>{p.icon}</Text>
                <Text style={[
                  styles.label,
                  isActive && styles.labelActive,
                ]}>{p.label}</Text>
              </View>
              {paramText ? (
                <Text style={[
                  styles.paramText,
                  isActive && styles.paramTextActive,
                ]} numberOfLines={1}>{paramText}</Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
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
    backgroundColor: Colors.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: Colors.activeBg,
    borderColor: Colors.activeBorder,
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  paramText: {
    color: Colors.sub,
    fontSize: 10,
    marginTop: 2,
    opacity: 0.7,
  },
  paramTextActive: {
    color: Colors.activeText,
    opacity: 0.9,
  },
});
