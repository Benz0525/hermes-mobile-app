// 文件气泡 —— 显示文件名 + 大小的小卡片
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * @param {object} file
 * @param {string} file.name - 文件名
 * @param {number} file.size - 文件大小（字节）
 */
export default function FileBubble({ file }) {
  if (!file) return null;

  const { name = '未知文件', size = 0 } = file;

  // 格式化文件大小
  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let val = bytes;
    while (val >= 1024 && i < units.length - 1) {
      val /= 1024;
      i++;
    }
    return `${val.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
  };

  const sizeStr = formatSize(size);

  return (
    <View style={styles.card}>
      <Text style={styles.icon}>📎</Text>
      <View style={styles.info}>
        <Text style={styles.fileName} numberOfLines={2}>
          {name}
        </Text>
        {sizeStr ? (
          <Text style={styles.fileSize}>{sizeStr}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1d23',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2d33',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  icon: {
    fontSize: 28,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#e4e5e7',
    lineHeight: 20,
  },
  fileSize: {
    fontSize: 12,
    color: '#6b7280',
  },
});
