import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Pen, RotateCcw, Sparkles } from 'lucide-react';

interface DrawCanvasProps {
  onSolveDoodle: (imageBase64: string) => void;
  isLoading: boolean;
}

export const DrawCanvas: React.FC<DrawCanvasProps> = ({ onSolveDoodle, isLoading }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [mode, setMode] = useState<'pen' | 'eraser'>('pen');
  const [strokeColor, setStrokeColor] = useState<string>('#0f172a');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [hasDrawn, setHasDrawn] = useState<boolean>(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.parentElement?.clientWidth || 360;
    const height = 340;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Initial white math notebook paper
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Faint grid lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e && e.touches.length > 0) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    if ('clientX' in e) {
      return {
        x: (e as React.MouseEvent).clientX - rect.left,
        y: (e as React.MouseEvent).clientY - rect.top,
      };
    }
    return { x: 0, y: 0 };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    setHasDrawn(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (mode === 'pen') {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = strokeWidth;
    } else {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = strokeWidth * 4;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width / window.devicePixelRatio;
    const height = canvas.height / window.devicePixelRatio;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Faint grid lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
    setHasDrawn(false);
  };

  const handleSolve = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    onSolveDoodle(base64);
  };

  return (
    <div className="flex flex-col h-full p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Pen className="w-4 h-4 text-indigo-400" />
            Pizarra Matemática
          </h2>
          <p className="text-xs text-slate-400">Escribe o dibuja cualquier ecuación con tu dedo o ratón</p>
        </div>
        <button
          onClick={clearCanvas}
          className="flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Limpiar
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-2 rounded-xl">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setMode('pen')}
            className={`p-2 rounded-lg transition ${
              mode === 'pen'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Lápiz"
          >
            <Pen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMode('eraser')}
            className={`p-2 rounded-lg transition ${
              mode === 'eraser'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Borrador"
          >
            <Eraser className="w-4 h-4" />
          </button>

          {/* Color picks */}
          {mode === 'pen' && (
            <div className="flex items-center gap-1 ml-2 pl-2 border-l border-slate-800">
              {['#0f172a', '#1e40af', '#b91c1c', '#047857'].map((c) => (
                <button
                  key={c}
                  onClick={() => setStrokeColor(c)}
                  className={`w-5 h-5 rounded-full border-2 transition ${
                    strokeColor === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Width selection */}
        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Grosor:</span>
          {[2, 4, 6].map((w) => (
            <button
              key={w}
              onClick={() => setStrokeWidth(w)}
              className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                strokeWidth === w ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40' : 'text-slate-400'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative flex-1 min-h-[300px] rounded-2xl overflow-hidden border-2 border-slate-700/80 shadow-inner bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-full block touch-none cursor-crosshair"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasDrawn && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-slate-400 text-sm font-medium">
            ✍️ Escribe aquí (ej. 3x + 8 = 29 o ∫ x² dx)
          </div>
        )}
      </div>

      {/* Solve action */}
      <button
        onClick={handleSolve}
        disabled={isLoading || !hasDrawn}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 active:scale-[0.98] transition disabled:opacity-50 disabled:pointer-events-none"
      >
        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
        {isLoading ? 'Analizando con Gemini...' : 'Resolver ejercicio dibujado'}
      </button>
    </div>
  );
};

export default DrawCanvas;
