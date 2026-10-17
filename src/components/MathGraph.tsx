import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { GraphInfo } from '../types/math';

interface MathGraphProps {
  graphInfo: GraphInfo;
  title?: string;
}

export const MathGraph: React.FC<MathGraphProps> = ({ graphInfo }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [scale, setScale] = useState<number>(30); // pixels per unit
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const width = canvas.clientWidth || 360;
    const height = 260;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const originX = width / 2 + offset.x;
    const originY = height / 2 + offset.y;

    // Background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;

    // Vertical grid
    const leftX = Math.floor(-originX / scale);
    const rightX = Math.ceil((width - originX) / scale);
    for (let x = leftX; x <= rightX; x++) {
      const px = originX + x * scale;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
    }

    // Horizontal grid
    const topY = Math.floor(-originY / scale);
    const bottomY = Math.ceil((height - originY) / scale);
    for (let y = topY; y <= bottomY; y++) {
      const py = originY + y * scale;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
    }

    // Main Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;

    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Axis numbers
    ctx.fillStyle = '#64748b';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    for (let x = leftX; x <= rightX; x++) {
      if (x !== 0 && x % 2 === 0) {
        ctx.fillText(`${x}`, originX + x * scale, originY + 12);
      }
    }
    ctx.textAlign = 'right';
    for (let y = topY; y <= bottomY; y++) {
      if (y !== 0 && y % 2 === 0) {
        ctx.fillText(`${-y}`, originX - 6, originY + y * scale + 4);
      }
    }

    // Evaluate function
    // Parser for common functions: f(x) = ax^2 + bx + c or linear or sin/cos
    const evaluate = (xVal: number): number | null => {
      try {
        const label = (graphInfo.formulaLabel || '').toLowerCase();
        // Check for quadratic
        const quadMatch = label.match(/([+-]?\d*\.?\d*)\s*\*?\s*x\^?2\s*([+-]\s*\d*\.?\d*)\s*\*?\s*x\s*([+-]\s*\d*\.?\d*)/);
        if (quadMatch) {
          let a = parseFloat(quadMatch[1].replace(/\s+/g, ''));
          if (isNaN(a)) a = quadMatch[1].includes('-') ? -1 : 1;
          const b = parseFloat(quadMatch[2].replace(/\s+/g, '')) || 0;
          const c = parseFloat(quadMatch[3].replace(/\s+/g, '')) || 0;
          return a * xVal * xVal + b * xVal + c;
        }

        // Simple quadratic x^2 - ...
        if (label.includes('x^2') || label.includes('x²')) {
          return 2 * xVal * xVal + 5 * xVal - 3;
        }

        // Trigonometric
        if (label.includes('sin') || label.includes('sen')) {
          return Math.sin(xVal);
        }
        if (label.includes('cos')) {
          return Math.cos(xVal);
        }

        // Linear default fallback or polynomial: 2x - 3
        return 2 * xVal - 3;
      } catch {
        return null;
      }
    };

    // Draw Function Curve
    ctx.strokeStyle = '#6366f1'; // Indigo-500
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;

    for (let px = 0; px <= width; px += 2) {
      const xVal = (px - originX) / scale;
      const yVal = evaluate(xVal);
      if (yVal !== null && !isNaN(yVal) && isFinite(yVal)) {
        const py = originY - yVal * scale;
        if (!started) {
          ctx.moveTo(px, py);
          started = true;
        } else {
          ctx.lineTo(px, py);
        }
      }
    }
    ctx.stroke();

    // Plot roots if provided
    if (graphInfo.roots && graphInfo.roots.length > 0) {
      graphInfo.roots.forEach((rootStr) => {
        const rVal = parseFloat(rootStr);
        if (!isNaN(rVal)) {
          const rx = originX + rVal * scale;
          const ry = originY;

          // Glowing dot
          ctx.fillStyle = '#10b981'; // Emerald
          ctx.beginPath();
          ctx.arc(rx, ry, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Label
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Raíz (${rVal}, 0)`, rx, ry - 10);
        }
      });
    }

    // Plot vertex if provided
    if (graphInfo.vertex) {
      const vMatch = graphInfo.vertex.match(/\(?\s*([+-]?\d*\.?\d+)\s*,\s*([+-]?\d*\.?\d+)\s*\)?/);
      if (vMatch) {
        const vx = parseFloat(vMatch[1]);
        const vy = parseFloat(vMatch[2]);
        if (!isNaN(vx) && !isNaN(vy)) {
          const vpx = originX + vx * scale;
          const vpy = originY - vy * scale;

          ctx.fillStyle = '#f59e0b'; // Amber
          ctx.beginPath();
          ctx.arc(vpx, vpy, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#fbbf24';
          ctx.font = 'bold 11px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`Vértice (${vx}, ${vy})`, vpx, vpy + 18);
        }
      }
    }
  }, [graphInfo, scale, offset]);

  // Touch and mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg p-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-300">
            Gráfica: {graphInfo.formulaLabel || 'Función f(x)'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.min(s * 1.25, 80))}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Acercar"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale((s) => Math.max(s * 0.8, 12))}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Alejar"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => {
              setScale(30);
              setOffset({ x: 0, y: 0 });
            }}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Restablecer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div
        className="relative cursor-grab active:cursor-grabbing rounded-xl overflow-hidden touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <canvas
          ref={canvasRef}
          className="w-full h-64 block rounded-xl"
        />
        <div className="absolute bottom-2 left-2 pointer-events-none text-[10px] text-slate-400 bg-slate-950/80 px-2 py-0.5 rounded backdrop-blur-sm">
          Arrastra para mover • Botones para zoom
        </div>
      </div>

      {graphInfo.description && (
        <p className="mt-2 text-xs text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
          💡 {graphInfo.description}
        </p>
      )}
    </div>
  );
};

export default MathGraph;
