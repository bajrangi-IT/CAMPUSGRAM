import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Plus,
  Send,
  Image as ImageIcon,
  Smile,
  Trash2,
  ShieldAlert,
  ArrowLeft,
  Users,
  Search,
  MoreVertical,
  Reply,
  Check,
  CheckCheck,
  Building2,
  X,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/Dropdown';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
} from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/EmptyState';
import { Conversation, Message } from '@/types/social.types';
import {
  fetchUserConversations,
  fetchConversationMessages,
  sendMessage,
  deleteMessage,
  toggleMessageReaction,
  subscribeToMessages,
  createDirectConversation,
  createGroupConversation,
} from '@/services/messagesService';
import { blockUser } from '@/services/safetyService';
import { formatTimeAgo } from '@/lib/utils';
import { ReportModal } from '@/components/social/ReportModal';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { toast } from 'sonner';

const POPULAR_EMOJIS = ['👍', '❤️', '🔥', '🎉', '💡', '👏'];

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();
  const requestedConvId = (location.state as any)?.openConversationId;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(requestedConvId || null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);

  // New message input
  const [inputText, setInputText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Search filter
  const [convSearch, setConvSearch] = useState('');

  // Modals
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [chatTypeTab, setChatTypeTab] = useState<'direct' | 'group'>('direct');
  const [targetUsername, setTargetUsername] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [groupType, setGroupType] = useState<'club' | 'event' | 'project_team'>('project_team');
  const [groupMembersText, setGroupMembersText] = useState('');
  const [isCreatingChat, setIsCreatingChat] = useState(false);

  // Safety
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    setIsLoadingConvs(true);
    const list = await fetchUserConversations(user.id);
    setConversations(list);
    if (!activeConversationId && list.length > 0 && window.innerWidth >= 768) {
      setActiveConversationId(list[0].id);
    }
    setIsLoadingConvs(false);
  };

  // Load messages & Realtime subscription
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    let unsubscribe: () => void = () => {};

    async function initMessages() {
      setIsLoadingMsgs(true);
      const res = await fetchConversationMessages(activeConversationId!);
      setMessages(res.messages);
      setIsLoadingMsgs(false);
      scrollToBottom();

      // Subscribe to Realtime messages for this active chat
      unsubscribe = subscribeToMessages(activeConversationId!, (newMsg) => {
        setMessages((prev) => {
          if (prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        scrollToBottom();
      });
    }

    initMessages();

    return () => {
      unsubscribe();
    };
  }, [activeConversationId]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  // Resolve chat title and avatar
  const getChatDetails = (conv: Conversation) => {
    if (conv.is_group) {
      return {
        title: conv.title || 'Campus Group',
        subtitle: `${conv.members.length} members • ${conv.group_type.replace('_', ' ')}`,
        avatar: conv.group_avatar,
        fallback: conv.title ? conv.title.substring(0, 2).toUpperCase() : 'GP',
      };
    }

    // Direct chat: show other member
    const otherMember = conv.members.find((m) => m.user_id !== user?.id)?.user;
    return {
      title: otherMember?.full_name || 'Campus Student',
      subtitle: otherMember ? `@${otherMember.username}` : 'Direct Chat',
      avatar: otherMember?.profile_photo || null,
      fallback: otherMember?.full_name ? otherMember.full_name.substring(0, 2).toUpperCase() : 'CG',
      otherUserId: otherMember?.id,
    };
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeConversationId || (!inputText.trim() && !imageUrl.trim())) return;

    setIsSending(true);
    try {
      const { message, error } = await sendMessage({
        conversationId: activeConversationId,
        senderId: user.id,
        content: inputText.trim(),
        mediaUrls: imageUrl.trim() ? [imageUrl.trim()] : [],
        replyToId: replyingTo?.id,
      });

      if (error) {
        toast.error('Failed to send message.');
        return;
      }

      if (message) {
        setMessages((prev) => [...prev, message]);
        setInputText('');
        setImageUrl('');
        setShowImageInput(false);
        setReplyingTo(null);
        scrollToBottom();
      }
    } catch {
      toast.error('Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteMsg = async (msgId: string) => {
    try {
      await deleteMessage(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      toast.success('Message deleted');
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const handleReact = async (msgId: string, emoji: string) => {
    if (!user) return;
    try {
      const res = await toggleMessageReaction(msgId, emoji, user.id);
      if (res.success && res.reactions) {
        setMessages((prev) =>
          prev.map((m) => (m.id === msgId ? { ...m, reactions: res.reactions! } : m))
        );
      }
    } catch {}
  };

  // Create Chat
  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsCreatingChat(true);

    try {
      if (chatTypeTab === 'direct') {
        // Find profile by username
        const { data: target } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', targetUsername.trim().toLowerCase())
          .maybeSingle();

        if (!target) {
          toast.error('Student username not found');
          setIsCreatingChat(false);
          return;
        }

        const { conversationId, error } = await createDirectConversation(user.id, target.id);
        if (error) throw error;

        toast.success('Conversation started');
        setIsNewChatModalOpen(false);
        setTargetUsername('');
        await loadConversations();
        if (conversationId) setActiveConversationId(conversationId);
      } else {
        // Group chat
        if (!groupTitle.trim()) {
          toast.error('Group title is required');
          setIsCreatingChat(false);
          return;
        }

        // Parse member usernames
        const usernames = groupMembersText
          .split(',')
          .map((u) => u.trim().replace('@', '').toLowerCase())
          .filter(Boolean);

        let memberIds: string[] = [];
        if (usernames.length > 0) {
          const { data: members } = await supabase
            .from('profiles')
            .select('id')
            .in('username', usernames);
          if (members) memberIds = members.map((m) => m.id);
        }

        const { conversationId, error } = await createGroupConversation({
          creatorId: user.id,
          title: groupTitle.trim(),
          groupType,
          memberUserIds: memberIds,
        });

        if (error) throw error;

        toast.success('Group conversation created');
        setIsNewChatModalOpen(false);
        setGroupTitle('');
        setGroupMembersText('');
        await loadConversations();
        if (conversationId) setActiveConversationId(conversationId);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create conversation');
    } finally {
      setIsCreatingChat(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const details = getChatDetails(c);
    return details.title.toLowerCase().includes(convSearch.toLowerCase());
  });

  return (
    <div className="h-[calc(100vh-8rem)] rounded-2xl border border-slate-200/80 bg-white shadow-card overflow-hidden flex flex-col md:flex-row">
      {/* LEFT COLUMN: CONVERSATION LIST */}
      <div
        className={`w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col h-full bg-slate-50/50 ${
          activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Messages</h1>
            <Button
              size="sm"
              onClick={() => setIsNewChatModalOpen(true)}
              className="gap-1 font-bold text-xs h-8 px-2.5 rounded-xl shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>New</span>
            </Button>
          </div>

          <Input
            type="search"
            placeholder="Search conversations..."
            value={convSearch}
            onChange={(e) => setConvSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
            className="h-9 text-xs bg-slate-50"
          />
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {isLoadingConvs ? (
            <div className="text-center py-10 text-xs text-slate-400">Loading messages...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-12 px-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-2">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="text-xs font-bold text-slate-700">No conversations</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Start a direct peer chat or create a project group.
              </p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const details = getChatDetails(conv);
              const isActive = conv.id === activeConversationId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={`flex items-center space-x-3 p-3 rounded-xl cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-indigo-50/80 border border-indigo-100 text-slate-900'
                      : 'hover:bg-white text-slate-700'
                  }`}
                >
                  <Avatar className="h-10 w-10 shrink-0 ring-1 ring-slate-200">
                    <AvatarImage src={details.avatar || ''} />
                    <AvatarFallback className="text-xs font-bold">
                      {details.fallback}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <h4 className="text-xs font-bold truncate text-slate-900">
                        {details.title}
                      </h4>
                      {conv.last_message && (
                        <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                          {formatTimeAgo(conv.last_message.created_at)}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {conv.last_message?.content || 'No messages yet'}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVE CHAT PANEL */}
      <div
        className={`flex-1 flex flex-col h-full bg-white ${
          !activeConversationId ? 'hidden md:flex' : 'flex'
        }`}
      >
        {activeConversation ? (
          <>
            {/* Chat Header */}
            {(() => {
              const details = getChatDetails(activeConversation);
              return (
                <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-white z-10">
                  <div className="flex items-center space-x-3 min-w-0">
                    <button
                      onClick={() => setActiveConversationId(null)}
                      className="md:hidden p-1 text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </button>
                    <Avatar className="h-10 w-10 ring-1 ring-slate-100">
                      <AvatarImage src={details.avatar || ''} />
                      <AvatarFallback className="text-xs font-bold">
                        {details.fallback}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 truncate">
                        {details.title}
                      </h3>
                      <p className="text-[11px] text-slate-400 truncate">
                        {details.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                      <MoreVertical className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 text-xs">
                      {details.otherUserId && (
                        <>
                          <DropdownMenuItem
                            onClick={() => {
                              if (details.otherUserId) {
                                blockUser(user!.id, details.otherUserId);
                                toast.success('User blocked');
                              }
                            }}
                            className="text-rose-600 focus:text-rose-600"
                          >
                            Block User
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setReportTargetId(details.otherUserId!)}
                            className="text-rose-600 focus:text-rose-600"
                          >
                            Report User
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              );
            })()}

            {/* Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
              {isLoadingMsgs ? (
                <div className="text-center py-12 text-xs text-slate-400">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-2">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-800">Say hello!</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Send the first message to start this campus conversation.
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.sender_id === user?.id;
                  const reactionEntries = Object.entries(msg.reactions || {});

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} group`}
                    >
                      {/* Sender label for group chat */}
                      {!isOwn && activeConversation.is_group && (
                        <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">
                          {msg.sender?.full_name || 'Member'}
                        </span>
                      )}

                      {/* Replying context bubble */}
                      {msg.reply_to && (
                        <div className="mb-1 text-[10px] text-slate-500 bg-slate-100 rounded-lg px-2.5 py-1 max-w-xs truncate border-l-2 border-indigo-500">
                          Replying to: {msg.reply_to.content}
                        </div>
                      )}

                      <div className="flex items-end gap-1.5 max-w-[80%] sm:max-w-md">
                        {/* Bubble */}
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-xs shadow-xs leading-relaxed whitespace-pre-wrap ${
                            isOwn
                              ? 'bg-indigo-600 text-white rounded-br-xs'
                              : 'bg-white border border-slate-200/80 text-slate-800 rounded-bl-xs'
                          }`}
                        >
                          {/* Image Attachment */}
                          {msg.media_urls && msg.media_urls.length > 0 && (
                            <img
                              src={msg.media_urls[0]}
                              alt="Attachment"
                              className="rounded-lg mb-2 max-h-48 object-cover"
                            />
                          )}

                          <p>{msg.content}</p>

                          <div
                            className={`flex items-center justify-end space-x-1 mt-1 text-[9px] ${
                              isOwn ? 'text-indigo-200' : 'text-slate-400'
                            }`}
                          >
                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isOwn && <CheckCheck className="h-3 w-3" />}
                          </div>
                        </div>

                        {/* Hover Quick Actions */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 pb-1">
                          <button
                            onClick={() => setReplyingTo(msg)}
                            className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                            title="Reply"
                          >
                            <Reply className="h-3.5 w-3.5" />
                          </button>
                          <DropdownMenu>
                            <DropdownMenuTrigger className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700">
                              <Smile className="h-3.5 w-3.5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="p-1 flex gap-1">
                              {POPULAR_EMOJIS.map((emoji) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReact(msg.id, emoji)}
                                  className="hover:scale-125 transition-transform p-1 text-sm"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {isOwn && (
                            <button
                              onClick={() => handleDeleteMsg(msg.id)}
                              className="p-1 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600"
                              title="Delete message"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Displayed Emoji Reactions */}
                      {reactionEntries.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {reactionEntries.map(([emoji, uids]) => (
                            <button
                              key={emoji}
                              onClick={() => handleReact(msg.id, emoji)}
                              className={`flex items-center space-x-1 rounded-full px-2 py-0.5 text-[10px] font-bold border transition-colors ${
                                uids.includes(user?.id || '')
                                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                  : 'bg-white border-slate-200 text-slate-600'
                              }`}
                            >
                              <span>{emoji}</span>
                              <span>{uids.length}</span>
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

            {/* Reply Bar */}
            {replyingTo && (
              <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-900">
                <div className="flex items-center space-x-2 truncate">
                  <Reply className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                  <span className="font-semibold shrink-0">Replying to:</span>
                  <span className="truncate italic text-slate-600">
                    {replyingTo.content}
                  </span>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1 hover:text-slate-900">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

            {/* Image attachment row */}
            {showImageInput && (
              <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                <Input
                  type="url"
                  placeholder="Paste image attachment URL..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="h-8 text-xs"
                />
                <button onClick={() => setShowImageInput(false)} className="text-slate-400 p-1">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Input Composer */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-slate-100 bg-white flex items-center space-x-2"
            >
              <button
                type="button"
                onClick={() => setShowImageInput(!showImageInput)}
                className="p-2 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-slate-50 transition-colors"
                title="Attach Image"
              >
                <ImageIcon className="h-5 w-5" />
              </button>

              <Input
                placeholder="Type a campus message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 h-10 text-xs rounded-xl"
              />

              <Button
                type="submit"
                size="icon"
                isLoading={isSending}
                disabled={!inputText.trim() && !imageUrl.trim()}
                className="h-10 w-10 shrink-0 rounded-xl"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50/20">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 mb-3 shadow-xs">
              <MessageSquare className="h-8 w-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Direct Campus Messaging</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm leading-relaxed">
              Select a conversation from the sidebar or start a new encrypted chat with verified
              classmates and project groups.
            </p>
            <Button
              onClick={() => setIsNewChatModalOpen(true)}
              className="mt-4 gap-2 font-bold text-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Start New Chat</span>
            </Button>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <Modal open={isNewChatModalOpen} onOpenChange={setIsNewChatModalOpen}>
        <ModalContent className="sm:max-w-md">
          <ModalHeader>
            <ModalTitle>New Campus Conversation</ModalTitle>
            <ModalDescription>
              Connect 1-on-1 with a classmate or create a project group.
            </ModalDescription>
          </ModalHeader>

          {/* Toggle Type */}
          <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold mb-3">
            <button
              type="button"
              onClick={() => setChatTypeTab('direct')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                chatTypeTab === 'direct' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Direct Message
            </button>
            <button
              type="button"
              onClick={() => setChatTypeTab('group')}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                chatTypeTab === 'group' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Group Chat
            </button>
          </div>

          <form onSubmit={handleStartNewChat} className="space-y-3.5">
            {chatTypeTab === 'direct' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient's Student Username
                </label>
                <Input
                  type="text"
                  placeholder="e.g. alex_j"
                  value={targetUsername}
                  onChange={(e) => setTargetUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  leftIcon={<span className="font-mono text-slate-400">@</span>}
                  required
                />
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Group Title
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Robotics Hackathon Team"
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Group Category
                  </label>
                  <select
                    value={groupType}
                    onChange={(e) => setGroupType(e.target.value as any)}
                    className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900"
                  >
                    <option value="project_team">Project / Hackathon Team</option>
                    <option value="club">Club Committee</option>
                    <option value="event">Campus Event Cohort</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Initial Members (Usernames separated by comma)
                  </label>
                  <Input
                    type="text"
                    placeholder="alex_j, sarah_k"
                    value={groupMembersText}
                    onChange={(e) => setGroupMembersText(e.target.value)}
                  />
                </div>
              </>
            )}

            <ModalFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewChatModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isCreatingChat} className="font-bold text-xs">
                Create Conversation
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Report Modal */}
      {reportTargetId && (
        <ReportModal
          isOpen={Boolean(reportTargetId)}
          onClose={() => setReportTargetId(null)}
          targetType="profile"
          targetId={reportTargetId}
        />
      )}
    </div>
  );
};
