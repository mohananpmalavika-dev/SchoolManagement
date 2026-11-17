'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Pen,
  Highlighter,
  Eraser,
  Square,
  Circle,
  ArrowRight,
  Type,
  RotateCcw,
  Download,
  Trash2,
  Users,
  X,
  Share2,
  Maximize2,
  Minimize2,
  Palette,
  Sparkles,
} from 'lucide-react';

export interface BoardProps {
  channelName: string;
  userRole?: string;
  userName?: string;
  onClose: () => void;
  onShareToChat?: (snapshotDataUrl: string) => Promise<void>;
}

type ToolType = 'pen' | 'highlighter' | 'eraser' | 'rect' | 'circle' | 'arrow' | 'text';
type BoardTheme = 'chalkboard' | 'whiteboard';

interface DrawAction {
  tool: ToolType;
  color: string;
  size: number;
  points: { x: number; y: number }[];
  text?: string;
  author: string;
  authorRole: string;
}

export function InteractiveClassroomBoard({
  channelName,
  userRole = 'TEACHER',
  userName = 'You',
  onClose,
  onShareToChat,
}: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [theme, setTheme] = useState<BoardTheme>('chalkboard');
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<string>('#ffffff');
  const [size, setSize] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [history, setHistory] = useState<DrawAction[]>([]);
  const activeUsers=[{name:userName,role:userRole,color:'#10b981'}];
  const [sharing,setSharing]=useState(false);
  const [shareError,setShareError]=useState('');
  const [fullScreen, setFullScreen] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number } | null>(null);

  const colors = theme === 'chalkboard'
    ? ['#ffffff', '#fde047', '#34d399', '#60a5fa', '#f472b6', '#fb923c']
    : ['#1e293b', '#dc2626', '#16a34a', '#2563eb', '#9333ea', '#ea580c'];

  // Initialize canvas
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Background
    ctx.fillStyle = theme === 'chalkboard' ? '#142823' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid or chalkboard texture
    ctx.strokeStyle = theme === 'chalkboard' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Replay history
    for (const action of history) {
      if (action.points.length < 2 && action.tool !== 'text') continue;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (action.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.size * 3;
      } else if (action.tool === 'eraser') {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = theme === 'chalkboard' ? '#142823' : '#ffffff';
        ctx.lineWidth = action.size * 4;
      } else {
        ctx.globalAlpha = 1;
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.size;
      }

      if (action.tool === 'pen' || action.tool === 'highlighter' || action.tool === 'eraser') {
        ctx.beginPath();
        ctx.moveTo(action.points[0].x, action.points[0].y);
        for (let i = 1; i < action.points.length; i++) {
          ctx.lineTo(action.points[i].x, action.points[i].y);
        }
        ctx.stroke();
      } else if (action.tool === 'rect') {
        const start = action.points[0];
        const end = action.points[action.points.length - 1];
        ctx.strokeRect(start.x, start.y, end.x - start.x, end.y - start.y);
      } else if (action.tool === 'circle') {
        const start = action.points[0];
        const end = action.points[action.points.length - 1];
        const radius = Math.hypot(end.x - start.x, end.y - start.y);
        ctx.beginPath();
        ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
        ctx.stroke();
      } else if (action.tool === 'arrow') {
        const start = action.points[0];
        const end = action.points[action.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      } else if (action.tool === 'text' && action.text) {
        ctx.font = `${action.size * 6}px sans-serif`;
        ctx.fillStyle = action.color;
        ctx.fillText(action.text, action.points[0].x, action.points[0].y);
      }

      ctx.restore();
    }
  }, [history, theme]);

  // Resize canvas to display dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const width = parent.clientWidth;
    const height = parent.clientHeight;

    canvas.width = width;
    canvas.height = height;
    redrawCanvas();
  }, [redrawCanvas, fullScreen]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const coords = getCanvasCoords(e);
    if (tool === 'text') {
      setTextInputPos(coords);
      return;
    }

    setIsDrawing(true);
    setHistory((prev) => [
      ...prev,
      {
        tool,
        color,
        size,
        points: [coords],
        author: userName,
        authorRole: userRole,
      },
    ]);
  };

  const handleMouseMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const coords = getCanvasCoords(e);

    setHistory((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      const updated = {
        ...last,
        points: [...last.points, coords],
      };
      return [...prev.slice(0, -1), updated];
    });
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentText.trim() || !textInputPos) return;

    setHistory((prev) => [
      ...prev,
      {
        tool: 'text',
        color,
        size,
        points: [textInputPos],
        text: currentText.trim(),
        author: userName,
        authorRole: userRole,
      },
    ]);

    setCurrentText('');
    setTextInputPos(null);
  };

  const handleUndo = () => {
    setHistory((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (confirm('Clear your board? Download it first if you need a copy.')) {
      setHistory([]);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `Krypton_Board_${channelName.replace(/\s+/g, '_')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !onShareToChat || sharing) return;
    const dataUrl = canvas.toDataURL('image/png');
    setSharing(true);setShareError('');
    try {await onShareToChat(dataUrl);}catch{setShareError('The snapshot could not be saved. Retry or download your board.');}finally{setSharing(false);}
  };

  return (
    <div
      className={`bg-slate-950 border border-slate-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl transition-all ${fullScreen ? 'fixed inset-4 z-50' : 'h-[640px]'
        }`}
    >
      {/* Top Banner / Classroom Info */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
            🎨
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-100 flex items-center gap-1.5">
                Interactive Board · {channelName}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Personal board
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Draw locally and post a snapshot to this conversation.
            </p>
          </div>
        </div>

        {/* Active Participants Pills */}
        <div className="hidden lg:flex items-center gap-1.5">
          {activeUsers.map((user, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300"
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: user.color }} />
              <span>{user.name}</span>
            </div>
          ))}
        </div>

        {/* Window controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setTheme(theme === 'chalkboard' ? 'whiteboard' : 'chalkboard')}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 border border-slate-700"
            title="Switch Theme"
          >
            <Palette size={13} />
            <span>{theme === 'chalkboard' ? 'Whiteboard' : 'Chalkboard'}</span>
          </button>
          <button
            onClick={handleShare}
            disabled={sharing}
            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm"
            title="Post Board Snapshot to Chat"
          >
            <Share2 size={13} />
            <span className="hidden sm:inline">{sharing?'Saving…':'Post to Chat'}</span>
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Download PNG"
          >
            <Download size={14} />
          </button>
          <button
            onClick={() => setFullScreen(!fullScreen)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            title="Toggle Fullscreen"
          >
            {fullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 border border-red-800"
            title="Close Board"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-2 overflow-x-auto text-xs">
        {/* Drawing Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setTool('pen')}
            className={`p-2 rounded-lg flex items-center gap-1 transition-all ${tool === 'pen' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800'
              }`}
            title="Chalk / Pen"
          >
            <Pen size={14} />
          </button>
          <button
            onClick={() => setTool('highlighter')}
            className={`p-2 rounded-lg flex items-center gap-1 transition-all ${tool === 'highlighter' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800'
              }`}
            title="Highlighter"
          >
            <Highlighter size={14} />
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`p-2 rounded-lg flex items-center gap-1 transition-all ${tool === 'eraser' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800'
              }`}
            title="Eraser"
          >
            <Eraser size={14} />
          </button>
          <span className="w-px h-5 bg-slate-800 mx-1" />
          <button
            onClick={() => setTool('rect')}
            className={`p-2 rounded-lg flex items-center gap-1 transition-all ${tool === 'rect' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800'
              }`}
            title="Rectangle"
          >
            <Square size={14} />
          </button>
          <button
            onClick={() => setTool('circle')}
            className={`p-2 rounded-lg flex items-center gap-1 transition-all ${tool === 'circle' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800'
              }`}
            title="Circle"
          >
            <Circle size={14} />
          </button>
          <button
            onClick={() => setTool('arrow')}
            className={`p-2 rounded-lg flex items-center gap-1 transition-all ${tool === 'arrow' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800'
              }`}
            title="Arrow"
          >
            <ArrowRight size={14} />
          </button>
          <button
            onClick={() => setTool('text')}
            className={`p-2 rounded-lg flex items-center gap-1 transition-all ${tool === 'text' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-800'
              }`}
            title="Text Annotate"
          >
            <Type size={14} />
          </button>
        </div>

        {/* Palette & Stroke */}
        <div className="flex items-center gap-3">
          {/* Colors */}
          <div className="flex items-center gap-1.5">
            {colors.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`w-5 h-5 rounded-full border-2 transition-transform ${color === c ? 'scale-125 border-emerald-400 shadow-md' : 'border-transparent'
                  }`}
              />
            ))}
          </div>

          <span className="w-px h-5 bg-slate-800" />

          {/* Stroke Width */}
          <div className="flex items-center gap-1">
            {[2, 4, 8].map((s) => (
              <button
                key={s}
                onClick={() => setSize(s)}
                className={`px-2 py-1 rounded text-[10px] font-bold ${size === s ? 'bg-slate-700 text-emerald-400' : 'text-slate-400 hover:bg-slate-800'
                  }`}
              >
                {s === 2 ? 'Fine' : s === 4 ? 'Med' : 'Bold'}
              </button>
            ))}
          </div>

          <span className="w-px h-5 bg-slate-800" />

          {/* Undo & Clear */}
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40"
            title="Undo"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={handleClear}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40"
            title="Clear Board"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      {shareError&&<p role="alert" className="p-3 text-red-300">{shareError}</p>}
      <div className="flex-1 relative overflow-hidden bg-slate-950 select-none">
        <canvas
          ref={canvasRef}
          onPointerDown={handleMouseDown}
          onPointerMove={handleMouseMove}
          onPointerUp={handleMouseUp}
          onPointerCancel={handleMouseUp}
          className="w-full h-full cursor-crosshair block touch-none"
        />

        {/* Text Annotation Input Modal Prompt */}
        {textInputPos && (
          <form
            onSubmit={handleTextSubmit}
            style={{ left: textInputPos.x, top: textInputPos.y }}
            className="absolute z-20 bg-slate-900 border border-emerald-500 p-2 rounded-xl shadow-2xl flex items-center gap-2"
          >
            <input
              type="text"
              autoFocus
              placeholder="Type notation / lesson notes..."
              value={currentText}
              onChange={(e) => setCurrentText(e.target.value)}
              className="px-2 py-1 bg-slate-950 text-white text-xs rounded border border-slate-700 outline-none w-52"
            />
            <button
              type="submit"
              className="px-2.5 py-1 bg-emerald-600 text-white rounded text-xs font-semibold"
            >
              Add
            </button>
            <button
              type="button"
              onClick={() => setTextInputPos(null)}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
