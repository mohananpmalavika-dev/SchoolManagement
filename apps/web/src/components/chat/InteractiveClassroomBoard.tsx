'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import type {BoardState,LiveMember} from '@/lib/collaboration-client';
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
  shared?: {board:BoardState;members:LiveMember[];ready:boolean;canManage:boolean;onOperation:(operation:Record<string,unknown>)=>Promise<void>};
}

type ToolType = 'pen' | 'highlighter' | 'eraser' | 'rect' | 'circle' | 'arrow' | 'text';
type BoardTheme = 'chalkboard' | 'whiteboard';
const BOARD_WIDTH=1200, BOARD_HEIGHT=700;

interface DrawAction {
  id:string;
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
  shared,
}: BoardProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [localTheme, setTheme] = useState<BoardTheme>('chalkboard');
  const theme=shared?.board.theme||localTheme;
  const [tool, setTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<string>('#ffffff');
  const [size, setSize] = useState<number>(4);
  // Remote theme changes must also keep the next stroke visible on each participant's board.
  useEffect(() => {
    setColor((current) => theme === 'whiteboard' && current === '#ffffff'
      ? '#1e293b' : theme === 'chalkboard' && current === '#1e293b' ? '#ffffff' : current);
  }, [theme]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [localHistory, setHistory] = useState<DrawAction[]>([]);
  const [draft,setDraft]=useState<DrawAction|null>(null);
  const draftRef=useRef<DrawAction|null>(null);
  const [syncing,setSyncing]=useState(false);
  const [syncError,setSyncError]=useState('');
  const history:DrawAction[]=shared?[...shared.board.actions as DrawAction[],...(draft&&!shared.board.actions.some(a=>a.id===draft.id)?[draft]:[])]:localHistory;
  const activeUsers=shared?shared.members.map(m=>({...m,color:'#10b981'})):[{name:userName,role:userRole,color:'#10b981'}];
  const [sharing,setSharing]=useState(false);
  const [shareError,setShareError]=useState('');
  const [fullScreen, setFullScreen] = useState(false);
  const [currentText, setCurrentText] = useState('');
  const [textInputPos, setTextInputPos] = useState<{ x: number; y: number; displayX:number; displayY:number } | null>(null);

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
      if (!action.points.length || action.points.length < 2 && ['rect','circle','arrow'].includes(action.tool)) continue;
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
        if(action.points.length===1)ctx.lineTo(action.points[0].x+0.01,action.points[0].y+0.01);
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
        const angle=Math.atan2(end.y-start.y,end.x-start.x), head=Math.max(12,action.size*3);
        ctx.moveTo(end.x-head*Math.cos(angle-Math.PI/6),end.y-head*Math.sin(angle-Math.PI/6));
        ctx.lineTo(end.x,end.y);
        ctx.lineTo(end.x-head*Math.cos(angle+Math.PI/6),end.y-head*Math.sin(angle+Math.PI/6));
        ctx.stroke();
      } else if (action.tool === 'text' && action.text) {
        ctx.font = `${action.size * 6}px sans-serif`;
        ctx.fillStyle = action.color;
        ctx.fillText(action.text, action.points[0].x, action.points[0].y);
      }

      ctx.restore();
    }
  }, [history, theme]);

  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas]);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scale=Math.min(rect.width/BOARD_WIDTH,rect.height/BOARD_HEIGHT);
    const displayX=e.clientX-rect.left,displayY=e.clientY-rect.top;
    const x=(displayX-(rect.width-BOARD_WIDTH*scale)/2)/scale;
    const y=(displayY-(rect.height-BOARD_HEIGHT*scale)/2)/scale;
    return scale>0&&x>=0&&x<=BOARD_WIDTH&&y>=0&&y<=BOARD_HEIGHT?{x,y,displayX,displayY}:null;
  };

  function makeAction(points:{x:number;y:number}[],text?:string):DrawAction {
    return {id:crypto.randomUUID(),tool:text?'text':tool,color,size,points,...(text?{text}:{}),author:userName,authorRole:userRole};
  }
  function updateDraft(action:DrawAction|null){draftRef.current=action;setDraft(action);}
  async function sendDraft(){
    const action=draftRef.current;
    if(!shared||!action||syncing)return;
    setSyncing(true);setSyncError('');
    try{await shared.onOperation({type:'stroke',stroke:action});updateDraft(null);}
    catch(error){setSyncError(error instanceof Error?error.message:'Drawing could not be saved. Retry your stroke.');}
    finally{setSyncing(false);}
  }
  async function operation(value:Record<string,unknown>){
    if(!shared||syncing||draftRef.current)return;
    setSyncing(true);setSyncError('');
    try{await shared.onOperation(value);}catch(error){setSyncError(error instanceof Error?error.message:'Board update failed.');}finally{setSyncing(false);}
  }
  const handleMouseDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if(!e.isPrimary||e.button!==0||shared&&(!shared.ready||syncing||draftRef.current))return;
    const coords=getCanvasCoords(e);if(!coords)return;
    e.currentTarget.setPointerCapture(e.pointerId);
    if(tool==='text'){setTextInputPos(coords);return;}
    setIsDrawing(true);
    const action=makeAction([{x:coords.x,y:coords.y}]);
    if(shared)updateDraft(action);else setHistory(prev=>[...prev,action]);
  };
  const handleMouseMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if(!isDrawing||!e.isPrimary)return;
    const coords=getCanvasCoords(e);if(!coords)return;
    const append=(last:DrawAction)=>{
      const points=last.points.length>=255?last.points.filter((_,i)=>i%2===0):last.points;
      return {...last,points:[...points,{x:coords.x,y:coords.y}]};
    };
    if(shared){if(draftRef.current)updateDraft(append(draftRef.current));}
    else setHistory(prev=>prev.length?[...prev.slice(0,-1),append(prev[prev.length-1])]:prev);
  };
  const handleMouseUp = () => {
    if(!isDrawing)return;
    setIsDrawing(false);
    if(shared)void sendDraft();
  };
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();if(!currentText.trim()||!textInputPos)return;
    const action=makeAction([{x:textInputPos.x,y:textInputPos.y}],currentText.trim());
    if(shared){if(!shared.ready||syncing||draftRef.current)return;updateDraft(action);void sendDraft();}
    else setHistory(prev=>[...prev,action]);
    setCurrentText('');setTextInputPos(null);
  };
  const handleUndo = () => {
    if(shared)void operation({type:'undo'});else setHistory(prev=>prev.slice(0,-1));
  };
  const handleClear = () => {
    if(confirm(shared?'Clear the shared board for everyone? Save a snapshot first.':'Clear your board? Download it first if you need a copy.')){
      if(shared)void operation({type:'clear'});else setHistory([]);
    }
  };
  const changeTheme=()=>{
    const next=theme==='chalkboard'?'whiteboard':'chalkboard';
    if(shared)void operation({type:'theme',theme:next});else setTheme(next);
    setColor(next==='whiteboard'?'#1e293b':'#ffffff');
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
                {shared?'Shared board':'Personal board'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              {shared?'Draw together with members of this conversation. Strokes save when you lift your pointer.':'Draw locally and post a snapshot to this conversation.'}
            </p>
          </div>
        </div>

        {/* Active Participants Pills */}
        <div className="hidden lg:flex flex-wrap items-center gap-1.5">
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
            onClick={changeTheme}
            disabled={!!shared&&(!shared.canManage||!shared.ready||syncing||!!draft)}
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
            disabled={history.length === 0||isDrawing||!!shared&&(!shared.ready||syncing||!!draft)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40"
            title="Undo"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={handleClear}
            disabled={isDrawing||!!shared&&(!shared.canManage||!shared.ready||syncing||!!draft)}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40"
            title="Clear Board"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      {syncError&&<div role="alert" className="p-3 text-red-300">{syncError}{draft&&<><button className="underline ml-3" disabled={syncing||!shared?.ready} onClick={()=>void sendDraft()}>Retry stroke</button><button className="underline ml-3" disabled={syncing} onClick={()=>{updateDraft(null);setSyncError('');}}>Discard unsaved stroke</button></>}</div>}
      {syncing&&<p role="status" className="p-2 text-xs text-emerald-300">Saving board change?</p>}
      {shareError&&<p role="alert" className="p-3 text-red-300">{shareError}</p>}
      <div className="flex-1 relative overflow-hidden bg-slate-950 select-none">
        <canvas
          ref={canvasRef}
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          aria-label={shared?'Shared drawing board':'Personal drawing board'}
          onPointerDown={handleMouseDown}
          onPointerMove={handleMouseMove}
          onPointerUp={handleMouseUp}
          onPointerCancel={handleMouseUp}
          className="w-full h-full object-contain cursor-crosshair block touch-none"
        />

        {/* Text Annotation Input Modal Prompt */}
        {textInputPos && (
          <form
            onSubmit={handleTextSubmit}
            style={{ left: `min(${textInputPos.displayX}px, max(0px, calc(100% - 320px)))`, top: textInputPos.displayY, maxWidth:'100%' }}
            className="absolute z-20 bg-slate-900 border border-emerald-500 p-2 rounded-xl shadow-2xl flex items-center gap-2"
          >
            <input
              type="text"
              autoFocus
              maxLength={500}
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
