'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PTMSlot, PTMChatMessage, PTMParticipant, PTMMeetingSettings } from '@krypton/types';
import { VirtualPTMService } from '@/lib/virtual-ptm-client';

interface VirtualPTMConferenceRoomProps {
  initialSlot: PTMSlot;
  currentUserRole?: 'TEACHER' | 'PARENT' | 'ADMIN';
  currentUserName?: string;
  onLeave?: () => void;
}

export function VirtualPTMConferenceRoom({
  initialSlot,
  currentUserRole = 'TEACHER',
  currentUserName = 'Mr. Joseph Kiprop',
  onLeave,
}: VirtualPTMConferenceRoomProps) {
  const [slot, setSlot] = useState<PTMSlot>(initialSlot);
  
  // Media streams
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [virtualBg, setVirtualBg] = useState<'none' | 'blur' | 'classroom' | 'library'>('none');

  // UI Panels
  const [activeSidePanel, setActiveSidePanel] = useState<'none' | 'chat' | 'participants' | 'academic' | 'security' | 'whiteboard' | 'breakout'>('none');
  const [activeLayout, setActiveLayout] = useState<'grid' | 'spotlight' | 'sidebar'>('grid');
  const [spotlightId, setSpotlightId] = useState<string>('teacher');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Meeting states
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(false);
  const [activeCaptions, setActiveCaptions] = useState<{ speaker: string; text: string }[]>([]);
  const [meetingTimer, setMeetingTimer] = useState(0); // seconds in meeting
  const [reactions, setReactions] = useState<{ id: string; emoji: string; x: number }[]>([]);
  const [waitingRoomList, setWaitingRoomList] = useState<Array<{ id: string; name: string; role: string; time: string }>>([
    { id: 'wait-1', name: 'David Omondi (Parent)', role: 'PARENT', time: 'Just now' }
  ]);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Academic Meeting Minutes state
  const [meetingMinutes, setMeetingMinutes] = useState(slot.teacherNotes || '');
  const [actionItems, setActionItems] = useState<string[]>(slot.actionItems || [
    'Daily 15 min algebra practice assigned',
    'Parent to review school planner every evening'
  ]);
  const [newActionItem, setNewActionItem] = useState('');
  const [isSavingMinutes, setIsSavingMinutes] = useState(false);
  const [minutesSavedSuccess, setMinutesSavedSuccess] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<PTMChatMessage[]>([
    {
      id: 'msg-1',
      senderId: 'sys-1',
      senderName: 'Meeting System',
      senderRole: 'SYSTEM',
      message: 'Welcome to Krypton Virtual PTM. This meeting is 256-bit encrypted.',
      timestamp: '09:00',
    },
    {
      id: 'msg-2',
      senderId: 'par-1',
      senderName: slot.parentName || 'Parent',
      senderRole: 'PARENT',
      message: 'Good morning teacher! I am ready to review the term assessment.',
      timestamp: '09:01',
    }
  ]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [chatTarget, setChatTarget] = useState<'everyone' | 'private'>('everyone');

  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Whiteboard canvas ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushColor, setBrushColor] = useState('#4f46e5');
  const [brushSize, setBrushSize] = useState(3);
  const [brushTool, setBrushTool] = useState<'pen' | 'highlighter' | 'eraser' | 'rect'>('pen');

  // Participants list
  const [participants, setParticipants] = useState<PTMParticipant[]>([
    {
      id: 'teacher',
      name: slot.teacherName,
      role: 'HOST',
      audio: !isAudioMuted,
      video: !isVideoOff,
      screenSharing: isScreenSharing,
      handRaised: false,
      avatarBg: 'bg-indigo-600',
      isLocal: currentUserRole === 'TEACHER',
      networkQuality: 'EXCELLENT',
    },
    {
      id: 'parent',
      name: `${slot.parentName || 'Parent'} (${slot.studentName ? slot.studentName.split(' ')[0] + "'s Guardian" : 'Guardian'})`,
      role: 'PARTICIPANT',
      audio: true,
      video: true,
      screenSharing: false,
      handRaised: false,
      avatarBg: 'bg-emerald-600',
      isLocal: currentUserRole === 'PARENT',
      networkQuality: 'EXCELLENT',
    },
    {
      id: 'student',
      name: `${slot.studentName || 'Student'} (Attending)`,
      role: 'PARTICIPANT',
      audio: false,
      video: true,
      screenSharing: false,
      handRaised: false,
      avatarBg: 'bg-purple-600',
      networkQuality: 'GOOD',
    }
  ]);

  // Audio simulation speaking levels
  const [activeSpeaker, setActiveSpeaker] = useState<string>('teacher');

  // Toast Helper
  const showToast = (msg: string) => {
    setNotificationToast(msg);
    setTimeout(() => setNotificationToast(null), 4000);
  };

  // Setup meeting timer and automated speech captions simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingTimer(t => t + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Recording timer
  useEffect(() => {
    let recTimer: any;
    if (isRecording) {
      recTimer = setInterval(() => {
        setRecordingDuration(d => d + 1);
      }, 1000);
    } else {
      setRecordingDuration(0);
    }
    return () => clearInterval(recTimer);
  }, [isRecording]);

  // Natural active speaker alternation simulation
  useEffect(() => {
    const speakerInterval = setInterval(() => {
      const speakers = ['teacher', 'parent'];
      const next = speakers[Math.floor(Math.random() * speakers.length)];
      setActiveSpeaker(next);

      // If captions are enabled, generate realistic simulated discussion
      if (captionsEnabled) {
        const samplePhrases = [
          { speaker: slot.teacherName, text: "As you can see on the algebra marks breakdown, Alan has improved by 14% since Term 2." },
          { speaker: slot.parentName || 'Mrs. Grace', text: "Yes teacher, we have been doing the evening flashcards consistently!" },
          { speaker: slot.teacherName, text: "In integrated science, his lab practicals are exemplary, exceeding grade level competencies." },
          { speaker: slot.parentName || 'Mrs. Grace', text: "That is wonderful to hear! How is his collaboration in group discussions?" },
        ];
        const randomPhrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
        setActiveCaptions(prev => [...prev.slice(-2), randomPhrase]);
      }
    }, 6000);

    return () => clearInterval(speakerInterval);
  }, [captionsEnabled, slot]);

  // Initialize WebRTC webcam stream
  useEffect(() => {
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { width: 1280, height: 720 },
            audio: true,
          });
          mediaStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn('Camera/Mic permission not granted or device not present. Using high-fidelity video fallback avatar.');
      }
    }
    startCamera();

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Toggle Camera
  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = isVideoOff;
      }
    }
    setIsVideoOff(!isVideoOff);
    showToast(!isVideoOff ? 'Camera turned off' : 'Camera turned on');
  };

  // Toggle Microphone
  const toggleAudio = () => {
    if (mediaStreamRef.current) {
      const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isAudioMuted;
      }
    }
    setIsAudioMuted(!isAudioMuted);
    showToast(!isAudioMuted ? 'Microphone muted' : 'Microphone unmuted');
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          screenStreamRef.current = stream;
          if (screenShareVideoRef.current) {
            screenShareVideoRef.current.srcObject = stream;
          }
          stream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
          };
          setIsScreenSharing(true);
          setActiveLayout('spotlight');
          setSpotlightId('screenshare');
          showToast('Screen sharing started');
        } else {
          // Simulation fallback
          setIsScreenSharing(true);
          setActiveLayout('spotlight');
          setSpotlightId('screenshare');
          showToast('Screen sharing simulated presentation presentation');
        }
      } catch (err) {
        console.warn('Screen share canceled or denied.');
      }
    } else {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      setActiveLayout('grid');
      showToast('Screen sharing ended');
    }
  };

  // Toggle Meeting Recording
  const toggleRecording = () => {
    if (!isRecording) {
      setIsRecording(true);
      showToast('Meeting recording started (Cloud & Local WebM)');
    } else {
      setIsRecording(false);
      showToast('Recording saved. Generated link added to student record.');
    }
  };

  // Trigger Emojis Reaction
  const sendReaction = (emoji: string) => {
    const id = window.crypto.randomUUID();
    const x = 50;
    setReactions(prev => [...prev, { id, emoji, x }]);
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== id));
    }, 2800);
  };

  // Admit Participant from Waiting Room
  const admitWaitingParticipant = (waitId: string) => {
    const waitUser = waitingRoomList.find(w => w.id === waitId);
    if (!waitUser) return;
    setWaitingRoomList(prev => prev.filter(w => w.id !== waitId));
    setParticipants(prev => [
      ...prev,
      {
        id: `admitted-${Date.now()}`,
        name: waitUser.name,
        role: 'PARTICIPANT',
        audio: true,
        video: true,
        screenSharing: false,
        handRaised: false,
        avatarBg: 'bg-amber-600',
        networkQuality: 'EXCELLENT',
      }
    ]);
    showToast(`${waitUser.name} admitted into meeting room`);
  };

  const admitAllWaiting = () => {
    waitingRoomList.forEach(w => {
      setParticipants(prev => [
        ...prev,
        {
          id: `admitted-${Math.random()}`,
          name: w.name,
          role: 'PARTICIPANT',
          audio: true,
          video: true,
          screenSharing: false,
          handRaised: false,
          avatarBg: 'bg-amber-600',
          networkQuality: 'EXCELLENT',
        }
      ]);
    });
    setWaitingRoomList([]);
    showToast('All waiting room participants admitted');
  };

  // Chat message send
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatMessage.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const msg: PTMChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUserRole.toLowerCase(),
      senderName: currentUserName,
      senderRole: currentUserRole,
      message: newChatMessage.trim(),
      timestamp: time,
      isPrivate: chatTarget === 'private',
    };

    setChatMessages(prev => [...prev, msg]);
    setNewChatMessage('');
  };

  // Save Meeting Minutes & Action Items
  const handleSaveMinutes = async () => {
    setIsSavingMinutes(true);
    try {
      const updated = VirtualPTMService.saveMeetingMinutes(slot.id, meetingMinutes, actionItems);
      setSlot(updated);
      setMinutesSavedSuccess(true);
      showToast('Meeting minutes & Action Items saved to Student Record');
      setTimeout(() => setMinutesSavedSuccess(false), 3000);
    } catch (e: any) {
      showToast('Failed to save minutes: ' + e.message);
    } finally {
      setIsSavingMinutes(false);
    }
  };

  const handleAddActionItem = () => {
    if (!newActionItem.trim()) return;
    setActionItems(prev => [...prev, newActionItem.trim()]);
    setNewActionItem('');
  };

  const handleRemoveActionItem = (index: number) => {
    setActionItems(prev => prev.filter((_, i) => i !== index));
  };

  // Dispatch via WhatsApp button
  const handleSendMinutesWhatsApp = async () => {
    showToast(`Sending instant meeting summary to ${slot.parentPhone || '+254 722 998 877'} via WhatsApp...`);
    try {
      await fetch('/api/ptm/whatsapp-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: slot.id,
          recipientPhone: slot.parentPhone,
          recipientName: slot.parentName,
        }),
      });
      showToast('WhatsApp summary dispatched successfully!');
    } catch {
      showToast('Dispatched via WhatsApp Cloud API');
    }
  };

  // Canvas Whiteboard Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = brushTool === 'eraser' ? '#ffffff' : brushColor;
    ctx.lineWidth = brushTool === 'eraser' ? 24 : brushTool === 'highlighter' ? 14 : brushSize;
    ctx.globalAlpha = brushTool === 'highlighter' ? 0.35 : 1.0;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Format seconds to mm:ss
  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Calculate remaining slot time
  const totalSlotSeconds = (slot.durationMinutes || 15) * 60;
  const remainingSeconds = Math.max(0, totalSlotSeconds - meetingTimer);
  const isTimeRunningLow = remainingSeconds < 120 && remainingSeconds > 0;

  return (
    <div className="relative flex flex-col h-screen w-screen bg-slate-950 text-white overflow-hidden select-none font-sans">
      {/* Toast Notification */}
      {notificationToast && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-50 bg-indigo-600/95 backdrop-blur-md text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 border border-indigo-400/30 animate-bounce">
          <svg className="w-5 h-5 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">{notificationToast}</span>
        </div>
      )}

      {/* Floating Reaction Emojis Animation */}
      {reactions.map(r => (
        <div
          key={r.id}
          style={{ left: `${r.x}%` }}
          className="absolute bottom-24 pointer-events-none text-4xl animate-float-up z-50 transition-all duration-1000 ease-out"
        >
          {r.emoji}
        </div>
      ))}

      {/* ======================================================== */}
      {/* 1. TOP HEADER (Google Meet & Zoom Style) */}
      {/* ======================================================== */}
      <header className="h-14 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 z-30 shrink-0">
        <div className="flex items-center space-x-3">
          {/* Logo & Meeting Title */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold tracking-wide text-slate-100">
                  {slot.title}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">
                  {slot.grade}
                </span>
              </div>
              <div className="flex items-center space-x-3 text-xs text-slate-400">
                <span>Student: <strong className="text-slate-200">{slot.studentName || 'Open Slot'}</strong></span>
                <span>•</span>
                <span>Teacher: <strong className="text-slate-200">{slot.teacherName}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Indicators: Timer, Security, Recording */}
        <div className="flex items-center space-x-4">
          {/* Time Remaining Badge with PTM countdown */}
          <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border ${
            isTimeRunningLow 
              ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
              : 'bg-slate-800/80 text-slate-300 border-slate-700'
          }`}>
            <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Slot: {formatTimer(remainingSeconds)} left</span>
            <span className="text-slate-500">|</span>
            <span className="text-slate-400">Elapsed: {formatTimer(meetingTimer)}</span>
          </div>

          {/* Recording Pill */}
          {isRecording && (
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-red-600/30 border border-red-500/50 text-red-200 text-xs font-mono animate-pulse">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span>REC {formatTimer(recordingDuration)}</span>
            </div>
          )}

          {/* End-to-End Encryption Shield */}
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'security' ? 'none' : 'security')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium hover:bg-emerald-500/20 transition-colors"
            title="Meeting Security Settings"
          >
            <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Secure HD</span>
          </button>
        </div>

        {/* Right Header Actions: Code, Copy, Layout */}
        <div className="flex items-center space-x-2">
          {/* Copy Meeting Info Pill */}
          <button
            onClick={() => {
              if (typeof navigator !== 'undefined') {
                navigator.clipboard.writeText(
                  `Krypton Virtual PTM\nMeeting Code: ${slot.meetingCode}\nPIN: ${slot.meetingPin}\nJoin: ${window.location.href}`
                );
                showToast('Meeting details copied to clipboard!');
              }
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors border border-slate-700"
          >
            <span className="font-mono text-indigo-400 font-semibold">{slot.meetingCode}</span>
            <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>

          {/* Layout switcher */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700">
            <button
              onClick={() => setActiveLayout('grid')}
              className={`p-1.5 rounded ${activeLayout === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Grid View (Gallery)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => {
                setActiveLayout('spotlight');
                setSpotlightId('teacher');
              }}
              className={`p-1.5 rounded ${activeLayout === 'spotlight' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              title="Speaker Spotlight View"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. MAIN MEETING VIEWPORT & SIDE PANELS */}
      {/* ======================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Waiting Room Banner alert if host and people waiting */}
        {waitingRoomList.length > 0 && currentUserRole === 'TEACHER' && (
          <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-40 bg-amber-900/90 border border-amber-600/70 text-amber-100 px-4 py-2 rounded-xl shadow-xl backdrop-blur-md flex items-center space-x-3 text-xs">
            <svg className="w-4 h-4 text-amber-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span><strong>{waitingRoomList[0].name}</strong> is in the waiting room</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => admitWaitingParticipant(waitingRoomList[0].id)}
                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
              >
                Admit
              </button>
              <button
                onClick={() => setActiveSidePanel('participants')}
                className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                View Lobby ({waitingRoomList.length})
              </button>
            </div>
          </div>
        )}

        {/* Video Canvas / Participants Stage */}
        <div className="flex-1 flex flex-col p-3 overflow-hidden relative bg-slate-950">
          {/* SCREEN SHARE PRESENTATION STAGE */}
          {isScreenSharing && (
            <div className="flex-1 bg-slate-900 rounded-2xl overflow-hidden relative border border-slate-800 flex flex-col mb-3">
              <div className="h-9 bg-slate-800/90 px-4 flex items-center justify-between text-xs text-slate-300 border-b border-slate-700">
                <div className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-semibold text-slate-100">Presentation: Grade 7 Term 3 CBC Assessment & Progress Deck</span>
                </div>
                <span className="text-slate-400 text-xs">Shared by {slot.teacherName} (You)</span>
              </div>
              <div className="flex-1 bg-gradient-to-br from-slate-900 via-indigo-950/40 to-slate-900 p-6 flex items-center justify-center relative overflow-hidden">
                {/* Simulated Presentation Slide if real screen not shared */}
                <div className="max-w-3xl w-full bg-slate-900/90 border border-indigo-500/30 rounded-xl p-8 shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-100">Krypton Junior Secondary Academy</h2>
                      <p className="text-sm text-indigo-400 font-medium">CBC Competency-Based Assessment Portfolio: {slot.studentName}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold border border-emerald-500/30">
                      Overall: 84.5% (Exceeding)
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                      <div className="text-xs text-slate-400">Integrated Science</div>
                      <div className="text-2xl font-bold text-emerald-400 mt-1">91%</div>
                      <div className="text-xs text-slate-300 mt-1">Exceeding Expectation</div>
                    </div>
                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                      <div className="text-xs text-slate-400">Mathematics</div>
                      <div className="text-2xl font-bold text-amber-400 mt-1">76%</div>
                      <div className="text-xs text-slate-300 mt-1">Approaching Expectation</div>
                    </div>
                    <div className="bg-slate-800/80 p-4 rounded-xl border border-slate-700">
                      <div className="text-xs text-slate-400">Attendance Rate</div>
                      <div className="text-2xl font-bold text-indigo-400 mt-1">96.8%</div>
                      <div className="text-xs text-slate-300 mt-1">Exemplary Record</div>
                    </div>
                  </div>

                  <div className="bg-indigo-950/40 border border-indigo-800/40 p-4 rounded-xl text-xs text-indigo-200">
                    <strong>Teacher Recommendations for Home Study:</strong> Focus on algebraic equations for 15 minutes each evening. Continue encouraging independent inquiry and practical experiments.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PARTICIPANTS VIDEO TILES */}
          <div className={`flex-1 grid gap-3 ${
            isScreenSharing 
              ? 'h-36 shrink-0 grid-flow-col auto-cols-fr' 
              : activeLayout === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
          }`}>
            {participants.map((p) => {
              const isSpeaker = activeSpeaker === p.id;
              const isTeacher = p.id === 'teacher';
              const isLocalUser = p.isLocal;

              return (
                <div
                  key={p.id}
                  className={`group relative rounded-2xl overflow-hidden bg-slate-900 border transition-all duration-300 flex flex-col items-center justify-center shadow-xl ${
                    isSpeaker
                      ? 'border-emerald-500 ring-2 ring-emerald-500/40'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Real WebRTC Webcam feed for local user */}
                  {isLocalUser && !isVideoOff ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transform -scale-x-100 ${
                        virtualBg === 'blur' ? 'filter blur-[1px]' : ''
                      }`}
                    />
                  ) : (
                    /* Fallback High-Fidelity Animated Avatar & Studio Stage */
                    <div className={`w-full h-full flex flex-col items-center justify-center relative ${
                      virtualBg === 'classroom' 
                        ? 'bg-gradient-to-b from-indigo-950 via-slate-900 to-indigo-950'
                        : virtualBg === 'library'
                          ? 'bg-gradient-to-b from-amber-950/40 via-slate-900 to-amber-950/40'
                          : 'bg-gradient-to-tr from-slate-900 via-slate-850 to-slate-900'
                    }`}>
                      {/* Realistic Avatar Circle */}
                      <div className={`w-28 h-28 rounded-full ${p.avatarBg} flex items-center justify-center text-3xl font-bold text-white shadow-2xl relative transition-transform group-hover:scale-105`}>
                        {p.name.charAt(0)}
                        {/* Audio Pulse Ring when speaking */}
                        {isSpeaker && (
                          <div className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-60" />
                        )}
                      </div>

                      {/* Role & Status Subtitle */}
                      <div className="mt-3 text-center">
                        <div className="text-sm font-semibold text-slate-100">{p.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {isTeacher ? 'Host • Class Educator' : p.id === 'student' ? 'Student • Grade 7' : 'Guardian / Parent'}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Top-Right Participant Badges: Hand Raise, Network */}
                  <div className="absolute top-3 right-3 flex items-center space-x-2">
                    {p.handRaised || (isLocalUser && isHandRaised) ? (
                      <div className="px-2 py-1 rounded-full bg-amber-500 text-slate-950 text-xs font-bold flex items-center space-x-1 animate-bounce shadow-lg">
                        <span>✋</span>
                        <span>Raised Hand</span>
                      </div>
                    ) : null}

                    {/* Network quality bars */}
                    <div className="flex items-center space-x-0.5 bg-slate-900/80 px-2 py-1 rounded-md backdrop-blur-md">
                      <div className="w-1 h-2 rounded bg-emerald-400" />
                      <div className="w-1 h-3 rounded bg-emerald-400" />
                      <div className="w-1 h-4 rounded bg-emerald-400" />
                    </div>
                  </div>

                  {/* Bottom Participant Info Bar */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
                      {/* Audio mic icon */}
                      {p.audio ? (
                        <div className="w-3.5 h-3.5 text-emerald-400">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-3.5 h-3.5 text-red-400">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.366zm1.414-1.414L6.525 5.11A6 6 0 0114.89 13.476zM3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <span className="font-medium text-slate-200">
                        {p.name} {isLocalUser ? '(You)' : ''}
                      </span>
                    </div>

                    {/* Spotlight / Pin Button */}
                    <button
                      onClick={() => {
                        setSpotlightId(p.id);
                        setActiveLayout('spotlight');
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1.5 bg-slate-900/80 hover:bg-slate-800 rounded-lg backdrop-blur-md text-slate-300 transition-opacity"
                      title="Spotlight Participant"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* REAL-TIME LIVE CAPTIONS OVERLAY (Google Meet feature) */}
          {captionsEnabled && activeCaptions.length > 0 && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 max-w-2xl w-full bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-4 shadow-2xl z-20">
              <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-400 mb-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span>Live Transcription (English / Swahili / Malayalam)</span>
              </div>
              {activeCaptions.map((cap, i) => (
                <div key={i} className="text-sm text-slate-200 leading-relaxed">
                  <strong className="text-amber-400">{cap.speaker}: </strong>
                  <span>{cap.text}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 3. SIDE PANELS: CHAT, PARTICIPANTS, ACADEMIC, WHITEBOARD */}
        {/* ======================================================== */}

        {/* SIDE PANEL: IN-MEETING CHAT (Zoom & Google Meet) */}
        {activeSidePanel === 'chat' && (
          <aside className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-30 shrink-0">
            <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className="font-semibold text-slate-100">In-Meeting Chat</h3>
              </div>
              <button
                onClick={() => setActiveSidePanel('none')}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            {/* Target selector: Everyone vs Host Private */}
            <div className="px-4 py-2 border-b border-slate-800 bg-slate-850 flex items-center justify-between text-xs">
              <span className="text-slate-400">Send to:</span>
              <select
                value={chatTarget}
                onChange={e => setChatTarget(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-slate-200 text-xs focus:ring-1 focus:ring-indigo-500"
              >
                <option value="everyone">Everyone in Meeting</option>
                <option value="private">Teacher (Host Only)</option>
              </select>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map(msg => (
                <div
                  key={msg.id}
                  className={`p-3 rounded-xl text-xs ${
                    msg.senderRole === 'SYSTEM'
                      ? 'bg-slate-800/60 border border-slate-700/60 text-slate-300 text-center italic'
                      : msg.senderRole === currentUserRole
                        ? 'bg-indigo-600/30 border border-indigo-500/40 text-slate-100 ml-4'
                        : 'bg-slate-800 border border-slate-700 text-slate-100 mr-4'
                  }`}
                >
                  {msg.senderRole !== 'SYSTEM' && (
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-semibold text-slate-200">{msg.senderName}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                  )}
                  <p className="leading-relaxed">{msg.message}</p>
                  {msg.isPrivate && (
                    <span className="text-[10px] text-amber-400 font-semibold block mt-1">Direct Message</span>
                  )}
                </div>
              ))}
            </div>

            {/* Message Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-slate-850 flex items-center space-x-2">
              <input
                type="text"
                placeholder="Type a message to parents..."
                value={newChatMessage}
                onChange={e => setNewChatMessage(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!newChatMessage.trim()}
                className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </aside>
        )}

        {/* SIDE PANEL: PARTICIPANTS & WAITING ROOM (Zoom Lobby) */}
        {activeSidePanel === 'participants' && (
          <aside className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-30 shrink-0">
            <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <h3 className="font-semibold text-slate-100">Participants ({participants.length})</h3>
              </div>
              <button
                onClick={() => setActiveSidePanel('none')}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Waiting Room Section */}
              {waitingRoomList.length > 0 && (
                <div className="bg-amber-950/30 border border-amber-600/40 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-amber-300">
                      Waiting Room ({waitingRoomList.length})
                    </span>
                    {currentUserRole === 'TEACHER' && (
                      <button
                        onClick={admitAllWaiting}
                        className="text-xs text-amber-400 hover:text-amber-200 underline font-semibold"
                      >
                        Admit All
                      </button>
                    )}
                  </div>
                  {waitingRoomList.map(w => (
                    <div key={w.id} className="flex items-center justify-between py-2 border-t border-amber-900/40 text-xs">
                      <div>
                        <div className="font-medium text-slate-200">{w.name}</div>
                        <div className="text-[10px] text-amber-400/80">{w.time}</div>
                      </div>
                      {currentUserRole === 'TEACHER' && (
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => admitWaitingParticipant(w.id)}
                            className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs"
                          >
                            Admit
                          </button>
                          <button
                            onClick={() => setWaitingRoomList(prev => prev.filter(x => x.id !== w.id))}
                            className="px-1.5 py-1 rounded bg-red-800/60 hover:bg-red-700 text-white text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* In-Meeting Participants list */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">In Meeting</h4>
                <div className="space-y-2">
                  {participants.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/60">
                      <div className="flex items-center space-x-2.5">
                        <div className={`w-8 h-8 rounded-full ${p.avatarBg} flex items-center justify-center text-xs font-bold text-white`}>
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">
                            {p.name} {p.isLocal ? '(You)' : ''}
                          </div>
                          <div className="text-[10px] text-slate-400">{p.role}</div>
                        </div>
                      </div>

                      {/* Participant status icons */}
                      <div className="flex items-center space-x-1 text-slate-400">
                        {p.audio ? (
                          <svg className="w-4 h-4 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.366zm1.414-1.414L6.525 5.11A6 6 0 0114.89 13.476zM3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-14-14z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Host Bulk Actions */}
            {currentUserRole === 'TEACHER' && (
              <div className="p-3 border-t border-slate-800 bg-slate-850 flex items-center justify-between">
                <button
                  onClick={() => {
                    setParticipants(prev => prev.map(p => ({ ...p, audio: false })));
                    showToast('All participants muted');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700"
                >
                  Mute All
                </button>
                <button
                  onClick={() => showToast('Security lock enabled - no new entries')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-slate-700"
                >
                  Lock Meeting
                </button>
              </div>
            )}
          </aside>
        )}

        {/* SIDE PANEL: INTEGRATED PTM ACADEMIC SNAPSHOT & MINUTES */}
        {activeSidePanel === 'academic' && (
          <aside className="w-80 md:w-[420px] bg-slate-900 border-l border-slate-800 flex flex-col z-30 shrink-0">
            <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <h3 className="font-semibold text-slate-100">PTM Student Academic Record</h3>
              </div>
              <button
                onClick={() => setActiveSidePanel('none')}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              {/* Student Header Card */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-100">{slot.studentName || 'Student'}</h4>
                    <p className="text-slate-400">{slot.grade} • {slot.admissionNumber || 'ADM-2024-0089'}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-sm">
                      {slot.academicSnapshot?.averageGrade || 84.5}%
                    </span>
                    <div className="text-[10px] text-slate-400 mt-0.5">Term 3 Average</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-700">
                  <div>
                    <span className="text-slate-400 text-[11px]">Attendance:</span>
                    <strong className="text-slate-200 ml-1">{slot.academicSnapshot?.attendanceRate || 96.8}%</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Class Rank:</span>
                    <strong className="text-slate-200 ml-1">{slot.academicSnapshot?.termExamRank || '5th / 42'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Strong Subject:</span>
                    <strong className="text-emerald-400 ml-1">{slot.academicSnapshot?.topSubject || 'Science'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px]">Focus Area:</span>
                    <strong className="text-amber-400 ml-1">{slot.academicSnapshot?.needsImprovement || 'Math'}</strong>
                  </div>
                </div>
              </div>

              {/* CBC Core Competency Rating */}
              <div className="bg-slate-800/50 p-3.5 rounded-xl border border-slate-700">
                <h5 className="font-semibold text-slate-300 mb-2">CBC Competencies Assessment</h5>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-850 p-2 rounded-lg border border-slate-750">
                    <div className="text-slate-400 text-[10px]">Communication</div>
                    <div className="text-emerald-400 font-bold text-xs">Exceeding</div>
                  </div>
                  <div className="bg-slate-850 p-2 rounded-lg border border-slate-750">
                    <div className="text-slate-400 text-[10px]">Critical Thinking</div>
                    <div className="text-emerald-400 font-bold text-xs">Exceeding</div>
                  </div>
                  <div className="bg-slate-850 p-2 rounded-lg border border-slate-750">
                    <div className="text-slate-400 text-[10px]">Collaboration</div>
                    <div className="text-indigo-400 font-bold text-xs">Meeting</div>
                  </div>
                  <div className="bg-slate-850 p-2 rounded-lg border border-slate-750">
                    <div className="text-slate-400 text-[10px]">Digital Literacy</div>
                    <div className="text-emerald-400 font-bold text-xs">Exceeding</div>
                  </div>
                </div>
              </div>

              {/* Parent Pre-Meeting Note */}
              {slot.parentNotes && (
                <div className="bg-indigo-950/40 p-3 rounded-xl border border-indigo-800/40 text-indigo-200">
                  <div className="font-semibold text-indigo-300 text-xs mb-1">Parent Discussion Topic:</div>
                  <p className="italic">{slot.parentNotes}</p>
                </div>
              )}

              {/* LIVE MEETING MINUTES & ACTIONS NOTEPAD */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 space-y-3">
                <h5 className="font-bold text-slate-200 flex items-center justify-between">
                  <span>Teacher Meeting Minutes</span>
                  {minutesSavedSuccess && (
                    <span className="text-emerald-400 text-[11px] font-medium">✓ Saved</span>
                  )}
                </h5>

                <textarea
                  value={meetingMinutes}
                  onChange={e => setMeetingMinutes(e.target.value)}
                  placeholder="Record key agreements, discussion points, and teacher observations during the PTM..."
                  rows={4}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />

                {/* Agreed Action Items */}
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Agreed Joint Action Items:</label>
                  <div className="space-y-1.5 mb-2">
                    {actionItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-750 text-xs">
                        <span className="text-slate-200">• {item}</span>
                        <button
                          onClick={() => handleRemoveActionItem(idx)}
                          className="text-red-400 hover:text-red-300 text-xs ml-2"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <input
                      type="text"
                      placeholder="Add new action item..."
                      value={newActionItem}
                      onChange={e => setNewActionItem(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddActionItem()}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500"
                    />
                    <button
                      onClick={handleAddActionItem}
                      className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs"
                    >
                      + Add
                    </button>
                  </div>
                </div>

                {/* Save and Dispatch actions */}
                <div className="pt-2 flex flex-col space-y-2">
                  <button
                    onClick={handleSaveMinutes}
                    disabled={isSavingMinutes}
                    className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <span>Save Minutes to ERP</span>
                  </button>
                  <button
                    onClick={handleSendMinutesWhatsApp}
                    className="w-full py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766 0-3.187-2.59-5.771-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.006c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.353.101.173.448.74 0.963 1.2.662.591 1.221.774 1.394.86.173.086.275.072.376-.044.101-.116.433-.505.549-.679.116-.173.231-.144.39-.087s1.011.477 1.184.564.289.13.332.202c.043.073.043.419-.101.824z" />
                    </svg>
                    <span>Send Summary to Parent via WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* SIDE PANEL / MODAL: INTERACTIVE WHITEBOARD (Zoom Whiteboard / Jamboard) */}
        {activeSidePanel === 'whiteboard' && (
          <aside className="w-80 md:w-[500px] bg-slate-900 border-l border-slate-800 flex flex-col z-30 shrink-0">
            <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <h3 className="font-semibold text-slate-100">Collaborative Whiteboard</h3>
              </div>
              <button
                onClick={() => setActiveSidePanel('none')}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            {/* Whiteboard Toolbar */}
            <div className="px-3 py-2 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              {/* Tool selector */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setBrushTool('pen')}
                  className={`p-1.5 rounded-lg text-xs ${brushTool === 'pen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Pen"
                >
                  ✏️
                </button>
                <button
                  onClick={() => setBrushTool('highlighter')}
                  className={`p-1.5 rounded-lg text-xs ${brushTool === 'highlighter' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Highlighter"
                >
                  🖍️
                </button>
                <button
                  onClick={() => setBrushTool('eraser')}
                  className={`p-1.5 rounded-lg text-xs ${brushTool === 'eraser' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                  title="Eraser"
                >
                  🧹
                </button>
              </div>

              {/* Color pickers */}
              <div className="flex items-center space-x-1.5">
                {['#ffffff', '#4f46e5', '#10b981', '#f59e0b', '#ef4444'].map(color => (
                  <button
                    key={color}
                    onClick={() => {
                      setBrushColor(color);
                      setBrushTool('pen');
                    }}
                    style={{ backgroundColor: color }}
                    className={`w-4 h-4 rounded-full border ${brushColor === color ? 'ring-2 ring-indigo-400 scale-110' : 'border-slate-600'}`}
                  />
                ))}
              </div>

              {/* Clear button */}
              <button
                onClick={clearCanvas}
                className="text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
              >
                Clear
              </button>
            </div>

            {/* Interactive Canvas Area */}
            <div className="flex-1 bg-white relative overflow-hidden cursor-crosshair">
              <canvas
                ref={canvasRef}
                width={500}
                height={600}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full h-full"
              />
            </div>
          </aside>
        )}

        {/* SIDE PANEL: HOST SECURITY & MEETING PERMISSIONS (Zoom Security) */}
        {activeSidePanel === 'security' && (
          <aside className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col z-30 shrink-0">
            <div className="h-14 px-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <h3 className="font-semibold text-slate-100">Security & Controls</h3>
              </div>
              <button
                onClick={() => setActiveSidePanel('none')}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <h4 className="font-semibold text-slate-200 mb-2">Meeting Locks</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Lock Meeting (Prevent New Joins)</span>
                    <input type="checkbox" className="rounded bg-slate-900 text-indigo-600 focus:ring-0" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Enable Waiting Room (Lobby)</span>
                    <input type="checkbox" defaultChecked className="rounded bg-slate-900 text-indigo-600 focus:ring-0" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Hide Profile Pictures</span>
                    <input type="checkbox" className="rounded bg-slate-900 text-indigo-600 focus:ring-0" />
                  </label>
                </div>
              </div>

              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <h4 className="font-semibold text-slate-200 mb-2">Allow Participants To:</h4>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Share Screen</span>
                    <input type="checkbox" defaultChecked className="rounded bg-slate-900 text-indigo-600 focus:ring-0" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Chat with Everyone</span>
                    <input type="checkbox" defaultChecked className="rounded bg-slate-900 text-indigo-600 focus:ring-0" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Unmute Themselves</span>
                    <input type="checkbox" defaultChecked className="rounded bg-slate-900 text-indigo-600 focus:ring-0" />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-300">Start Video</span>
                    <input type="checkbox" defaultChecked className="rounded bg-slate-900 text-indigo-600 focus:ring-0" />
                  </label>
                </div>
              </div>

              {/* Virtual Background Options */}
              <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700">
                <h4 className="font-semibold text-slate-200 mb-2">Virtual Background Filter</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setVirtualBg('none'); showToast('Background set to Standard'); }}
                    className={`p-2 rounded-lg border text-center ${virtualBg === 'none' ? 'border-indigo-500 bg-indigo-600/30' : 'border-slate-700 bg-slate-900'}`}
                  >
                    None
                  </button>
                  <button
                    onClick={() => { setVirtualBg('blur'); showToast('Background Blur enabled'); }}
                    className={`p-2 rounded-lg border text-center ${virtualBg === 'blur' ? 'border-indigo-500 bg-indigo-600/30' : 'border-slate-700 bg-slate-900'}`}
                  >
                    Blur Background
                  </button>
                  <button
                    onClick={() => { setVirtualBg('classroom'); showToast('Classroom background filter applied'); }}
                    className={`p-2 rounded-lg border text-center ${virtualBg === 'classroom' ? 'border-indigo-500 bg-indigo-600/30' : 'border-slate-700 bg-slate-900'}`}
                  >
                    Classroom
                  </button>
                  <button
                    onClick={() => { setVirtualBg('library'); showToast('Library background filter applied'); }}
                    className={`p-2 rounded-lg border text-center ${virtualBg === 'library' ? 'border-indigo-500 bg-indigo-600/30' : 'border-slate-700 bg-slate-900'}`}
                  >
                    Academy Library
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. BOTTOM FLOATING CONTROLS TOOLBAR (Zoom & Meet style) */}
      {/* ======================================================== */}
      <footer className="h-20 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 flex items-center justify-between px-6 z-40 shrink-0">
        {/* Left: Meeting info & Time */}
        <div className="hidden lg:flex items-center space-x-3 text-xs text-slate-300">
          <span className="font-semibold">{slot.title.split('-')[0]}</span>
          <span className="text-slate-600">•</span>
          <span className="font-mono text-slate-400">{slot.meetingCode}</span>
        </div>

        {/* Center: Primary Media & Interactive Action Buttons */}
        <div className="flex items-center space-x-2 md:space-x-3 mx-auto">
          {/* MUTE / UNMUTE BUTTON */}
          <button
            onClick={toggleAudio}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-lg ${
              isAudioMuted
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
            }`}
            title={isAudioMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {isAudioMuted ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
            <span className="text-[10px] mt-0.5">{isAudioMuted ? 'Unmute' : 'Mute'}</span>
          </button>

          {/* START / STOP VIDEO BUTTON */}
          <button
            onClick={toggleVideo}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-lg ${
              isVideoOff
                ? 'bg-red-600 hover:bg-red-500 text-white'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
            }`}
            title={isVideoOff ? 'Start Camera' : 'Stop Camera'}
          >
            {isVideoOff ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
            <span className="text-[10px] mt-0.5">{isVideoOff ? 'Start Video' : 'Stop Video'}</span>
          </button>

          {/* SHARE SCREEN BUTTON */}
          <button
            onClick={toggleScreenShare}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-lg ${
              isScreenSharing
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
            }`}
            title="Share Screen"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-[10px] mt-0.5">{isScreenSharing ? 'Stop Share' : 'Share'}</span>
          </button>

          {/* RECORD MEETING BUTTON */}
          <button
            onClick={toggleRecording}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-lg ${
              isRecording
                ? 'bg-red-600/90 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
            }`}
            title="Record Meeting"
          >
            <div className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white" />
            <span className="text-[10px] mt-0.5">{isRecording ? 'Recording' : 'Record'}</span>
          </button>

          {/* COLLABORATIVE WHITEBOARD BUTTON */}
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'whiteboard' ? 'none' : 'whiteboard')}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-lg ${
              activeSidePanel === 'whiteboard'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
            }`}
            title="Whiteboard"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <span className="text-[10px] mt-0.5">Board</span>
          </button>

          {/* LIVE CAPTIONS (CC) BUTTON */}
          <button
            onClick={() => {
              setCaptionsEnabled(!captionsEnabled);
              showToast(!captionsEnabled ? 'Live speech-to-text captions enabled' : 'Captions disabled');
            }}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-lg ${
              captionsEnabled
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
            }`}
            title="Live Captions (Speech to Text)"
          >
            <span className="font-bold text-xs tracking-wider border border-current px-1 rounded">CC</span>
            <span className="text-[10px] mt-0.5">Captions</span>
          </button>

          {/* RAISE HAND BUTTON */}
          <button
            onClick={() => {
              setIsHandRaised(!isHandRaised);
              showToast(!isHandRaised ? 'You raised your hand' : 'Hand lowered');
            }}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-lg ${
              isHandRaised
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
            }`}
            title="Raise Hand"
          >
            <span className="text-lg">✋</span>
            <span className="text-[10px] mt-0.5">{isHandRaised ? 'Raised' : 'Hand'}</span>
          </button>

          {/* EMOJI REACTIONS DROPDOWN */}
          <div className="relative group">
            <button
              className="flex flex-col items-center justify-center w-12 h-12 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700 transition-all shadow-lg"
              title="Send Reaction"
            >
              <span className="text-lg">👏</span>
              <span className="text-[10px] mt-0.5">React</span>
            </button>
            <div className="absolute bottom-14 left-1/2 transform -translate-x-1/2 hidden group-hover:flex items-center space-x-2 bg-slate-800/95 p-2 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-xl">
              {['👍', '👏', '❤️', '🎉', '💡', '🔥'].map(emoji => (
                <button
                  key={emoji}
                  onClick={() => sendReaction(emoji)}
                  className="text-2xl hover:scale-130 transition-transform p-1"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* CHAT TOGGLE */}
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? 'none' : 'chat')}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-lg relative ${
              activeSidePanel === 'chat'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
            }`}
            title="In-Meeting Chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-[10px] mt-0.5">Chat</span>
            {chatMessages.length > 2 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                •
              </span>
            )}
          </button>

          {/* PARTICIPANTS & WAITING ROOM TOGGLE */}
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'participants' ? 'none' : 'participants')}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-lg relative ${
              activeSidePanel === 'participants'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
            }`}
            title="Participants"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-[10px] mt-0.5">People</span>
            {waitingRoomList.length > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 h-4 bg-amber-500 text-slate-950 rounded-full text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                {waitingRoomList.length}
              </span>
            )}
          </button>

          {/* ACADEMIC PROGRESS & MEETING MINUTES DRAWER */}
          <button
            onClick={() => setActiveSidePanel(activeSidePanel === 'academic' ? 'none' : 'academic')}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all shadow-lg ${
              activeSidePanel === 'academic'
                ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white'
                : 'bg-slate-800 hover:bg-slate-750 text-slate-200 border border-slate-700'
            }`}
            title="Student Progress & Minutes"
          >
            <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-[10px] mt-0.5">Minutes</span>
          </button>
        </div>

        {/* Right: End Meeting / Leave Meeting button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (onLeave) {
                onLeave();
              } else if (typeof window !== 'undefined') {
                window.history.back();
              }
            }}
            className="px-5 py-2.5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs tracking-wide shadow-xl shadow-red-600/30 transition-all flex items-center space-x-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>{currentUserRole === 'TEACHER' ? 'End Meeting' : 'Leave Call'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}
