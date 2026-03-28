import { useState, useCallback } from 'react';

type AIAction = 'grammar' | 'suggest' | 'compose' | 'code_help' | 'math_help' | 'music_help' | 'prompt_help';

interface UseNotepadAIResult {
  response: string;
  isLoading: boolean;
  error: string | null;
  runAI: (action: AIAction, text: string, mode?: string, agent?: string) => Promise<void>;
  clearResponse: () => void;
}

export function useNotepadAI(): UseNotepadAIResult {
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notepad-ai`;

  const runAI = useCallback(async (action: AIAction, text: string, mode?: string, agent?: string) => {
    if (!text.trim()) return;
    setIsLoading(true);
    setError(null);
    setResponse('');

    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ action, text, mode, agent }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error('No response body');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, nlIdx);
          buffer = buffer.slice(nlIdx + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              accumulated += content;
              setResponse(accumulated);
            }
          } catch { /* partial JSON */ }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [CHAT_URL]);

  const clearResponse = useCallback(() => {
    setResponse('');
    setError(null);
  }, []);

  return { response, isLoading, error, runAI, clearResponse };
}
