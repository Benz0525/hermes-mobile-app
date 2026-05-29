// AsyncStorage 封装 —— 对话持久化
import AsyncStorage from '@react-native-async-storage/async-storage';

const CONVERSATIONS_KEY = 'hermes_conversations';

/** 保存对话列表到本地存储 */
export async function saveConversations(convs) {
  try {
    const json = JSON.stringify(convs);
    await AsyncStorage.setItem(CONVERSATIONS_KEY, json);
  } catch (e) {
    console.warn('保存对话失败:', e);
  }
}

/** 从本地存储加载对话列表 */
export async function loadConversations() {
  try {
    const json = await AsyncStorage.getItem(CONVERSATIONS_KEY);
    return json ? JSON.parse(json) : [];
  } catch (e) {
    console.warn('加载对话失败:', e);
    return [];
  }
}
