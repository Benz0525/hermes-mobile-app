# Hermes 手机App v2.0 需求文档

## 当前问题
- 只有一个聊天窗口，不能多会话
- 聊天记录App重启就丢
- 界面太简陋：只有气泡，没有时间戳、没有设置、没有会话列表
- 视觉单调，缺乏现代感

## v2.0 功能清单

### 1. 多会话支持
- 首页显示会话列表（像微信聊天列表）
- 每个会话显示最后一条消息预览 + 时间
- 点击进入聊天，返回回到列表
- 左滑删除会话
- 新建会话按钮（右上角+）

### 2. 会话历史持久化
- 用 AsyncStorage 存所有会话
- App重启后恢复之前的会话列表和消息
- 历史会话可随时点进去继续聊

### 3. 消息时间戳
- 每条消息下方显示时间（HH:mm）
- 隔天显示日期分隔线（"5月29日"）

### 4. 设置页面
- 右上角齿轮图标进入设置
- 设置项：清除所有会话、关于Hermes、版本号
- 服务器地址可配置（方便以后换域名）

### 5. 视觉升级
- 会话列表：头像占位 + 标题 + 最后消息 + 时间
- 聊天页：保持Linear暗色风格
- 消息气泡优化：圆角、阴影感
- 空状态插图：首页"还没有对话"、聊天页"开始聊天吧"
- 平滑过渡动画

### 6. 交互优化
- 长按消息复制文本
- 双击消息气泡有反馈
- 列表滚动到最新消息的浮动按钮

## 技术约束
- React Native + Expo SDK 56
- Linear 暗色主题（#08090a底色，#5e6ad2强调色）
- 后端API不变：http://8.163.2.252/app-api/chat/stream
- 存储用 @react-native-async-storage/async-storage
- 导航用 @react-navigation/native + @react-navigation/native-stack
- 保持 APK 编译通过（newArchEnabled: false）

## 文件结构
```
App.js           → 入口，导航配置
screens/
  ChatListScreen.js   → 会话列表
  ChatScreen.js       → 聊天界面
  SettingsScreen.js   → 设置页
components/
  MessageBubble.js    → 消息气泡组件
  ConversationItem.js → 会话列表项
  EmptyState.js       → 空状态组件
utils/
  storage.js          → AsyncStorage 封装
  api.js              → API 调用
  time.js             → 时间格式化
```
