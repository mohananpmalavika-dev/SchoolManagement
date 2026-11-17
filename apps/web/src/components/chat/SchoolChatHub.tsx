'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  Send,
  Search,
  Users,
  Plus,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  ShieldAlert,
  GraduationCap,
  Sparkles,
  Phone,
  Video,
  ScreenShare,
  X,
  FileText,
  CornerUpLeft,
  ChevronRight,
  Filter,
} from 'lucide-react';
import {
  chatClient,
  ChatChannel,
  ChatMessage,
  ChatContact,
  ChatAttachment,
} from '@/lib/chat-client';
import { InteractiveClassroomBoard } from './InteractiveClassroomBoard';
import { ChatCallModal } from './ChatCallModal';
import { ScreenShareModal } from './ScreenShareModal';
import { messageFor } from '@/lib/workspace';
import { useAuth } from '@/contexts/AuthContext';

const EMOJIS = ['👍', '❤️', '👏', '💡', '📚', '🔔', '🏫', '✅', '🔥', '🙌'];

const CANNED_REPLIES = [
  'Acknowledged with thanks.',
  'Fee statement received and forwarded.',
  'Homework assignment has been submitted.',
  'Please check the attached academic circular.',
  'Student is present in class.',
  'Let us schedule a quick PTM virtual conference.',
];

