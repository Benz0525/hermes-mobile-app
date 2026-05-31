// v5.4.1: 抽屉菜单 — 新增 🎭 AI 角色 + 🧠 思考深度
import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, Animated, StyleSheet, StatusBar, ScrollView } from 'react-native';
import { Colors } from '../colors';
import { PERSONAS, DEFAULT_PERSONA_ID } from '../constants/personas';
import { DEPTHS, DEFAULT_DEPTH_ID } from '../constants/depths';

const DRAWER_WIDTH = 280;
const ITEMS = [
  { id: 'new_chat', icon: '💬', label: '新建对话' },
  { id: 'tasks',    icon: '⏰', label: '定时任务' },
  { id: 'settings', icon: '⚙️', label: '设置' },
  { id: 'about',    icon: 'ℹ️', label: '关于' },
  { id: 'wechat_sync', icon: '📥', label: '微信同步' },
];

export default function DrawerMenu({
  visible, onClose, onSelect,
  currentPersonaId = DEFAULT_PERSONA_ID,
  currentDepthId = DEFAULT_DEPTH_ID,
  onPersonaSelect,
  onDepthSelect,
}) {
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 11 }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -DRAWER_WIDTH, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  const handlePress = (id) => {
    onClose();
    setTimeout(() => onSelect(id), 250);
  };

  const renderSection = (title, emoji) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionIcon}>{emoji}</Text>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.container}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
        </Animated.View>

        <Animated.View style={[styles.drawer, { transform: [{ translateX: slideAnim }] }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 80 }}>
            {/* 头部 */}
            <View style={styles.header}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>H</Text>
              </View>
              <Text style={styles.appTitle}>Hermes</Text>
              <Text style={styles.appSub}>AI 智能助手</Text>
            </View>

            <View style={styles.divider} />

            {/* v5.4.1: 🎭 AI 角色 */}
            {onPersonaSelect ? (
              <>
                {renderSection('🎭 AI 角色', '🎭')}
                {PERSONAS.map(p => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.item, currentPersonaId === p.id && styles.itemActive]}
                    activeOpacity={0.6}
                    onPress={() => {
                      onClose();
                      setTimeout(() => onPersonaSelect(p.id), 250);
                    }}
                  >
                    <Text style={styles.itemIcon}>{p.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemLabel, currentPersonaId === p.id && styles.itemLabelActive]}>
                        {p.name}
                      </Text>
                      <Text style={styles.personaModelHint}>
                        {p.model} · T={p.temperature}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                <View style={styles.divider} />
              </>
            ) : null}

            {/* v5.4.1: 🧠 思考深度 */}
            {onDepthSelect ? (
              <>
                {renderSection('🧠 思考深度', '🧠')}
                {DEPTHS.map(d => (
                  <TouchableOpacity
                    key={d.id}
                    style={[styles.item, currentDepthId === d.id && styles.itemActive]}
                    activeOpacity={0.6}
                    onPress={() => {
                      onClose();
                      setTimeout(() => onDepthSelect(d.id), 250);
                    }}
                  >
                    <Text style={styles.itemIcon}>{d.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.itemLabel, currentDepthId === d.id && styles.itemLabelActive]}>
                        {d.name}
                      </Text>
                      <Text style={styles.itemDesc}>
                        {d.maxTokens} tokens {d.reasoning ? '· 推理模式' : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
                <View style={styles.divider} />
              </>
            ) : null}

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
          </ScrollView>

          {/* 底部版本 */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>v5.4.1</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  drawer: {
    position: 'absolute', left: 0, top: 0, bottom: 0, width: DRAWER_WIDTH,
    backgroundColor: '#0f0f14',
    borderRightWidth: 0.5, borderRightColor: Colors.border,
    paddingTop: StatusBar.currentHeight || 44,
  },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 16 },
  logoCircle: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1.5, borderColor: Colors.accent,
    backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  logoText: { fontSize: 20, fontWeight: '700', color: Colors.accent },
  appTitle: { fontSize: 20, fontWeight: '700', color: Colors.text },
  appSub: { fontSize: 12, color: Colors.sub, marginTop: 4 },
  divider: { height: 0.5, backgroundColor: Colors.border, marginHorizontal: 24, marginVertical: 8 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 6, marginTop: 4 },
  sectionIcon: { fontSize: 14, marginRight: 8, color: Colors.sub },
  sectionTitle: { fontSize: 12, color: Colors.sub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  item: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 24 },
  itemActive: { backgroundColor: 'rgba(167,139,250,0.12)' },
  itemLast: { marginTop: 12 },
  itemIcon: { fontSize: 18, marginRight: 14 },
  itemLabel: { fontSize: 16, color: Colors.text, fontWeight: '500' },
  itemLabelActive: { color: Colors.accent },
  personaModelHint: { fontSize: 10, color: '#888', marginTop: 2, fontFamily: 'monospace' },
  itemDesc: { fontSize: 11, color: Colors.sub, marginTop: 2 },
  footer: { position: 'absolute', bottom: 40, left: 24 },
  footerText: { fontSize: 11, color: '#555' },
});
