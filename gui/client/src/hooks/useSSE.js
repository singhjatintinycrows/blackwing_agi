import { useEffect, useRef } from 'react';

export function useSSE(url, handlers, active) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!url || !active) return;

    const es = new EventSource(url, { withCredentials: true });

    es.addEventListener('log', (e) => {
      handlersRef.current.onLog?.(JSON.parse(e.data));
    });
    es.addEventListener('done', () => {
      handlersRef.current.onDone?.();
      es.close();
    });
    es.addEventListener('error', (e) => {
      handlersRef.current.onError?.(e);
    });
    es.onerror = () => {
      handlersRef.current.onStreamError?.();
      es.close();
    };

    return () => es.close();
  }, [url, active]);
}
