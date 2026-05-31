// 设置页面 —— Linear 暗色风格
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../colors';
import { saveConversations } from '../utils/storage';
import { checkUpdate, downloadAndInstall } from '../utils/update';
import { APP_VERSION } from '../constants/version';

const APP_NAME = 'Hermes';
const SERVER_URL = 'http://8.163.2.252/app-api';

export default function SettingsScreen({ navigation }) {
  // v5.3.1: API 调试信息开关（默认开）
  const [showDebugInfo, setShowDebugInfo] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('hermes_show_api_debug').then((v) => {
      if (v !== null) setShowDebugInfo(v === 'true');
    });
  }, []);

  const toggleDebugInfo = async (val) => {
    setShowDebugInfo(val);
    await AsyncStorage.setItem('hermes_show_api_debug', String(val));
  };
  // 检查更新
  const handleCheckUpdate = async () => {
    const result = await checkUpdate();
    if (result.hasUpdate) {
      Alert.alert(
        '发现新版本',
        `版本 ${result.info.version} 已发布，是否下载？\n\n${result.info.release_notes}`,
        [
          { text: '稍后', style: 'cancel' },
          {
            text: '下载',
            onPress: () => downloadAndInstall(result.info.apk_url),
          },
        ]
      );
    } else {
      Alert.alert('已是最新版本', `当前版本 ${APP_VERSION}`);
    }
  };

  // 清除所有会话
  const handleClearAll = () => {
    Alert.alert(
      '清除所有对话',
      '此操作不可撤销，确定要删除所有对话记录吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '清除',
          style: 'destructive',
          onPress: async () => {
            await saveConversations([]);
            Alert.alert('已清除', '所有对话记录已删除');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* 标题区 */}
      <View style={styles.hero}>
        <Text style={styles.heroIcon}>⚕️</Text>
        <Text style={styles.appName}>{APP_NAME}</Text>
        <Text style={styles.version}>版本 {APP_VERSION}</Text>
      </View>

      {/* 服务器信息 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>服务器</Text>
        <View style={styles.infoCard}>
          <Text style={styles.label}>API 地址</Text>
          <Text style={styles.value} selectable>{SERVER_URL}</Text>
        </View>
      </View>

      {/* 更新 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>更新</Text>
        <TouchableOpacity style={styles.actionBtn} onPress={handleCheckUpdate}>
          <Text style={styles.actionBtnText}>检查更新</Text>
          <Text style={styles.actionHint}>当前版本 {APP_VERSION}</Text>
        </TouchableOpacity>
      </View>

      {/* 数据管理 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据</Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleClearAll}>
          <Text style={styles.dangerBtnText}>清除所有会话</Text>
        </TouchableOpacity>
      </View>

      {/* v5.3.1: API 调试信息开关 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>调试</Text>
        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>显示 API 调试信息</Text>
          <Switch
            value={showDebugInfo}
            onValueChange={toggleDebugInfo}
            trackColor={{ false: '#333', true: Colors.accent }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* 关于 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>关于</Text>
        <View style={styles.infoCard}>
          <Text style={styles.aboutText}>
                      Hermes Mobile v5.3.3 · 4-Model Direct Routing{'\n\n'}
                      DeepSeek V4 Pro · Qwen3.7-Max · GLM-5.1 · Qwen-VL-Max · 预设解耦 · 调试 Badge · reasoning 节流{'\n\n'}
                      Built with React Native & Expo.
                    </Text>
        </View>
      </View>

      {/* 底部间距 */}
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  // 标题区
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 8,
  },
  heroIcon: {
    fontSize: 56,
    marginBottom: 12,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 6,
  },
  version: {
    fontSize: 14,
    color: Colors.sub,
  },
  // 分区
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.sub,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  label: {
    fontSize: 12,
    color: Colors.sub,
    marginBottom: 4,
  },
  value: {
    fontSize: 14,
    color: Colors.text,
    fontFamily: Platform?.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  // 关于文字
  aboutText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  // 危险按钮
  dangerBtn: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.danger,
    alignItems: 'center',
  },
  dangerBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.danger,
  },
  // 操作按钮
  actionBtn: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.accent,
  },
  actionHint: {
    fontSize: 12,
    color: Colors.sub,
  },
  // v5.3.1: Switch 行
  switchRow: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchLabel: {
    fontSize: 15,
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
});
