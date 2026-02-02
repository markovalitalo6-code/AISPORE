let ws;
const listeners = new Set();

export function connectWS(port = 7070) {
  const host = location.hostname || 'localhost';
  const url = `ws://${host}:${port}`;
  try {
    ws = new WebSocket(url);
  } catch (e) {
    console.error('[WS] init error', e);
    return;
  }

  ws.onopen = () => console.log('[WS] connected', url);
  ws.onclose = () => {
    console.warn('[WS] disconnected — reconnect 2s');
    setTimeout(() => connectWS(port), 2000);
  };
  ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      for (const fn of listeners) fn(data);
    } catch (e) {
      console.error('WS parse error', e);
    }
  };
}

export function onWSMessage(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
