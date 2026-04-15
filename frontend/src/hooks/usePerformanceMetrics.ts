import { useState, useCallback, useRef } from 'react';

export interface MetricEntry {
  label: string;
  duration: number;
  timestamp: number;
}

export interface PipelineMetrics {
  lastPipelineTime: number | null;
  stages: Record<string, { last: number; avg: number; count: number }>;
}

const MAX_HISTORY = 10;

export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState<PipelineMetrics>({
    lastPipelineTime: null,
    stages: {},
  });

  const timersRef = useRef<Record<string, number>>({});
  const historyRef = useRef<Record<string, number[]>>({});

  const startTimer = useCallback((label: string) => {
    timersRef.current[label] = performance.now();
  }, []);

  const endTimer = useCallback((label: string) => {
    const start = timersRef.current[label];
    if (start === undefined) return 0;

    const duration = Math.round(performance.now() - start);
    delete timersRef.current[label];

    // Update history
    if (!historyRef.current[label]) {
      historyRef.current[label] = [];
    }
    const history = historyRef.current[label];
    history.push(duration);
    if (history.length > MAX_HISTORY) {
      history.shift();
    }

    const avg = Math.round(history.reduce((s, v) => s + v, 0) / history.length);

    setMetrics(prev => ({
      ...prev,
      stages: {
        ...prev.stages,
        [label]: { last: duration, avg, count: history.length },
      },
    }));

    return duration;
  }, []);

  const setPipelineTime = useCallback((time: number) => {
    setMetrics(prev => ({ ...prev, lastPipelineTime: time }));
  }, []);

  const resetMetrics = useCallback(() => {
    timersRef.current = {};
    historyRef.current = {};
    setMetrics({ lastPipelineTime: null, stages: {} });
  }, []);

  return { metrics, startTimer, endTimer, setPipelineTime, resetMetrics };
}