export function SchoolChatHub() {
  const {user}=useAuth();
  const [error,setError]=useState('');
  const [uploading,setUploading]=useState(false);
  const [channels, setChannels] = useState<ChatChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'CHANNELS' | 'DIRECT'>('ALL');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showCannedReplies, setShowCannedReplies] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<ChatAttachment[]>([]);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');
  const [newChannelMembers,setNewChannelMembers]=useState<string[]>([]);
  const [creatingChannel, setCreatingChannel] = useState(false);
  const [activeCall, setActiveCall] = useState<'audio' | 'video' | null>(null);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [showScreenShare, setShowScreenShare] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const selectedChannel = useRef(activeChannelId);
  useEffect(()=>{selectedChannel.current=activeChannelId;},[activeChannelId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load initial channels
  const loadChannels = useCallback(async () => {
    try {
      const data = await chatClient.getChannels();
      setChannels(data);
      if (data.length > 0 && !activeChannelId) {
        setActiveChannelId(data[0].id);
      }
      if(activeChannelId&&!data.some(channel=>channel.id===activeChannelId)){setActiveChannelId(data[0]?.id||'');setMessages([]);}
    } catch(err) {
      setError(messageFor(err));
    } finally {
      setLoading(false);
    }
  }, [activeChannelId]);

  // Load messages for active channel
  const loadMessages = useCallback(async (channelId: string) => {
    if (!channelId) return;
    try {
      const list = await chatClient.getMessages(channelId);
      if(selectedChannel.current===channelId)setMessages(list);
    } catch(err) { if(selectedChannel.current===channelId)setError(messageFor(err)); }
  }, []);

  useEffect(() => {
    void loadChannels();
  }, [loadChannels]);

  useEffect(() => {
    setMessages([]);setReplyingTo(null);setAttachedFiles([]);setInputText('');setError('');
    if (activeChannelId) {
      void loadMessages(activeChannelId);
      const timer = setInterval(() => {
        void loadMessages(activeChannelId);
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [activeChannelId, loadMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const activeChannel = channels.find((c) => c.id === activeChannelId);

  const filteredChannels = channels.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (activeTab === 'CHANNELS') return c.type !== 'DIRECT';
    if (activeTab === 'DIRECT') return c.type === 'DIRECT';
    return true;
  });

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!inputText.trim() && attachedFiles.length === 0) || !activeChannelId || sending || uploading) {
      return;
    }

    const content = inputText.trim() || 'Shared attachment: ' + attachedFiles[0]?.name;
    const attachmentsToSend = attachedFiles.length > 0 ? attachedFiles : undefined;
    const replyId = replyingTo?.id;

    setShowEmojiPicker(false);
    setShowCannedReplies(false);
    setSending(true);
    setError('');
    const targetChannelId=activeChannelId;

    try {
      const newMsg = await chatClient.sendMessage(
        targetChannelId,
        content,
        attachmentsToSend,
        replyId,
      );
      if(selectedChannel.current===targetChannelId){
        setMessages((prev) => prev.some(message=>message.id===newMsg.id)?prev:[...prev,newMsg]);
        setInputText('');setAttachedFiles([]);setReplyingTo(null);
      }
      void loadChannels();
    } catch(err) {
      setError(messageFor(err));
    } finally {
      setSending(false);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    if (!activeChannelId) return;
    try {await chatClient.addReaction(activeChannelId,messageId,emoji);await loadMessages(activeChannelId);}
    catch(err){setError(messageFor(err));}
  };

  const openNewChat = async () => {
    try {setContacts(await chatClient.getContacts());setShowNewChatModal(true);}
    catch(err){setError(messageFor(err));}
  };

  const startDirectMessage = async (targetUserId: string) => {
    try {
    const res = await chatClient.startDirectChat(targetUserId);
    setShowNewChatModal(false);
    await loadChannels();
    setActiveChannelId(res.channelId);
    }catch(err){setError(messageFor(err));}
  };

  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChannelName.trim()) return;
    setCreatingChannel(true);
    try {
      // Create channel via API
      const channel=await chatClient.createChannel(newChannelName.trim(),newChannelDesc.trim(),newChannelMembers);
      setNewChannelName('');
      setNewChannelDesc('');
      setNewChannelMembers([]);
      setShowNewChatModal(false);
      await loadChannels();
      setActiveChannelId(channel.id);
    } catch(err) {
      setError(messageFor(err));
    } finally {
      setCreatingChannel(false);
    }
  };

  const uploadFile = async (file: File) => {
    if(!activeChannelId||uploading)return;
    if(file.size>5*1024*1024||!['image/png','image/jpeg','application/pdf'].includes(file.type)){setError('Choose a PNG, JPEG or PDF up to 5 MB');return;}
    if(attachedFiles.length>=5){setError('Attach up to five files');return;}
    const channelId=activeChannelId;setUploading(true);setError('');
    try {const attachment=await chatClient.uploadAttachment(channelId,file);if(selectedChannel.current===channelId)setAttachedFiles(previous=>[...previous,attachment]);}
    catch(err){setError(messageFor(err));}finally{setUploading(false);}
  };

  const handleShareSnapshot = async (dataUrl: string) => {
    if (!activeChannelId) return;
    const attachment=await chatClient.uploadAttachment(activeChannelId,new File([await (await fetch(dataUrl)).blob()],'Classroom_Board_Notes.png',{type:'image/png'}));
    const newMsg = await chatClient.sendMessage(
      activeChannelId,
      '🎨 Shared interactive classroom board notes with students and teacher',
      [
        {
          ...attachment,
          type: 'image/png',
        },
      ],
    );
    setMessages((prev) => [...prev, newMsg]);
    setShowWhiteboard(false);
  };

  const handleShareScreenSnapshot = async (dataUrl: string) => {
    if (!activeChannelId) return;
    const attachment=await chatClient.uploadAttachment(activeChannelId,new File([await (await fetch(dataUrl)).blob()],'Screen_Presentation_Snapshot.png',{type:'image/png'}));
    const newMsg = await chatClient.sendMessage(
      activeChannelId,
      '🖥️ Shared live screen presentation snapshot with class',
      [
        {
          ...attachment,
          type: 'image/png',
        },
      ],
    );
    setMessages((prev) => [...prev, newMsg]);
    setShowScreenShare(false);
  };

  return (
    <><div aria-live="polite">{error&&<div role="alert" className="state-box">{error}<button className="underline ml-3" onClick={()=>{setError('');void loadChannels();if(activeChannelId)void loadMessages(activeChannelId);}}>Retry chat</button></div>}</div><div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[780px]">
      {/* LEFT COLUMN: Channels and Direct Messages */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-800 bg-slate-950/70 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/10">
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className="font-bold text-sm text-slate-100 flex items-center gap-1.5">
                School Chat
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </h2>
              <p className="text-[11px] text-slate-400">Live Campus Collaboration</p>
            </div>
          </div>
          <button
            onClick={openNewChat}
            className="p-2 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-colors"
            title="Start New Chat or Channel"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900/90 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1 mt-2.5 bg-slate-900/60 p-1 rounded-lg border border-slate-800/80">
            {(['ALL', 'CHANNELS', 'DIRECT'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all ${
                  activeTab === tab
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {tab === 'ALL' ? 'All' : tab === 'CHANNELS' ? 'Channels' : 'Direct'}
              </button>
            ))}
          </div>
        </div>

        {/* Channel List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {loading ? (
            <div className="p-6 text-center text-xs text-slate-500">Loading channels…</div>
          ) : filteredChannels.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">No conversations found.</div>
          ) : (
            filteredChannels.map((channel) => {
              const isActive = channel.id === activeChannelId;
              return (
                <button
                  key={channel.id}
                  onClick={() => setActiveChannelId(channel.id)}
                  className={`w-full p-3.5 text-left transition-all flex items-start gap-3 hover:bg-slate-900/70 ${
                    isActive ? 'bg-slate-900 border-l-4 border-emerald-500 shadow-inner' : ''
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                      channel.type === 'ANNOUNCEMENT'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : channel.type === 'DIRECT'
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {channel.type === 'ANNOUNCEMENT' ? '📢' : channel.name.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h3
                        className={`text-xs font-semibold truncate ${
                          isActive ? 'text-white' : 'text-slate-200'
                        }`}
                      >
                        {channel.name}
                      </h3>
                      {channel.lastMessage && (
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(channel.lastMessage.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">
                      {channel.lastMessage
                        ? `${channel.lastMessage.senderName}: ${channel.lastMessage.content}`
                        : channel.description || 'No messages yet'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Chat Messages View */}
      <div className="flex-1 flex flex-col bg-slate-950/40">
        {activeChannel ? (
          <>
            {/* Chat Topbar */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/80 backdrop-blur flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                  {activeChannel.type === 'ANNOUNCEMENT' ? '📢' : '💬'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-bold text-sm text-slate-100">{activeChannel.name}</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                      {activeChannel.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate max-w-md">
                    {activeChannel.description || `${activeChannel.memberCount} school members connected`}
                  </p>
                </div>
              </div>

              {/* Quick Actions: Call, Video, Whiteboard & Templates */}
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setActiveCall('audio')}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Voice Call"
                >
                  <Phone size={13} />
                  <span className="hidden sm:inline">Voice Call</span>
                </button>

                <button
                  onClick={() => setActiveCall('video')}
                  className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="HD Video Call"
                >
                  <Video size={13} />
                  <span className="hidden sm:inline">Video Call</span>
                </button>

                <button
                  onClick={() => setShowScreenShare(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-400 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Live Screen Sharing & Lesson Presentation"
                >
                  <ScreenShare size={13} />
                  <span className="hidden sm:inline">Screen Share</span>
                </button>

                <button
                  onClick={() => setShowWhiteboard(true)}
                  className="px-2.5 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  title="Collaborative Classroom Board for Teacher & Children"
                >
                  <span>🎨</span>
                  <span className="hidden sm:inline">Board</span>
                </button>

                <button
                  onClick={() => setShowCannedReplies(!showCannedReplies)}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
                  title="Canned Templates"
                >
                  <Sparkles size={13} className="text-amber-400" />
                  <span className="hidden md:inline">Templates</span>
                </button>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                  <MessageSquare size={36} className="mb-2 text-slate-600" />
                  <p className="text-sm font-semibold text-slate-300">Start the conversation</p>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Send a message, share circulars or lesson notes with your school community.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sender.isMe;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group`}
                    >
                      {/* Sender Name & Role */}
                      {!isMe && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1 ml-1">
                          <span className="font-semibold text-slate-200">{msg.sender.name}</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-800 text-emerald-400 border border-slate-700">
                            {msg.sender.role}
                          </span>
                        </div>
                      )}

                      {/* Replying To Quote */}
                      {msg.replyTo && (
                        <div
                          className={`text-[10px] p-2 mb-1 rounded-lg border max-w-sm ${
                            isMe
                              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                              : 'bg-slate-800/60 border-slate-700 text-slate-400'
                          }`}
                        >
                          <span className="font-semibold">{msg.replyTo.senderName}:</span>{' '}
                          {msg.replyTo.content}
                        </div>
                      )}

                      {/* Bubble Content */}
                      <div className="flex items-end gap-2 max-w-[85%] md:max-w-[70%]">
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm transition-all ${
                            isMe
                              ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-br-xs'
                              : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-bl-xs'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>

                          {/* Attachment Preview */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-white/20 space-y-1.5">
                              {msg.attachments.map((att, idx) => (
                                <a
                                  key={idx}
                                  href={att.url?.startsWith('https://')?att.url:undefined}
                                  aria-disabled={!att.url?.startsWith('https://')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 p-2 rounded-lg bg-black/20 hover:bg-black/30 transition-colors text-[11px]"
                                >
                                  <FileText size={15} />
                                  <span className="truncate flex-1 underline">{att.name}</span>
                                </a>
                              ))}
                            </div>
                          )}

                          {/* Meta & Status */}
                          <div
                            className={`flex items-center justify-end gap-1.5 mt-1.5 text-[9px] ${
                              isMe ? 'text-emerald-200' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && <CheckCheck size={12} className="text-emerald-300" />}
                          </div>
                        </div>

                        {/* Hover Quick Actions */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                          <button
                            onClick={() => setReplyingTo(msg)}
                            className="p-1.5 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                            title="Reply"
                          >
                            <CornerUpLeft size={12} />
                          </button>
                          <button
                            onClick={() => handleReaction(msg.id, '👍')}
                            className="p-1 rounded-md bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 text-xs"
                            title="Thumbs Up"
                          >
                            👍
                          </button>
                        </div>
                      </div>

                      {/* Reaction Badges */}
                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 ml-1">
                          {Object.entries(msg.reactions).map(([emoji, users]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(msg.id, emoji)}
                              className={`px-1.5 py-0.5 rounded-full text-[10px] flex items-center gap-1 border transition-colors ${
                                users.includes('me')
                                  ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                                  : 'bg-slate-800/80 border-slate-700 text-slate-300'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span className="font-semibold">{users.length}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quoted Reply Preview */}
            {replyingTo && (
              <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2 truncate">
                  <CornerUpLeft size={14} className="text-emerald-400" />
                  <span>
                    Replying to <strong className="text-emerald-300">{replyingTo.sender.name}</strong>:{' '}
                    {replyingTo.content}
                  </span>
                </div>
                <button
                  onClick={() => setReplyingTo(null)}
                  className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Attachment preview tags */}
            {attachedFiles.length > 0 && (
              <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex flex-wrap gap-2">
                {attachedFiles.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/50 border border-emerald-800 text-emerald-300 text-xs"
                  >
                    <FileText size={13} />
                    <span>{file.name}</span>
                    <button
                      onClick={() =>
                        setAttachedFiles((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="ml-1 text-emerald-400 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Canned Responses Flyout */}
            {showCannedReplies && (
              <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex flex-wrap gap-1.5">
                {CANNED_REPLIES.map((reply, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputText(reply);
                      setShowCannedReplies(false);
                      inputRef.current?.focus();
                    }}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Emoji Picker Flyout */}
            {showEmojiPicker && (
              <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex gap-2">
                {EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => {
                      setInputText((prev) => prev + emoji);
                      setShowEmojiPicker(false);
                      inputRef.current?.focus();
                    }}
                    className="text-base p-1.5 rounded hover:bg-slate-800 transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Message Input Bar */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 md:p-4 border-t border-slate-800 bg-slate-900/90 flex items-center gap-2"
            >
              <button
                type="button"
                onClick={()=>fileRef.current?.click()}
                disabled={uploading||sending}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Attach Document"
              >
                <Paperclip size={18} />
              </button>
              <input ref={fileRef} type="file" className="sr-only" aria-label="Upload chat attachment" accept="image/png,image/jpeg,application/pdf" onChange={event=>{const file=event.target.files?.[0];if(file)void uploadFile(file);event.target.value='';}}/>

              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                title="Add Emoji"
              >
                <Smile size={18} />
              </button>

              <input
                ref={inputRef}
                disabled={sending||uploading}
                type="text"
                placeholder="Type your message... (Enter to send)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
              />

              <button
                type="submit"
                disabled={(!inputText.trim() && attachedFiles.length === 0) || sending || uploading}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all shrink-0"
              >
                <span>Send</span>
                <Send size={14} />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex items-center justify-center p-6 text-center text-slate-500 text-xs">
            Select a channel or direct message to begin.
          </div>
        )}
      </div>

      {/* NEW CHAT / CONTACT PICKER MODAL */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-100">Start New Conversation</h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[460px] overflow-y-auto">
              <div>
                <h4 className="text-xs font-semibold text-slate-300 mb-2">Available Contacts</h4>
                <div className="space-y-1.5">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => startDirectMessage(contact.id)}
                      className="w-full p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 text-left flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{contact.name}</p>
                        <p className="text-[10px] text-slate-400">{contact.email}</p>
                      </div>
                      <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-slate-700 text-emerald-400">
                        {contact.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Create Channel Section */}
              {!['PARENT','STUDENT'].includes(user?.role||'')&&<div className="pt-3 border-t border-slate-800">
                <h4 className="text-xs font-semibold text-slate-300 mb-2">Create New Channel</h4>
                <form onSubmit={handleCreateChannel} className="space-y-2.5">
                  <input
                    type="text"
                    placeholder="Channel name (e.g. Grade 5 Mathematics)"
                    minLength={2}
                    maxLength={100}
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Description (optional)"
                    maxLength={500}
                    value={newChannelDesc}
                    onChange={(e) => setNewChannelDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <label className="block text-xs text-slate-300">Channel members<select multiple aria-label="Channel members" value={newChannelMembers} onChange={event=>setNewChannelMembers(Array.from(event.target.selectedOptions,option=>option.value))} className="w-full bg-slate-950 border border-slate-700 rounded-lg mt-2">{contacts.map(contact=><option key={contact.id} value={contact.id}>{contact.name}</option>)}</select></label>
                  <button
                    type="submit"
                    disabled={!newChannelName.trim() || creatingChannel}
                    className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors"
                  >
                    {creatingChannel ? 'Creating...' : 'Create Channel'}
                  </button>
                </form>
              </div>}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Classroom Whiteboard Modal for Teacher & Children */}
      {showWhiteboard && activeChannel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
          <div className="w-full max-w-5xl">
            <InteractiveClassroomBoard
              channelName={activeChannel.name}
              userName={[user?.firstName,user?.lastName].filter(Boolean).join(' ')}
              userRole={user?.role}
              onClose={() => setShowWhiteboard(false)}
              onShareToChat={handleShareSnapshot}
            />
          </div>
        </div>
      )}

      {/* Live Screen Sharing Modal */}
      {showScreenShare && activeChannel && (
        <ScreenShareModal
          channelName={activeChannel.name}
          onClose={() => setShowScreenShare(false)}
          onOpenWhiteboard={() => {
            setShowScreenShare(false);
            setShowWhiteboard(true);
          }}
          onSendSnapshotToChat={handleShareScreenSnapshot}
        />
      )}

      {/* Voice & HD Video Call Suite Modal */}
      {activeCall && activeChannel && (
        <ChatCallModal
          channelName={activeChannel.name}
          callType={activeCall}
          onEndCall={() => setActiveCall(null)}
          onOpenWhiteboard={() => setShowWhiteboard(true)}
          onOpenScreenShare={() => setShowScreenShare(true)}
        />
      )}
    </div></>
  );
}
