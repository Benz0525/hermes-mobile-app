// 图片气泡 —— 显示用户发送的图片，点击可全屏预览
import React, { useState } from 'react';
import {
  View,
  Image,
  Modal,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  StatusBar,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ImageBubble({ imageUri }) {
  const [fullscreen, setFullscreen] = useState(false);

  if (!imageUri) return null;

  return (
    <>
      {/* 缩略图气泡 */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setFullscreen(true)}
        style={styles.thumbnailWrapper}
      >
        <Image
          source={{ uri: imageUri }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      </TouchableOpacity>

      {/* 全屏预览 */}
      <Modal
        visible={fullscreen}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setFullscreen(false)}
      >
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <TouchableOpacity
          style={styles.fullscreenBg}
          activeOpacity={1}
          onPress={() => setFullscreen(false)}
        >
          <Image
            source={{ uri: imageUri }}
            style={styles.fullscreenImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbnailWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    maxWidth: SCREEN_WIDTH * 0.8,
    backgroundColor: '#1a1d23',
    borderWidth: 1,
    borderColor: '#2a2d33',
  },
  thumbnail: {
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7 * 0.75,
    aspectRatio: undefined,
  },
  fullscreenBg: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
});
