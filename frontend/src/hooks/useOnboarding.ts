import { useState, useCallback } from 'react';

const STORAGE_KEY = 'vocasign_onboarding_complete';

export function useOnboarding() {
  const [isComplete, setIsComplete] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  });

  const complete = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsComplete(true);
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsComplete(false);
  }, []);

  return { isComplete, complete, reset };
}
