// v5.4.0: 左滑删除 — 手势滑动露出红色删除按钮
import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, PanResponder, StyleSheet } from 'react-native';
import { Colors } from '../colors';

const SWIPE_THRESHOLD = -80;

/**
 * SwipeableRow — 包裹子组件，左滑露出删除按钮
 * @param {function} onDelete   - 删除回调
 * @param {ReactNode} children  - 正常内容
 */
export default function SwipeableRow({ onDelete, children }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const isOpen = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 10 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderMove: (_, gs) => {
        const clamped = isOpen.current
          ? Math.min(0, Math.max(SWIPE_THRESHOLD, SWIPE_THRESHOLD + gs.dx))
          : Math.min(0, Math.max(SWIPE_THRESHOLD, gs.dx));
        translateX.setValue(clamped);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -60 || (isOpen.current && gs.dx < -20)) {
          // open
          Animated.spring(translateX, {
            toValue: SWIPE_THRESHOLD,
            useNativeDriver: true,
            tension: 100,
            friction: 12,
          }).start();
          isOpen.current = true;
        } else {
          // close
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 12,
          }).start();
          isOpen.current = false;
        }
      },
    })
  ).current;

  const handleDelete = () => {
    Animated.timing(translateX, {
      toValue: -500,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      onDelete && onDelete();
    });
  };

  return (
    <View style={styles.container}>
      {/* 背景删除按钮 */}
      <View style={styles.deleteBg}>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} activeOpacity={0.8}>
          <Text style={styles.deleteIcon}>🗑</Text>
          <Text style={styles.deleteText}>删除</Text>
        </TouchableOpacity>
      </View>

      {/* 前景内容 — 可滑动 */}
      <Animated.View
        style={[styles.foreground, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  deleteBg: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 4,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtn: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.danger,
    borderRadius: 12,
  },
  deleteIcon: {
    fontSize: 20,
  },
  deleteText: {
    fontSize: 11,
    color: '#fff',
    marginTop: 2,
    fontWeight: '600',
  },
  foreground: {
    // no extra style — children fill
  },
});
