// v5.4.0: 长按菜单 ActionSheet — 底部弹出，Linear 暗色风格
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { Colors } from '../colors';

/**
 * ActionSheet
 * @param {boolean} visible
 * @param {function} onClose
 * @param {{id:string, title:string, icon?:string, danger?:boolean}[]} items
 * @param {function} onSelect  - (itemId) => void
 * @param {string} title       - 可选顶部标题
 */
export default function ActionSheet({ visible, onClose, items, onSelect, title }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.sheet}>
          {title ? (
            <View style={styles.header}>
              <Text style={styles.headerText}>{title}</Text>
            </View>
          ) : null}
          {items.map((item, i) => (
            <TouchableOpacity
              key={item.id || i}
              style={[styles.row, i > 0 && styles.rowBorder]}
              activeOpacity={0.6}
              onPress={() => { onClose(); onSelect(item.id); }}
            >
              {item.icon ? <Text style={styles.rowIcon}>{item.icon}</Text> : null}
              <Text style={[styles.rowText, item.danger && styles.dangerText]}>
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.row, styles.cancelRow]} activeOpacity={0.6} onPress={onClose}>
            <Text style={styles.cancelText}>取消</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
    marginHorizontal: 8,
    marginBottom: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerText: {
    fontSize: 13,
    color: Colors.sub,
    textAlign: 'center',
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  rowBorder: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  rowIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  rowText: {
    fontSize: 17,
    color: Colors.text,
    fontWeight: '500',
  },
  dangerText: {
    color: Colors.danger,
  },
  cancelRow: {
    marginTop: 8,
    borderTopWidth: 6,
    borderTopColor: Colors.bg,
    paddingTop: 18,
  },
  cancelText: {
    fontSize: 17,
    color: Colors.accent,
    fontWeight: '600',
  },
});
