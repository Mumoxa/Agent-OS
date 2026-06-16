import { useEffect, useRef, useState } from 'react';

interface SSEOptions {
  url: string;
  topics?: string[];
  onMessage?: (event: any) => void;
  onEvent?: (topic: string, event: any) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
}

export function useSSE(options: SSEOptions) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<any>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const topics = options.topics?.join(',') ?? 'agent.lifecycle,agent.approval_request,security.alert';
    const url = `${options.url}?topics=${encodeURIComponent(topics)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => {
      setConnected(true);
      options.onOpen?.();
    };

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setLastEvent(data);
        options.onMessage?.(data);
      } catch (err) {
        console.error('Failed to parse SSE message:', event.data);
      }
    };

    es.addEventListener('agent.lifecycle', (event) => handleTopicEvent(event, 'agent.lifecycle'));
    es.addEventListener('agent.approval_request', (event) => handleTopicEvent(event, 'agent.approval_request'));
    es.addEventListener('security.alert', (event) => handleTopicEvent(event, 'security.alert'));
    es.addEventListener('knowledge.change', (event) => handleTopicEvent(event, 'knowledge.change'));

    es.onerror = (error) => {
      setConnected(false);
      options.onError?.(error);
    };

    function handleTopicEvent(event: MessageEvent, topic: string) {
      try {
        const data = JSON.parse(event.data);
        setLastEvent(data);
        options.onEvent?.(topic, data);
      } catch (err) {
        console.error(`Failed to parse ${topic} event:`, event.data);
      }
    }

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [options.url, options.topics?.join(',')]);

  return { connected, lastEvent, eventSource: eventSourceRef.current };
}
