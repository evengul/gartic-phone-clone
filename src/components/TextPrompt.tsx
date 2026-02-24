"use client";

import { useState } from "react";

interface TextPromptProps {
  prompt: string | null;
  roundNumber: number;
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export function TextPrompt({
  prompt,
  roundNumber,
  onSubmit,
  disabled,
}: TextPromptProps) {
  const [text, setText] = useState("");

  const isFirstRound = roundNumber === 0;
  const label = isFirstRound
    ? "Skriv en setning som andre skal tegne"
    : "Beskriv hva du ser i tegningen";

  return (
    <div className="space-y-4 w-full max-w-lg mx-auto animate-fade-in">
      <p className="text-sm text-text-muted">{label}</p>

      {prompt && !isFirstRound && (
        <div className="pixel-card">
          <p className="text-xs text-text-muted mb-2">Forrige tegning:</p>
          <div className="pixel-border-inset bg-white">
            <img
              src={prompt}
              alt="Forrige tegning"
              className="w-full"
            />
          </div>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={
          isFirstRound
            ? "En katt på skateboard..."
            : "Beskriv hva du ser..."
        }
        maxLength={200}
        disabled={disabled}
        className="pixel-input w-full resize-none h-24 disabled:opacity-50"
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-text-muted">{text.length}/200</span>
        <button
          onClick={() => onSubmit(text)}
          disabled={disabled || text.trim().length === 0}
          className="pixel-btn bg-btn-primary text-retro-white"
        >
          Send inn
        </button>
      </div>
    </div>
  );
}
