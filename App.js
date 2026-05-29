// App 入口 —— 导航容器 + 深色主题
import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Colors } from './src/colors';

import ChatListScreen from './src/screens/ChatListScreen';
import ChatScreen from './src/screens/ChatScreen';
import SettingsScreen from './src/screens/SettingsScreen';

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

export default function App() {
  return (
    <>
      <StatusBar style="light" />
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
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}
