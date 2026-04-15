import React, { useState } from 'react';
import type { PipelineMetrics } from '../hooks/usePerformanceMetrics';

interface MetricsOverlayProps {
  metrics: PipelineMetrics;
  visible: boolean;
}

const MetricsOverlay: React.FC<MetricsOverlayProps> = ({ metrics, visible }) => {
  const [expanded, setExpanded] = useState(false);

  if (!visible) return null;

  const stageEntries = Object.entries(metrics.stages);
  const hasData = stageEntries.length > 0 || metrics.lastPipelineTime !== null;

  return (
    <div className="fixed bottom-4 left-4 z-40">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono shadow-lg transition-colors"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
        aria-label="Toggle performance metrics"
      >
        <div className={`w-2 h-2 rounded-full ${hasData ? 'bg-success-500' : 'bg-secondary-400'}`} />
        <span className="text-theme-secondary">
          {metrics.lastPipelineTime !== null ? `${metrics.lastPipelineTime}ms` : 'Metrics'}
        </span>
        <svg className={`w-3 h-3 text-theme-muted transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        </svg>
      </button>

      {expanded && (
        <div
          className="mt-2 p-3 rounded-lg shadow-lg text-xs font-mono min-w-[220px]"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
        >
          <div className="text-theme-primary font-semibold mb-2">Pipeline Metrics</div>
          {!hasData ? (
            <p className="text-theme-muted">No data yet. Translate something to see metrics.</p>
          ) : (
            <div className="space-y-1.5">
              {stageEntries.map(([label, data]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-theme-secondary capitalize">{label}</span>
                  <span className="text-theme-primary">
                    {data.last}ms
                    <span className="text-theme-muted ml-1">(avg {data.avg}ms)</span>
                  </span>
                </div>
              ))}
              {metrics.lastPipelineTime !== null && (
                <div className="flex justify-between gap-4 pt-1.5 border-t border-theme-primary">
                  <span className="text-theme-secondary font-semibold">Total</span>
                  <span className="text-primary-500 font-semibold">{metrics.lastPipelineTime}ms</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricsOverlay;
