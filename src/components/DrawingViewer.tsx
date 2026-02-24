"use client";

interface DrawingViewerProps {
  dataUrl: string;
  label?: string;
}

export function DrawingViewer({ dataUrl, label }: DrawingViewerProps) {
  return (
    <div className="space-y-1">
      {label && <p className="text-xs text-text-muted">{label}</p>}
      <div className="pixel-border-inset bg-white">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt="Tegning"
            className="w-full"
          />
        ) : (
          <div className="w-full aspect-square flex flex-col items-center justify-center gap-2 text-text-muted">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" className="opacity-40">
              <rect x="3" y="3" width="18" height="18" rx="0" />
              <path d="M3 16l5-5 4 4 3-3 6 6" />
              <line x1="9" y1="7" x2="9" y2="11" />
              <line x1="7" y1="9" x2="11" y2="9" />
            </svg>
            <span className="text-xs italic">Ingen tegning levert</span>
          </div>
        )}
      </div>
    </div>
  );
}
