"use client";

import { useCanvas } from "@/hooks/useCanvas";

const COLORS = [
  "#000000",
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#eab308",
  "#f97316",
  "#a855f7",
  "#92400e",
  "#ffffff",
];

const SIZES = [2, 6, 12];

interface CanvasProps {
  prompt: string | null;
  onSubmit: (dataUrl: string) => void;
  disabled?: boolean;
}

export function Canvas({ prompt, onSubmit, disabled }: CanvasProps) {
  const {
    canvasRef,
    color,
    setColor,
    brushSize,
    setBrushSize,
    undo,
    clear,
    toDataURL,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    hasStrokes,
  } = useCanvas();

  const handleSubmit = () => {
    onSubmit(toDataURL());
  };

  return (
    <div className="space-y-3 w-full max-w-2xl mx-auto animate-fade-in">
      {prompt && (
        <div className="pixel-card border-nes-yellow bg-nes-yellow/10 text-center">
          <p className="font-heading text-[10px] text-text-muted mb-1">Tegn dette:</p>
          <p className="font-bold text-retro-white">&ldquo;{prompt}&rdquo;</p>
        </div>
      )}

      <div className="pixel-border-inset bg-white overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{ touchAction: "none" }}
          className="w-full cursor-crosshair aspect-[4/3]"
          onPointerDown={disabled ? undefined : onPointerDown}
          onPointerMove={disabled ? undefined : onPointerMove}
          onPointerUp={disabled ? undefined : onPointerUp}
          onPointerLeave={disabled ? undefined : onPointerUp}
        />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 flex-wrap">
        {/* Colors */}
        <div className="flex flex-wrap gap-1 justify-center">
          {COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`w-8 h-8 border-3 transition-transform ${
                color === c
                  ? "border-nes-cyan scale-110 ring-2 ring-nes-cyan"
                  : "border-border-pixel"
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* Sizes */}
        <div className="flex gap-1 items-center">
          {SIZES.map((s) => (
            <button
              key={s}
              onClick={() => setBrushSize(s)}
              className={`flex items-center justify-center w-9 h-9 border-3 border-border-pixel ${
                brushSize === s
                  ? "bg-retro-dark"
                  : "bg-retro-surface hover:bg-retro-dark"
              }`}
            >
              <div
                className="bg-retro-white"
                style={{ width: s + 4, height: s + 4 }}
              />
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2 sm:ml-auto">
          <button
            onClick={undo}
            disabled={disabled}
            className="pixel-btn-sm bg-retro-surface text-text-muted"
          >
            Angre
          </button>
          <button
            onClick={clear}
            disabled={disabled}
            className="pixel-btn-sm bg-retro-surface text-text-muted"
          >
            Tøm
          </button>
          <button
            onClick={handleSubmit}
            disabled={disabled || !hasStrokes}
            className="pixel-btn-sm bg-btn-primary text-retro-white"
          >
            Send inn
          </button>
        </div>
      </div>
    </div>
  );
}
