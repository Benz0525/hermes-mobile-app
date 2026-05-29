// 附件菜单 —— 底部弹出选择面板
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  StyleSheet,
  Dimensions,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const ITEMS = [
  { key: 'gallery', icon: '📷', label: '相册' },
  { key: 'camera', icon: '📸', label: '拍照' },
  { key: 'file',   icon: '📎', label: '文件' },
  { key: 'audio',  icon: '🎤', label: '语音' },
];

/**
 * @param {boolean} visible        - 是否显示
 * @param {() => void} onClose     - 关闭回调
 * @param {(key: string) => void} onSelect - 选中回调，key ∈ {gallery,camera,file,audio}
 */
export default function AttachMenu({ visible, onClose, onSelect }) {
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const handleSelect = (key) => {
    onSelect(key);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <Animated.View
        style={[styles.panel, { transform: [{ translateY: slideAnim }] }]}
      >
        {/* 把手 */}
        <View style={styles.handleBar} />

        <View style={styles.grid}>
          {ITEMS.map((item) => (
            <TouchableOpacity
              key={item.key}
              style={styles.gridItem}
              activeOpacity={0.7}
              onPress={() => handleSelect(item.key)}
            >
              <Text style={styles.gridIcon}>{item.icon}</Text>
              <Text style={styles.gridLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelText}>取消</Text>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  panel: {
    backgroundColor: '#0d1117',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#2a2d33',
    alignSelf: 'center',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 8,
  },
  gridItem: {
    width: '45%',
    aspectRatio: 2.2,
    backgroundColor: '#1a1d23',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#2a2d33',
  },
  gridIcon: {
    fontSize: 28,
  },
  gridLabel: {
    fontSize: 14,
    color: '#e4e5e7',
    fontWeight: '500',
  },
  cancelBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#1a1d23',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2d33',
  },
  cancelText: {
    fontSize: 16,
    color: '#e4e5e7',
    fontWeight: '600',
  },
});
