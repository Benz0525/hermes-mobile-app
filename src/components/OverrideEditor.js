// v5.3.4: 预设参数编辑器 — 长按预设按钮弹出底部面板
import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, StyleSheet, Platform,
} from 'react-native';
import { Colors } from '../colors';

// ─── 语义标签 ───
function tempLabel(v) {
  if (v <= 0.15) return '几乎确定性';
  if (v <= 0.3)  return '高度聚焦';
  if (v <= 0.5)  return '略收敛';
  if (v <= 0.7)  return '平衡';
  if (v <= 0.9)  return '偏创意';
  if (v <= 1.1)  return '高发散';
  return '极致发散';
}
function maxLabel(v) {
  if (v <= 512)   return '极短回复';
  if (v <= 2048)  return '简短回复';
  if (v <= 4096)  return '标准回复';
  if (v <= 8192)  return '长回复';
  return '超长回复';
}
function thinkLabel(v) {
  if (!v || v === 'off')  return '关闭 — 快速直接';
  if (v === 'low')   return '低 — 简略推理';
  if (v === 'on')    return '中 — 标准推理';
  if (v === 'high')  return '高 — 深度推理';
  return v;
}

const THINK_OPTIONS = ['off', 'low', 'on', 'high'];
const THINK_LABELS = { off: '关', low: '低', on: '中', high: '高' };
const MAX_STEPS = [512, 1024, 2048, 4096, 8192, 12288, 16384];

export default function OverrideEditor({ visible, onClose, onSave, onReset, presetName, presetIcon, modelName, initialValues }) {
  const [temperature, setTemperature] = useState(0.5);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [thinking, setThinking] = useState('off');

  // 每次打开重置为传入值
  useEffect(() => {
    if (visible && initialValues) {
      setTemperature(initialValues.temperature ?? 0.5);
      setMaxTokens(initialValues.max_tokens ?? 4096);
      setThinking(initialValues.thinking || 'off');
    }
  }, [visible, initialValues]);

  const handleSave = () => {
    onSave({ temperature, max_tokens: maxTokens, thinking });
  };

  const handleReset = () => {
    onReset();
  };

  // ±步进
  const tempStep = 0.1;
  const adjustTemp = (delta) => {
    setTemperature(prev => Math.round(Math.min(1.5, Math.max(0, prev + delta)) * 10) / 10);
  };

  const cycleMax = () => {
    setMaxTokens(prev => {
      const idx = MAX_STEPS.indexOf(prev);
      return idx < MAX_STEPS.length - 1 ? MAX_STEPS[idx + 1] : MAX_STEPS[0];
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.panel}>
        {/* 标题栏 */}
        <View style={styles.header}>
          <Text style={styles.title}>{presetIcon} {presetName}</Text>
          <Text style={styles.subtitle}>{modelName}</Text>
        </View>

        {/* Temperature */}
        <View style={styles.paramBlock}>
          <View style={styles.paramHeader}>
            <Text style={styles.paramName}>Temperature</Text>
            <Text style={styles.paramSemantic}>{tempLabel(temperature)}</Text>
            <Text style={styles.paramValue}>{temperature.toFixed(1)}</Text>
          </View>
          <View style={styles.stepperRow}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => adjustTemp(-tempStep)}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: (temperature / 1.5 * 100) + '%' }]} />
            </View>
            <TouchableOpacity style={styles.stepBtn} onPress={() => adjustTemp(tempStep)}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.paramHint}>温度越低回答越保守稳定，越高越创意发散</Text>
        </View>

        {/* Max Tokens */}
        <View style={styles.paramBlock}>
          <View style={styles.paramHeader}>
            <Text style={styles.paramName}>Max Tokens</Text>
            <Text style={styles.paramSemantic}>{maxLabel(maxTokens)}</Text>
            <Text style={styles.paramValue}>{maxTokens >= 1024 ? (maxTokens/1024)+'k' : maxTokens}</Text>
          </View>
          <View style={styles.stepperRow}>
            <TouchableOpacity style={styles.stepBtn} onPress={() => {
              setMaxTokens(prev => {
                const idx = MAX_STEPS.indexOf(prev);
                return idx > 0 ? MAX_STEPS[idx - 1] : MAX_STEPS[0];
              });
            }}>
              <Text style={styles.stepBtnText}>−</Text>
            </TouchableOpacity>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: (MAX_STEPS.indexOf(maxTokens) / (MAX_STEPS.length - 1) * 100) + '%' }]} />
            </View>
            <TouchableOpacity style={styles.stepBtn} onPress={cycleMax}>
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.paramHint}>单次回复的最长长度</Text>
        </View>

        {/* Thinking */}
        <View style={styles.paramBlock}>
          <View style={styles.paramHeader}>
            <Text style={styles.paramName}>Thinking 思考深度</Text>
          </View>
          <View style={styles.thinkRow}>
            {THINK_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[styles.thinkBtn, thinking === opt && styles.thinkBtnActive]}
                onPress={() => setThinking(opt)}
              >
                <Text style={[styles.thinkBtnLabel, thinking === opt && styles.thinkBtnLabelActive]}>
                  {THINK_LABELS[opt]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.paramHint}>{thinkLabel(thinking)}{'\n'}高 = 推理更深但更慢，写代码/数学开高</Text>
        </View>

        {/* 底部按钮 */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.resetBtn} onPress={handleReset}>
            <Text style={styles.resetBtnText}>重置默认</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>取消</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>保存</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background || '#1a1a2e',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text || '#fff',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary || '#888',
  },
  paramBlock: {
    marginBottom: 16,
  },
  paramHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  paramName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text || '#fff',
    flex: 1,
  },
  paramSemantic: {
    fontSize: 12,
    color: Colors.accent || '#4fc3f7',
    marginRight: 8,
  },
  paramValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent || '#4fc3f7',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.card || '#252540',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepBtnText: {
    fontSize: 20,
    color: Colors.text || '#fff',
    fontWeight: '300',
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border || '#333',
    borderRadius: 3,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  barFill: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accent || '#4fc3f7',
  },
  paramHint: {
    fontSize: 11,
    color: Colors.textSecondary || '#666',
    lineHeight: 16,
  },
  thinkRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  thinkBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.card || '#252540',
    alignItems: 'center',
  },
  thinkBtnActive: {
    backgroundColor: Colors.accent || '#4fc3f7',
  },
  thinkBtnLabel: {
    fontSize: 13,
    color: Colors.textSecondary || '#888',
    fontWeight: '500',
  },
  thinkBtnLabelActive: {
    color: '#fff',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border || '#444',
    alignItems: 'center',
  },
  resetBtnText: {
    color: Colors.textSecondary || '#888',
    fontSize: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.card || '#252540',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: Colors.text || '#fff',
    fontSize: 14,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: Colors.accent || '#4fc3f7',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
