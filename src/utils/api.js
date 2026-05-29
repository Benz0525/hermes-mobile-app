// API 调用 —— SSE 流式对话
const API_STREAM = 'http://8.163.2.252/app-api/chat/stream';
const TIMEOUT = 120000;   // 120 秒超时

/**
 * 发送消息并接收 SSE 流式响应
 * @param {string} text - 用户消息文本
 * @param {string} sessionId - 会话 ID（空字符串表示新会话）
 * @param {(chunk: {text?: string, sid?: string, done?: boolean}) => void} onChunk - 收到一个 chunk
 * @param {() => void} onDone - 流结束
 * @param {(error: string) => void} onError - 出错
 * @returns {() => void} abort 函数，调用可取消请求
 */
export function sendMessageStream(text, sessionId, onChunk, onDone, onError) {
  const xhr = new XMLHttpRequest();
  let buffer = '';
  let lastIndex = 0;

  xhr.open('POST', API_STREAM);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.timeout = TIMEOUT;

  xhr.onprogress = () => {
    const newText = xhr.responseText.substring(lastIndex);
    lastIndex = xhr.responseText.length;
    buffer += newText;

    // 按双换行切分 SSE 事件
    const events = buffer.split('\n\n');
    buffer = events.pop() || '';

    for (const event of events) {
      for (const line of event.split('\n')) {
        const s = line.trim();
        if (s.startsWith('data: ')) {
          const raw = s.substring(6);
          if (raw === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(raw);
            onChunk(parsed);
          } catch {
            // 忽略解析失败的行
          }
        }
      }
    }
  };

  xhr.onerror = () => {
    onError('网络错误');
  };

  xhr.ontimeout = () => {
    onError('请求超时');
  };

  xhr.onloadend = () => {
    // 流正常结束时会由 [DONE] 触发 onDone，这里做兜底
    onDone();
  };

  xhr.send(JSON.stringify({
    message: text,
    session_id: sessionId,
  }));

  return () => xhr.abort();
}

// ─── 多媒体上传 ────────────────────────────────────────────

/**
 * 上传图片到后端
 * @param {string} uri - 图片本地 URI
 * @returns {Promise<object>} 响应 JSON（含 url / extracted_text 等）
 */
export async function uploadImage(uri) {
  const formData = new FormData();
  formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' });
  const res = await fetch('http://8.163.2.252/app-api/upload/image', {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

/**
 * 上传文件到后端
 * @param {string} uri       - 文件本地 URI
 * @param {string} fileName  - 原始文件名
 * @param {string} mimeType  - MIME 类型（可选）
 * @returns {Promise<object>} 响应 JSON
 */
export async function uploadFile(uri, fileName, mimeType) {
  const formData = new FormData();
  formData.append('file', {
    uri,
    type: mimeType || 'application/octet-stream',
    name: fileName,
  });
  const res = await fetch('http://8.163.2.252/app-api/upload/file', {
    method: 'POST',
    body: formData,
  });
  return res.json();
}
