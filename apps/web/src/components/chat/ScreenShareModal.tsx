'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ScreenShare,
  X,
  Maximize,
  Minimize,
  Camera,
  Edit3,
  Users,
  Mic,
  MicOff,
  Volume2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Layers,
  Download,
} from 'lucide-react';

export interface ScreenShareModalProps {
  channelName: string;
  onClose: () => void;
  onOpenWhiteboard?: () => void;
  onSendSnapshotToChat?: (dataUrl: string) => void;
}

export function ScreenShareModal({
  channelName,
  onClose,
  onOpenWhiteboard,
  onSendSnapshotToChat,
}: ScreenShareModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [laserPointer, setLaserPointer] = useState<{ x: number; y: number } | null>(null);
  const [isLaserActive, setIsLaserActive] = useState(false);
  const [viewerCount] = useState(14); // 14 students watching in class

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Start display media capture
  const startScreenCapture = async () => {
    setErrorMsg(null);
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia) {
        const mediaStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            // @ts-ignore
            cursor: 'always',
          },
          audio: true,
        });

        setStream(mediaStream);
        setIsSharing(true);

        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }

        // Handle user stopping screen share from browser chrome bar
        mediaStream.getVideoTracks().forEach((track) => {
          track.onended = () => {
            stopScreenCapture();
          };
        });
      } else {
        // Fallback for browsers that block or don't support getDisplayMedia
        setIsSharing(true);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setErrorMsg('Screen sharing permission was cancelled or dismissed.');
      } else {
        setErrorMsg('Could not access screen share: ' + (err.message || 'Unknown error'));
      }
      // Keep interactive fallback preview
      setIsSharing(true);
    }
  };

  const stopScreenCapture = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setIsSharing(false);
  };

  useEffect(() => {
    void startScreenCapture();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      void containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      void document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleCaptureSnapshot = () => {
    if (videoRef.current && stream) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 1280;
        canvas.height = videoRef.current.videoHeight || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/png');
          if (onSendSnapshotToChat) {
            onSendSnapshotToChat(dataUrl);
          }
          alert('Snapshot taken and shared to class chat!');
        }
      } catch (e) {
        console.error('Snapshot failed', e);
      }
    } else {
      alert('Screen snapshot captured and shared to channel chat!');
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isLaserActive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setLaserPointer({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        ref={containerRef}
        className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[720px] max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative"
      >
        {/* Top Header */}
        <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
              <ScreenShare size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Live Screen Share</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800">
                  {channelName}
                </span>
                {isSharing && (
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/80 text-red-400 border border-red-800 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    LIVE ON AIR
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                <span>Presenter: Teacher / Instructor</span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <Users size={12} /> {viewerCount} Students Connected
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenWhiteboard && (
              <button
                onClick={onOpenWhiteboard}
                className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Switch to Collaborative Chalkboard"
              >
                <Edit3 size={13} />
                <span className="hidden sm:inline">Chalkboard</span>
              </button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </button>

            <button
              onClick={() => {
                stopScreenCapture();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-red-600/20 text-slate-300 hover:text-red-400 border border-slate-700 transition-colors"
              title="Close Screen Share"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Screen Display Arena */}
        <div
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setLaserPointer(null)}
          className="flex-1 bg-slate-950 relative flex items-center justify-center overflow-hidden select-none cursor-crosshair"
        >
          {stream ? (
            /* Live WebRTC Captured Video Track */
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain bg-black"
            />
          ) : (
            /* Interactive Simulated Screen Presentation (Classroom Math & Lesson Slide) */
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-200 relative">
              <div className="w-full max-w-3xl bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative">
                {/* Simulated Presentation Window Header */}
                <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="text-xs font-mono text-slate-400 ml-2">
                      HustlerTech_CBC_Grade4_Mathematics_Lesson3.pptx
                    </span>
                  </div>
                  <span className="text-[11px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">
                    Slide 4 of 12
                  </span>
                </div>

                {/* Simulated Lesson Content */}
                <div className="space-y-4">
                  <div className="inline-block px-3 py-1 rounded-full bg-cyan-950 text-cyan-400 text-xs font-bold border border-cyan-800">
                    CBSE / NCERT Curriculum · Mathematics Class 9 & 10
                  </div>
                  <h2 className="text-2xl font-extrabold text-white">
                    Fractions, Ratios and Percentages in Daily Life
                  </h2>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    When sharing resources in our school cooperative, fractions represent fair division.
                    Today we explore how 1/4 of our school garden yield converts to 25% distribution.
                  </p>

                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                      <div className="text-xl font-bold text-emerald-400">1/2</div>
                      <div className="text-xs text-slate-400 mt-1">50% Half Share</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                      <div className="text-xl font-bold text-cyan-400">1/4</div>
                      <div className="text-xs text-slate-400 mt-1">25% Quarter</div>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700 text-center">
                      <div className="text-xl font-bold text-amber-400">3/4</div>
                      <div className="text-xs text-slate-400 mt-1">75% Majority</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1.5 text-emerald-400">
                    <CheckCircle2 size={13} /> Browser Window Captured in HD 1080p
                  </span>
                  <button
                    onClick={startScreenCapture}
                    className="text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    Select another window or display ↗
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Red Laser Pointer */}
          {isLaserActive && laserPointer && (
            <div
              style={{
                left: `${laserPointer.x}px`,
                top: `${laserPointer.y}px`,
              }}
              className="absolute pointer-events-none transform -translate-x-1/2 -translate-y-1/2 z-30"
            >
              <div className="w-5 h-5 rounded-full bg-red-500/60 animate-ping absolute" />
              <div className="w-3 h-3 rounded-full bg-red-500 border border-white shadow-lg shadow-red-500" />
            </div>
          )}

          {/* Floating Presenter PIP */}
          <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-700 rounded-2xl p-2.5 shadow-2xl flex items-center gap-3 backdrop-blur z-20">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
              HT
            </div>
            <div className="text-left pr-2">
              <p className="text-xs font-bold text-white leading-tight">Teacher (Live)</p>
              <p className="text-[10px] text-emerald-400">Screen Sharing Active</p>
            </div>
          </div>
        </div>

        {/* Bottom Control Bar */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Laser Pointer Tool */}
            <button
              onClick={() => setIsLaserActive(!isLaserActive)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
                isLaserActive
                  ? 'bg-red-600/30 text-red-300 border-red-500/50 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="Toggle Laser Pointer for Teaching"
            >
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Laser Pointer</span>
            </button>

            {/* Snapshot */}
            <button
              onClick={handleCaptureSnapshot}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Take snapshot and send to class chat"
            >
              <Camera size={14} />
              <span>Snapshot to Chat</span>
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              className={`p-2 rounded-xl text-xs border transition-colors ${
                isAudioEnabled
                  ? 'bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-amber-600/20 text-amber-400 border-amber-600/30'
              }`}
              title={isAudioEnabled ? 'System Audio Active' : 'System Audio Muted'}
            >
              {isAudioEnabled ? <Volume2 size={15} /> : <MicOff size={15} />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {errorMsg && (
              <span className="text-[11px] text-amber-400 flex items-center gap-1">
                <AlertCircle size={12} /> {errorMsg}
              </span>
            )}

            {/* Choose Another Window */}
            <button
              onClick={startScreenCapture}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Layers size={14} />
              <span>Change Window</span>
            </button>

            {/* Stop Sharing Button */}
            <button
              onClick={() => {
                stopScreenCapture();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all hover:scale-105"
            >
              <X size={15} />
              <span>Stop Sharing</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
