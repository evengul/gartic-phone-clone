"use client";

import { useRef, useState, useCallback, useEffect } from "react";

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
  color: string;
  width: number;
}

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  if (stroke.points.length === 0) return;
  if (stroke.points.length === 1) {
    const p = stroke.points[0];
    ctx.fillStyle = stroke.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, stroke.width / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
}

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<Stroke | null>(null);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(4);

  const getCanvasPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): Point => {
      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    []
  );

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (const stroke of strokes) {
      drawStroke(ctx, stroke);
    }
    if (currentStrokeRef.current) {
      drawStroke(ctx, currentStrokeRef.current);
    }
  }, [strokes]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const point = getCanvasPoint(e);
      currentStrokeRef.current = { points: [point], color, width: brushSize };
      isDrawingRef.current = true;
      // Draw the dot immediately for visual feedback
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d")!;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(point.x, point.y, brushSize / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    [color, brushSize, getCanvasPoint]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current || !currentStrokeRef.current) return;
      e.preventDefault();
      const point = getCanvasPoint(e);
      currentStrokeRef.current.points.push(point);
      // Draw incrementally
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      const stroke = currentStrokeRef.current;
      const len = stroke.points.length;
      if (len >= 2) {
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(stroke.points[len - 2].x, stroke.points[len - 2].y);
        ctx.lineTo(stroke.points[len - 1].x, stroke.points[len - 1].y);
        ctx.stroke();
      }
    },
    [getCanvasPoint]
  );

  const onPointerUp = useCallback(() => {
    if (currentStrokeRef.current && currentStrokeRef.current.points.length >= 1) {
      const finishedStroke = currentStrokeRef.current;
      setStrokes((prev) => [...prev, finishedStroke]);
    }
    currentStrokeRef.current = null;
    isDrawingRef.current = false;
  }, []);

  const undo = useCallback(() => {
    setStrokes((prev) => prev.slice(0, -1));
  }, []);

  const clear = useCallback(() => {
    setStrokes([]);
  }, []);

  const toDataURL = useCallback(() => {
    return canvasRef.current?.toDataURL("image/png") ?? "";
  }, []);

  return {
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
    hasStrokes: strokes.length > 0,
  };
}
