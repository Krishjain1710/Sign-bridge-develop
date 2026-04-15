import { useState, useCallback } from 'react';

export interface HistoryEntry {
  id: string;
  timestamp: number;
  inputText: string;
  signWriting: string[];
}

const MAX_HISTORY = 50;

export function useTranslationHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try {
      const stored = sessionStorage.getItem('signbridge-history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const addEntry = useCallback((inputText: string, signWriting: string[]) => {
    if (!inputText.trim() || signWriting.length === 0) return;

    const entry: HistoryEntry = {
      id: `h-${Date.now()}`,
      timestamp: Date.now(),
      inputText,
      signWriting,
    };

    setHistory(prev => {
      const next = [entry, ...prev].slice(0, MAX_HISTORY);
      try {
        sessionStorage.setItem('signbridge-history', JSON.stringify(next));
      } catch { /* sessionStorage unavailable */ }
      return next;
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    sessionStorage.removeItem('signbridge-history');
  }, []);

  return { history, addEntry, clearHistory };
}
