// App 入口 —— 导航容器 + 深色主题 + OTA升级 + 错误兜底
import React, { useEffect, useState, useRef, Component } from 'react';
import { Alert, Linking, Text, View, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Colors } from './src/colors';
import { checkUpdate, downloadAndInstall } from './src/utils/update';

import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import TasksScreen from './src/screens/TasksScreen';
import TaskFormScreen from './src/screens/TaskFormScreen';
import WechatSyncScreen from './src/screens/WechatSyncScreen';

const Stack = createNativeStackNavigator();

// 深色导航主题
const DarkNavTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.accent,
    background: Colors.bg,
    card: Colors.card,
    text: Colors.text,
    border: Colors.border,
    notification: Colors.danger,
  },
};

// 通用 header 样式
const screenOptions = {
  headerStyle: {
    backgroundColor: Colors.card,
  },
  headerTintColor: Colors.text,
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 17,
  },
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: Colors.bg,
  },
};

// 错误边界 —— v4.1 兜底：APP不崩溃，显示错误信息 + 重启按钮
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>⚠️</Text>
          <Text style={{ color: Colors.text, fontSize: 18, fontWeight: '600', marginBottom: 8 }}>
            出现了一些问题
          </Text>
          <Text style={{ color: Colors.sub, fontSize: 14, textAlign: 'center', marginBottom: 24 }}>
            {String(this.state.error?.message || this.state.error || '未知错误')}
          </Text>
          <TouchableOpacity
            onPress={this.handleRestart}
            style={{
              backgroundColor: Colors.accent, paddingHorizontal: 32, paddingVertical: 12,
              borderRadius: 10, marginBottom: 16,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>重新加载</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('http://8.163.2.252/hermes-chat.apk')}>
            <Text style={{ color: Colors.sub, fontSize: 13 }}>下载最新APK</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [downloadPct, setDownloadPct] = useState(0);
  const [downloading, setDownloading] = useState(false);
  const updateInfoRef = useRef(null);

  // 启动时检查更新
  useEffect(() => {
    checkUpdate().then(({ hasUpdate, info }) => {
      if (hasUpdate && info) {
        updateInfoRef.current = info;
        Alert.alert(
          '🔔 发现新版本',
          `${info.release_notes}\n\n版本: ${info.version}\n大小约 80MB`,
          [
            { text: '稍后再说', style: 'cancel' },
            {
              text: '立即升级',
              onPress: () => startOTA(info),
            },
          ]
        );
      }
    });
  }, []);

  // OTA升级：下载 + 安装
  const startOTA = async (info) => {
    setDownloading(true);
    setDownloadPct(0);

    try {
      await downloadAndInstall(info.apk_url, (pct) => {
        setDownloadPct(pct);
      });
      // 安装界面已弹出，重置状态
      setDownloading(false);
      setDownloadPct(0);
    } catch (err) {
      setDownloading(false);
      setDownloadPct(0);
      Alert.alert(
        '下载失败',
        String(err).includes('permission')
          ? '请先开启「安装未知应用」权限，再重试。\n\n设置 → 应用 → Hermes → 安装未知应用'
          : `下载出错了: ${err.message || err}`,
        [
          { text: '关闭', style: 'cancel' },
          {
            text: '浏览器下载',
            onPress: () => Linking.openURL(info.apk_url),
          },
        ]
      );
    }
  };

  return (
    <ErrorBoundary>
    <>
      <StatusBar style="light" />
      {/* 下载进度遮罩 */}
      {downloading && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 999,
          justifyContent: 'center', alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: Colors.card, borderRadius: 16,
            padding: 32, alignItems: 'center', minWidth: 220,
          }}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={{
              color: Colors.text, fontSize: 16, fontWeight: '600',
              marginTop: 20, marginBottom: 8,
            }}>
              正在下载更新...
            </Text>
            <Text style={{ color: Colors.accent, fontSize: 28, fontWeight: '700' }}>
              {downloadPct}%
            </Text>
            <Text style={{ color: Colors.sub, fontSize: 13, marginTop: 8 }}>
              请勿关闭APP
            </Text>
          </View>
        </View>
      )}

      <NavigationContainer theme={DarkNavTheme}>
        <Stack.Navigator screenOptions={screenOptions}>
          {/* 首页：对话列表 */}
          <Stack.Screen
            name="ChatList"
            component={ChatListScreen}
            options={{ title: 'Hermes' }}
          />
          {/* 聊天页 */}
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }) => ({
              title: route.params?.conversationId
                ? '对话'
                : '新对话',
              headerBackTitle: '返回',
            })}
          />
          {/* 设置页（模态弹出） */}
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              title: '设置',
              presentation: 'modal',
            }}
          />
          {/* v5.4.0: 定时任务 */}
          <Stack.Screen
            name="Tasks"
            component={TasksScreen}
            options={{ title: '定时任务' }}
          />
          <Stack.Screen
            name="TaskForm"
            component={TaskFormScreen}
            options={({ route }) => ({
              title: route.params?.taskId ? '编辑任务' : '新建任务',
            })}
          />
          <Stack.Screen
            name="WechatSync"
            component={WechatSyncScreen}
            options={{ title: '微信同步' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
    </ErrorBoundary>
  );
}
