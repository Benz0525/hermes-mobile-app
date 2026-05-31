// API 调用 —— SSE 流式对话 + 心跳 + 指数退避重试 + session 列表
const API_STREAM = 'http://8.163.2.252/app-api/chat/stream';
const HERMES_API = 'http://8.163.2.252:8642';
const API_KEY = 'hermes-benz-2026';
const TIMEOUT = 120000;   // 120 秒超时
const HEARTBEAT_MS = 25000;  // SSE 心跳间隔 25s
const MAX_RETRIES = 3;       // 最大重试次数

/**
 * 发送消息并接收 SSE 流式响应（带心跳 + 指数退避重试）
 */
export function sendMessageStream(text, sessionId, config, onChunk, onDone, onError, onMeta) {
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

    const startHeartbeat = () => {
      heartbeatTimer = setInterval(() => {
        if (xhr.readyState >= 4) {
          clearInterval(heartbeatTimer);
          return;
        }
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
              // v5.3.1: meta 事件单独回调
              if (parsed.type === 'meta') {
                if (onMeta) onMeta(parsed);
              } else {
                onChunk(parsed);
              }
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

export async function uploadImage(uri) {
  const formData = new FormData();
  formData.append('file', { uri, type: 'image/jpeg', name: 'photo.jpg' });
  const res = await fetch('http://8.163.2.252/app-api/upload/image', {
    method: 'POST',
    body: formData,
  });
  return res.json();
}

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

// ─── v5.2.0: Session 列表（hermes-gateway HTTP API） ──────

/**
 * 从 hermes-gateway 拉取所有 session
 * @returns {Promise<Array>} [{ id, title, model, started_at, message_count, ... }]
 */
export async function fetchSessions() {
  const res = await fetch(`${HERMES_API}/api/sessions?source=weixin&limit=200`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return (data.data || []).map(s => ({
    ...s,
    _source: 'api',
  }));
}

/**
 * 从 hermes-gateway 拉取指定 session 的消息历史
 * @param {string} sessionId - hermes session ID
 * @returns {Promise<Array>} [{ id, role, content, ... }]
 */
export async function fetchSessionMessages(sessionId) {
  const res = await fetch(`${HERMES_API}/api/sessions/${sessionId}/messages`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.data || [];
}
