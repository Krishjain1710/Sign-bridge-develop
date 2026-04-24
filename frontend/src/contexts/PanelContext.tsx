import React, { createContext, useContext, useState, useCallback } from 'react';

export type PanelName =
  | 'history'
  | 'favorites'
  | 'settings'
  | 'phraseBook'
  | 'learningMode'
  | 'learningHub'
  | 'onboarding'
  | 'accessibility'
  | null;

interface PanelContextValue {
  activePanel: PanelName;
  openPanel: (name: NonNullable<PanelName>) => void;
  closePanel: () => void;
  togglePanel: (name: NonNullable<PanelName>) => void;
}

const PanelContext = createContext<PanelContextValue | null>(null);

export const PanelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePanel, setActivePanel] = useState<PanelName>(null);

  const openPanel = useCallback((name: NonNullable<PanelName>) => {
    setActivePanel(name);
  }, []);

  const closePanel = useCallback(() => {
    setActivePanel(null);
  }, []);

  const togglePanel = useCallback((name: NonNullable<PanelName>) => {
    setActivePanel(prev => (prev === name ? null : name));
  }, []);

  return (
    <PanelContext.Provider value={{ activePanel, openPanel, closePanel, togglePanel }}>
      {children}
    </PanelContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function usePanel() {
  const ctx = useContext(PanelContext);
  if (!ctx) throw new Error('usePanel must be used within PanelProvider');
  return ctx;
}
