// 空状态组件 —— 列表为空时居中显示图标和提示
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../colors';

/**
 * EmptyState
 * @param {string} icon    - emoji 图标，如 '💬'
 * @param {string} title   - 主提示文字
 * @param {string} subtitle - 副提示文字（可选）
 */
export default function EmptyState({ icon = '💬', title, subtitle }) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: Colors.bg,
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.sub,
    textAlign: 'center',
    lineHeight: 20,
  },
});
