// v5.4.0: 定时任务创建/编辑表单
import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch, StyleSheet,
} from 'react-native';
import { Colors } from '../colors';

const API = 'http://8.163.2.252/app-api';
const MODELS = [
  { id: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { id: 'qwen3.7-max', label: '通义千问 3.7 Max' },
  { id: 'glm-5.1', label: 'GLM-5.1' },
];

export default function TaskFormScreen({ route, navigation }) {
  const { taskId } = route.params || {};
  const isEdit = !!taskId;

  const [name, setName] = useState('');
  const [prompt, setPrompt] = useState('');
  const [cron, setCron] = useState('0 9 * * *');
  const [model, setModel] = useState('deepseek-v4-pro');
  const [enabled, setEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      fetch(`${API}/tasks`).then(r => r.json()).then(tasks => {
        const t = tasks.find(t => t.id === taskId);
        if (t) {
          setName(t.name || '');
          setPrompt(t.prompt || '');
          setCron(t.cron || '0 9 * * *');
          setModel(t.model || 'deepseek-v4-pro');
          setEnabled(!!t.enabled);
        }
      });
    }
  }, [taskId]);

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('请填写任务名称'); return; }
    if (!prompt.trim()) { Alert.alert('请填写提示词'); return; }
    setSaving(true);
    try {
      const body = { name: name.trim(), prompt: prompt.trim(), cron, model, enabled: enabled ? 1 : 0 };
      const url = isEdit ? `${API}/tasks/${taskId}` : `${API}/tasks`;
      const method = isEdit ? 'PUT' : 'POST';
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      navigation.goBack();
    } catch (e) {
      Alert.alert('保存失败', e.message);
    }
    setSaving(false);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* 名称 */}
      <Text style={styles.label}>任务名称</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="例如：每日早报" placeholderTextColor="#555" />

      {/* 提示词 */}
      <Text style={styles.label}>提示词</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={prompt}
        onChangeText={setPrompt}
        placeholder="输入给AI的提示词..."
        placeholderTextColor="#555"
        multiline
        textAlignVertical="top"
      />

      {/* Cron */}
      <Text style={styles.label}>Cron 表达式</Text>
      <TextInput style={styles.input} value={cron} onChangeText={setCron} placeholder="0 8 * * *" placeholderTextColor="#555" autoCapitalize="none" />
      <Text style={styles.hint}>分 时 日 月 周  {"\n"}例：0 8 * * * = 每天8:00 ｜ 0 21 * * 0 = 每周日21:00</Text>

      {/* 模型 */}
      <Text style={styles.label}>模型</Text>
      <View style={styles.modelRow}>
        {MODELS.map(m => (
          <TouchableOpacity
            key={m.id}
            style={[styles.modelBtn, model === m.id && styles.modelBtnActive]}
            onPress={() => setModel(m.id)}
          >
            <Text style={[styles.modelText, model === m.id && styles.modelTextActive]}>{m.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 启用 */}
      <View style={styles.switchRow}>
        <Text style={styles.label}>启用</Text>
        <Switch value={enabled} onValueChange={setEnabled} trackColor={{ false: '#444', true: Colors.accent }} />
      </View>

      {/* 保存 */}
      <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
        <Text style={styles.saveText}>{saving ? '保存中...' : isEdit ? '更新任务' : '创建任务'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.text, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: Colors.card, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: Colors.text, borderWidth: 1, borderColor: Colors.border,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top' },
  hint: { fontSize: 11, color: '#666', marginTop: 4, lineHeight: 16 },
  modelRow: { flexDirection: 'row', gap: 8 },
  modelBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center',
  },
  modelBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '22' },
  modelText: { fontSize: 13, color: Colors.sub },
  modelTextActive: { color: Colors.accent, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 20,
  },
  saveBtn: {
    backgroundColor: Colors.accent, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 30,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
