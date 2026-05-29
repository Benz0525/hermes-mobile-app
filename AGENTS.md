# Hermes Mobile Chat — Project Brain

## 项目概述
AI 聊天 Android APP，连接 Hermes 后端 API，对标微信/飞书体验。
- **用户**：阿Ben，TCL 测试工程师，非技术人员
- **目标**：手机端跟 Hermes AI 对话，支持文字+图片+文件+语音

## 技术栈
- **前端**：React Native (Expo SDK 56.0.6), React 19.2.3, React Navigation 7
- **后端**：FastAPI (Python) → 代理到 Hermes API (127.0.0.1:8642)
- **AI模型**：deepseek-v4-pro (文字), qwen-vl-max (识图)
- **编译**：GitHub Actions (EAS Build)
- **开发环境**：code-server (https://code.cdxpm.xyz:8080/)

## 项目结构
```
hermes-mobile-app/          ← React Native 前端
├── App.js                  ← 入口，导航配置
├── app.json                ← Expo 配置
├── src/
│   ├── screens/
│   │   ├── ChatListScreen.js   ← 会话列表
│   │   ├── ChatScreen.js       ← 聊天页面（输入框+消息列表）
│   │   └── SettingsScreen.js   ← 设置页
│   ├── components/
│   │   ├── MessageBubble.js    ← 消息气泡
│   │   ├── ConversationItem.js ← 会话列表项
│   │   └── EmptyState.js       ← 空状态
│   ├── utils/
│   │   ├── api.js              ← API 调用（SSE流式）
│   │   ├── storage.js          ← AsyncStorage 持久化
│   │   └── time.js             ← 时间格式化
│   └── colors.js               ← Linear 暗色主题配色

hermes-mobile-api/          ← Python 后端
└── server.py               ← FastAPI 服务 (端口5000)

/var/www/html/              ← APK 下载目录
└── hermes-chat.apk         ← 最新编译产物
```

## 关键约束
1. **Android only**（用户不用 iPhone）
2. **暗色主题**：底色 #08090a，主色 #5e6ad2（Linear 风格）
3. **明文 HTTP**：内网使用，需 `usesCleartextTraffic=true`
4. **新架构关闭**：`newArchEnabled: false`（SDK56 兼容性）
5. **API 地址**：http://8.163.2.252/app-api/（nginx 反代到 5000）
6. **Token 永不过期**：GitHub classic token 选 No expiration

## API 接口

| 端点 | 方法 | 用途 |
|------|------|------|
| /app-api/chat/stream | POST | SSE 流式对话 |
| /app-api/health | GET | 健康检查 |
| /app-api/upload | POST | ⚠️ 待开发：图片/文件上传 |

### /chat/stream 请求格式
```json
{"message": "用户消息", "session_id": "uuid-可选"}
```

### /chat/stream 响应格式（SSE）
```
data: {"text": "hi", "sid": "xxx", "done": false}
data: {"text": "", "sid": "xxx", "done": true}
```

## 开发规则
- 所有代码改动后必须推 GitHub → Actions 编译 APK
- 编译命令：`git push origin master`
- APK 产物在 Actions Artifacts，34-80MB
- 前端改 API 地址统一改 `src/utils/api.js`
- 后端改完 `systemctl restart hermes-mobile-api`
- 不要删除 `android/` 目录（原生配置在里面）

## 已知坑
1. Expo SDK 56 新架构会导致闪退 → `newArchEnabled: false`
2. `expo-build-properties` 插件配置 `usesCleartextTraffic` 在 `plugins` 数组里
3. Nginx 反代 SSE 必须关缓冲：`proxy_buffering off;`
4. GitHub Token 每次"重新生成"旧的就废
5. 国内网络 npm install 慢 → 用阿里云镜像
