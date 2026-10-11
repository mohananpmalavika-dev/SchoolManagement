'use client';

import React, { useState, useEffect } from 'react';
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Share2,
  Maximize2,
  Minimize2,
  Users,
  Sparkles,
  Edit3,
} from 'lucide-react';

export interface ChatCallModalProps {
  channelName: string;
  callType: 'audio' | 'video';
  onEndCall: () => void;
  onOpenWhiteboard?: () => void;
  onOpenScreenShare?: () => void;
}

export function ChatCallModal({
  channelName,
  callType,
  onEndCall,
  onOpenWhiteboard,
  onOpenScreenShare,
}: ChatCallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'RINGING' | 'CONNECTED'>('RINGING');
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Ringing to connected transition
  useEffect(() => {
    const timer = setTimeout(() => {
      setCallStatus('CONNECTED');
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Duration timer
  useEffect(() => {
    if (callStatus !== 'CONNECTED') return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col h-[650px] relative">
        {/* Call Header */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              {callType === 'video' ? <Video size={18} /> : <Phone size={18} />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                {channelName}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800">
                  {callType === 'video' ? 'HD Video Call' : 'Encrypted Voice Call'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">
                {callStatus === 'RINGING' ? (
                  <span className="text-amber-400 animate-pulse">Connecting participants...</span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Connected · {formatDuration(callDuration)}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenScreenShare && (
              <button
                onClick={onOpenScreenShare}
                className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                title="Launch Live Screen Share"
              >
                <Share2 size={14} />
                <span>Screen Share</span>
              </button>
            )}

            {/* Quick Whiteboard Launcher inside Call */}
            {onOpenWhiteboard && (
              <button
                onClick={onOpenWhiteboard}
                className="px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Edit3 size={14} />
                <span>Classroom Board</span>
              </button>
            )}
          </div>
        </div>

        {/* Call Stage Area */}
        <div className="flex-1 bg-slate-950 p-6 flex items-center justify-center relative overflow-hidden">
          {isScreenSharing ? (
            /* Screen Sharing Presenter View inside Call */
            <div className="w-full h-full flex flex-col items-center justify-center relative bg-slate-900 rounded-2xl border border-cyan-800/60 p-6 overflow-hidden">
              <div className="w-full max-w-2xl bg-slate-950/90 border border-cyan-500/30 rounded-xl p-6 shadow-2xl relative">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-xs font-bold text-white">Live Screen Broadcast</span>
                    <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded border border-cyan-800">
                      1080p 60fps
                    </span>
                  </div>
                  <button
                    onClick={() => setIsScreenSharing(false)}
                    className="text-xs text-red-400 hover:text-red-300 hover:underline"
                  >
                    Stop Share
                  </button>
                </div>
                <div className="space-y-3">
                  <h4 className="text-lg font-bold text-white">
                    Kenya CBC Curriculum · Mathematics Form 1 & 4
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Lesson Slides: Fractions, Ratios and Percentages in Daily Life.
                    Broadcasting live desktop slides to all student and parent participants.
                  </p>
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                      <div className="text-sm font-bold text-emerald-400">1/2</div>
                      <div className="text-[10px] text-slate-400">50% Half</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                      <div className="text-sm font-bold text-cyan-400">1/4</div>
                      <div className="text-[10px] text-slate-400">25% Quarter</div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                      <div className="text-sm font-bold text-amber-400">3/4</div>
                      <div className="text-[10px] text-slate-400">75% Majority</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Presenter PIP corner badge */}
              <div className="absolute bottom-4 right-4 bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-[11px] font-semibold text-slate-200">Presenter: Teacher</span>
              </div>
            </div>
          ) : callType === 'video' && !isVideoOff ? (
            /* Video Call Screen Layout */
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4 relative">
              {/* Remote Teacher/Class Stream */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 relative overflow-hidden group">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-700 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-emerald-500/20 mb-3">
                  🎓
                </div>
                <h4 className="text-sm font-bold text-white">Teacher Stream (Classroom 4A)</h4>
                <p className="text-xs text-slate-400">Live Video 1080p · 60fps</p>
                <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-md text-[10px] text-white flex items-center gap-1.5 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Mrs. Wanjiku (Teacher)
                </div>
              </div>

              {/* Remote Student / Children Stream */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-700 flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-indigo-500/20 mb-3">
                  🧒
                </div>
                <h4 className="text-sm font-bold text-white">Children & Parents Stream</h4>
                <p className="text-xs text-slate-400">Connected via Student Portal</p>
                <div className="absolute bottom-3 left-3 bg-black/60 px-2.5 py-1 rounded-md text-[10px] text-white flex items-center gap-1.5 backdrop-blur-sm">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Kevin & Faith (Students)
                </div>
              </div>

              {/* PiP Local Camera Preview */}
              <div className="absolute top-4 right-4 w-40 h-28 bg-slate-800 border-2 border-emerald-500 rounded-xl overflow-hidden shadow-2xl flex flex-col items-center justify-center text-center p-2 z-20">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold mb-1">
                  You
                </div>
                <span className="text-[10px] text-slate-200 font-semibold truncate">
                  Your Camera (Live)
                </span>
              </div>
            </div>
          ) : (
            /* Audio Voice Call Waveform Layout */
            <div className="flex flex-col items-center justify-center text-center max-w-sm space-y-5">
              <div className="relative">
                <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-600 flex items-center justify-center text-4xl text-white shadow-2xl shadow-emerald-500/30 ring-8 ring-emerald-500/10 animate-pulse">
                  🎙️
                </div>
                <span className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center text-white text-xs">
                  ✓
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">{channelName}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Active audio bridge between Teacher and Children
                </p>
              </div>

              {/* Audio Waveform visualization */}
              <div className="flex items-center gap-1.5 h-10 px-4">
                {[18, 36, 24, 40, 20, 32, 16, 28, 38, 22, 14, 34].map((height, i) => (
                  <div
                    key={i}
                    style={{ height: `${height}px` }}
                    className="w-1.5 bg-gradient-to-t from-emerald-500 to-teal-300 rounded-full animate-pulse"
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Call Controls Toolbar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-center gap-4">
          {/* Mute Mic */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className={`p-3.5 rounded-full transition-all ${
              isMuted
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {/* Toggle Video */}
          <button
            onClick={() => setIsVideoOff(!isVideoOff)}
            className={`p-3.5 rounded-full transition-all ${
              isVideoOff
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
          </button>

          {/* Screen Share */}
          <button
            onClick={() => {
              if (onOpenScreenShare) {
                onOpenScreenShare();
              } else {
                setIsScreenSharing(!isScreenSharing);
              }
            }}
            className={`p-3.5 rounded-full transition-all ${
              isScreenSharing
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Share Screen / Lesson Slides"
          >
            <Share2 size={20} />
          </button>

          {/* Speaker Mute */}
          <button
            onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
            className={`p-3.5 rounded-full transition-all ${
              isSpeakerMuted
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title="Speaker Volume"
          >
            {isSpeakerMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>

          {/* Hang Up (End Call) */}
          <button
            onClick={onEndCall}
            className="px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-red-600/40 transition-all hover:scale-105"
          >
            <PhoneOff size={18} />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  );
}
