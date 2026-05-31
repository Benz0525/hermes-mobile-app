// v5.4.0: 抽屉菜单 — Modal + Animated 左侧滑入，280px，0 新增依赖
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet, StatusBar } from 'react-native';
import { Colors } from '../colors';

const DRAWER_WIDTH = 280;
const ITEMS = [
  { id: 'new_chat', icon: '💬', label: '新建对话' },
  { id: 'tasks',    icon: '⏰', label: '定时任务' },
  { id: 'settings', icon: '⚙️', label: '设置' },
  { id: 'about',    icon: 'ℹ️', label: '关于' },
];

export default function DrawerMenu({ visible, onClose, onSelect }) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 80,
          friction: 11,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handlePress = (id) => {
    onClose();
    setTimeout(() => onSelect(id), 250);
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* 半透明遮罩 */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        {/* 抽屉面板 */}
        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          {/* 头部 */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>H</Text>
            </View>
            <Text style={styles.appTitle}>Hermes</Text>
            <Text style={styles.appSub}>AI 智能助手</Text>
          </View>

          {/* 分隔线 */}
          <View style={styles.divider} />

          {/* 菜单项 */}
          {ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.item, i === ITEMS.length - 1 && styles.itemLast]}
              activeOpacity={0.6}
              onPress={() => handlePress(item.id)}
            >
              <Text style={styles.itemIcon}>{item.icon}</Text>
              <Text style={styles.itemLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}

          {/* 底部版本 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>v5.4.0</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#0f0f14',  // 比 bg 更深的极客黑
    borderRightWidth: 0.5,
    borderRightColor: Colors.border,
    paddingTop: StatusBar.currentHeight || 44,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: Colors.accent,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.accent,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  appSub: {
    fontSize: 12,
    color: Colors.sub,
    marginTop: 4,
  },
  divider: {
    height: 0.5,
    backgroundColor: Colors.border,
    marginHorizontal: 24,
    marginVertical: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  itemLast: {
    marginTop: 12,
  },
  itemIcon: {
    fontSize: 18,
    marginRight: 14,
  },
  itemLabel: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 24,
  },
  footerText: {
    fontSize: 11,
    color: '#555',
  },
});
