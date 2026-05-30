// API 调用 —— SSE 流式对话 + 心跳 + 指数退避重试
const API_STREAM = 'http://8.163.2.252/app-api/chat/stream';
const TIMEOUT = 120000;   // 120 秒超时
const HEARTBEAT_MS = 25000;  // SSE 心跳间隔 25s
const MAX_RETRIES = 3;       // 最大重试次数

/**
 * 发送消息并接收 SSE 流式响应（带心跳 + 指数退避重试）
 * @param {string} text - 用户消息文本
 * @param {string} sessionId - 会话 ID（空字符串表示新会话）
 * @param {object} config - { model, temperature, max_tokens, thinking }
 * @param {(chunk: {text?: string, sid?: string, done?: boolean}) => void} onChunk - 收到一个 chunk
 * @param {() => void} onDone - 流结束
 * @param {(error: string) => void} onError - 出错
 * @returns {() => void} abort 函数，调用可取消请求
 */
export function sendMessageStream(text, sessionId, config, onChunk, onDone, onError) {
  let retryCount = 0;
  let aborted = false;

  const doRequest = () => {
    const xhr = new XMLHttpRequest();
    let buffer = '';
    let lastIndex = 0;
    let heartbeatTimer = null;

    xhr.open('POST', API_STREAM);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.timeout = TIMEOUT;

    // SSE 心跳：每 25s 检查连接，超时则重连
    const startHeartbeat = () => {
      heartbeatTimer = setInterval(() => {
        if (xhr.readyState >= 4) {
          clearInterval(heartbeatTimer);
          return;
        }
        // 连接正常——静默
      }, HEARTBEAT_MS);
    };

    xhr.onreadystatechange = () => {
      if (xhr.readyState === XMLHttpRequest.LOADING || xhr.readyState === XMLHttpRequest.DONE) {
        if (!heartbeatTimer) startHeartbeat();
      }
    };

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
              clearInterval(heartbeatTimer);
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
      clearInterval(heartbeatTimer);
      if (aborted) return;
      retryWithBackoff('网络错误');
    };

    xhr.ontimeout = () => {
      clearInterval(heartbeatTimer);
      if (aborted) return;
      retryWithBackoff('请求超时');
    };

    xhr.onloadend = () => {
      clearInterval(heartbeatTimer);
      if (aborted) return;
      onDone();
    };

    // 指数退避重试
    const retryWithBackoff = (errMsg) => {
      if (retryCount >= MAX_RETRIES) {
        onError(`${errMsg}（已重试 ${MAX_RETRIES} 次）`);
        return;
      }
      retryCount++;
      const delay = Math.min(1000 * Math.pow(2, retryCount) + Math.random() * 500, 10000);
      setTimeout(doRequest, delay);
    };

    xhr.send(JSON.stringify({
      message: text,
      session_id: sessionId,
      ...(config || {}),
    }));

    return xhr;
  };

  const xhr = doRequest();

  return () => {
    aborted = true;
    if (xhr) xhr.abort();
  };
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
