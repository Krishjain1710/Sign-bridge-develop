import React, { useCallback } from 'react';
import { useToast } from '../contexts/ToastContext';

interface ExportControlsProps {
  blob?: Blob | null;
  fileName: string;
  label: string;
}

const ExportControls: React.FC<ExportControlsProps> = ({ blob, fileName, label }) => {
  const { addToast } = useToast();

  const handleDownload = useCallback(() => {
    if (!blob) return;
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast(`${label} downloaded`, 'success', 2000);
    } catch {
      addToast('Download failed', 'error');
    }
  }, [blob, fileName, label, addToast]);

  if (!blob) return null;

  return (
    <button
      onClick={handleDownload}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-theme-secondary hover:bg-theme-tertiary border border-theme-primary transition-all text-sm text-theme-secondary btn-press"
      title={`Download ${label}`}
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      {label}
    </button>
  );
};

export default ExportControls;
