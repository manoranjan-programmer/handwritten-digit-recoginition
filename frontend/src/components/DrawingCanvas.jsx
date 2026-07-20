/**
 * DrawingCanvas.jsx
 * -----------------
 * A whiteboard-style canvas where users can draw a digit with their mouse
 * or finger (touch), then submit it for prediction.
 *
 * Props
 * -----
 * onPredict(blob) — called with a PNG Blob when the user clicks "Predict"
 * loading         — disables buttons while a request is in flight
 */

import { useRef, useEffect, useState, useCallback } from 'react';

const CANVAS_SIZE   = 280;   // display size (px) — 10× the model's 28×28
const BRUSH_COLOR   = '#1e293b';  // near-black on white background
const BRUSH_WIDTH   = 18;
const ERASER_WIDTH  = 32;
const BG_COLOR      = '#ffffff';

export default function DrawingCanvas({ onPredict, loading }) {
  const canvasRef    = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef   = useRef({ x: 0, y: 0 });

  const [isEmpty,   setIsEmpty]   = useState(true);
  const [tool,      setTool]      = useState('pen');   // 'pen' | 'eraser'

  // ── Initialise canvas background ─────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
  }, []);

  // ── Coordinate helper — handles both mouse and touch ─────────────────────
  function getPos(e) {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;

    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top)  * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top)  * scaleY,
    };
  }

  // ── Draw helpers ─────────────────────────────────────────────────────────
  function startDraw(e) {
    e.preventDefault();
    isDrawingRef.current = true;
    const pos = getPos(e);
    lastPosRef.current = pos;

    // Draw a dot on click/tap (no movement needed)
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, (tool === 'eraser' ? ERASER_WIDTH : BRUSH_WIDTH) / 2, 0, Math.PI * 2);
    ctx.fillStyle = tool === 'eraser' ? BG_COLOR : BRUSH_COLOR;
    ctx.fill();
    setIsEmpty(false);
  }

  function draw(e) {
    e.preventDefault();
    if (!isDrawingRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    const pos = getPos(e);

    ctx.beginPath();
    ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = tool === 'eraser' ? BG_COLOR : BRUSH_COLOR;
    ctx.lineWidth   = tool === 'eraser' ? ERASER_WIDTH : BRUSH_WIDTH;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();

    lastPosRef.current = pos;
    setIsEmpty(false);
  }

  function stopDraw() {
    isDrawingRef.current = false;
  }

  // ── Clear canvas ─────────────────────────────────────────────────────────
  const handleClear = useCallback(() => {
    const ctx = canvasRef.current.getContext('2d');
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    setIsEmpty(true);
  }, []);

  // ── Export canvas → Blob → call onPredict ────────────────────────────────
  const handlePredict = useCallback(() => {
    if (isEmpty || loading) return;
    canvasRef.current.toBlob(
      (blob) => {
        if (blob) onPredict(blob);
      },
      'image/png'
    );
  }, [isEmpty, loading, onPredict]);

  return (
    <div className="flex flex-col gap-4">
      {/* Tool selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-slate-500 mr-1">Tool:</span>
        <button
          type="button"
          onClick={() => setTool('pen')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                      border transition-all ${
                        tool === 'pen'
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
          aria-pressed={tool === 'pen'}
        >
          {/* Pen icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
               className="w-3.5 h-3.5" aria-hidden="true">
            <path d="M2.695 14.763l-1.262 3.154a.5.5 0 00.65.65l3.155-1.262a4 4 0 001.343-.885L17.5 5.5a2.121 2.121 0 00-3-3L3.58 13.42a4 4 0 00-.885 1.343z"/>
          </svg>
          Pen
        </button>
        <button
          type="button"
          onClick={() => setTool('eraser')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                      border transition-all ${
                        tool === 'eraser'
                          ? 'bg-slate-700 text-white border-slate-700'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                      }`}
          aria-pressed={tool === 'eraser'}
        >
          {/* Eraser icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
               className="w-3.5 h-3.5" aria-hidden="true">
            <path fillRule="evenodd"
              d="M8.22 5.22a.75.75 0 011.06 0l6 6a.75.75 0 010 1.06l-5.25 5.25a2.25 2.25 0 01-3.18 0L3.47 14.2a2.25 2.25 0 010-3.18l4.75-5.8zm1.06 1.06L4.53 11.03a.75.75 0 000 1.06l3.38 3.38a.75.75 0 001.06 0l4.75-4.75-4.44-4.44z"
              clipRule="evenodd"/>
          </svg>
          Eraser
        </button>
      </div>

      {/* Canvas whiteboard */}
      <div className="relative rounded-xl overflow-hidden border-2 border-slate-200
                      shadow-inner bg-white"
           style={{ lineHeight: 0 }}>
        <canvas
          ref={canvasRef}
          width={CANVAS_SIZE}
          height={CANVAS_SIZE}
          className="block w-full touch-none"
          style={{ cursor: tool === 'eraser' ? 'cell' : 'crosshair', aspectRatio: '1' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          aria-label="Drawing canvas — draw a digit here"
          role="img"
        />
        {/* Placeholder hint when empty */}
        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-slate-300 text-sm font-medium select-none">
              Draw a digit here
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={handlePredict}
          disabled={isEmpty || loading}
          className="btn-primary flex-1"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg"
                   fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"
                        className="opacity-25"/>
                <path stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                      d="M12 2a10 10 0 019.19 6.07" className="opacity-75"/>
              </svg>
              Predicting…
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
                   className="w-4 h-4" aria-hidden="true">
                <path d="M3.105 2.289a.75.75 0 00-.826.95l1.414 4.925A1.5 1.5 0 005.135 9.25h6.115a.75.75 0 010 1.5H5.135a1.5 1.5 0 00-1.442 1.086l-1.414 4.926a.75.75 0 00.826.95 28.896 28.896 0 0015.293-7.154.75.75 0 000-1.114A28.897 28.897 0 003.105 2.289z"/>
              </svg>
              Predict Digit
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={loading}
          className="btn-danger"
          aria-label="Clear the canvas"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
