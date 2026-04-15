import { useState, useCallback } from 'react';

export interface FavoriteEntry {
  id: string;
  text: string;
  signWriting: string[];
  createdAt: number;
}

const STORAGE_KEY = 'signbridge-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteEntry[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const save = (items: FavoriteEntry[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch { /* localStorage unavailable */ }
  };

  const addFavorite = useCallback((text: string, signWriting: string[]) => {
    setFavorites(prev => {
      // Don't add duplicates
      if (prev.some(f => f.text === text)) return prev;
      const entry: FavoriteEntry = {
        id: `fav-${Date.now()}`,
        text,
        signWriting,
        createdAt: Date.now(),
      };
      const next = [entry, ...prev];
      save(next);
      return next;
    });
  }, []);

  const removeFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.id !== id);
      save(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback((text: string) => {
    return favorites.some(f => f.text === text);
  }, [favorites]);

  return { favorites, addFavorite, removeFavorite, isFavorite };
}
