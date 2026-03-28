'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle,
  Search,
  Filter,
  Clock,
  CheckCircle2,
  XCircle,
  User,
  Send,
  MoreVertical,
  Phone,
  Mail,
  Star,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  senderType: 'customer' | 'admin' | 'bot';
  senderName: string;
  senderId?: string;
  createdAt: string;
  type: string;
  isRead: boolean;
}

interface ChatConversation {
  id: string;
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  subject?: string;
  status: 'waiting' | 'active' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  rating?: number;
  createdAt: string;
  user?: {
    id: string;
    name?: string;
    email: string;
    image?: string;
  };
  assignee?: {
    id: string;
    name?: string;
    email: string;
    image?: string;
  };
  _count?: {
    messages: number;
  };
}

const statusColors: Record<string, string> = {
  waiting: 'bg-yellow-500',
  active: 'bg-green-500',
  resolved: 'bg-blue-500',
  closed: 'bg-gray-500',
};

const statusLabels: Record<string, string> = {
  waiting: 'في الانتظار',
  active: 'نشط',
  resolved: 'تم الحل',
  closed: 'مغلق',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const priorityLabels: Record<string, string> = {
  low: 'منخفض',
  normal: 'عادي',
  high: 'عالي',
  urgent: 'عاجل',
};

export default function ChatManagement() {
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversations
  const loadConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      params.append('page', page.toString());

      const response = await fetch(`/api/chat/conversations?${params}`);
      const data = await response.json();

      setConversations(data.conversations || []);
      setStatusCounts(data.statusCounts || {});
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.error('Error loading conversations:', error);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for selected conversation
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input
  useEffect(() => {
    if (selectedConversation) {
      inputRef.current?.focus();
    }
  }, [selectedConversation]);

  // Polling for new messages
  useEffect(() => {
    if (!selectedConversation) return;

    const interval = setInterval(() => {
      loadMessages(selectedConversation.id);
      loadConversations();
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConversation, loadConversations]);

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(
        `/api/chat/messages?conversationId=${conversationId}`
      );
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !selectedConversation) return;

    const messageText = input.trim();
    setInput('');
    setIsLoading(true);

    // Optimistically add message
    const tempMessage: Message = {
      id: 'temp-' + Date.now(),
      content: messageText,
      senderType: 'admin',
      senderName: 'أنت',
      createdAt: new Date().toISOString(),
      type: 'text',
      isRead: true,
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: messageText,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessages(prev =>
          prev.map(m => (m.id === tempMessage.id ? data : m))
        );
        loadConversations();
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (status: string) => {
    if (!selectedConversation) return;

    try {
      const response = await fetch(
        `/api/chat/conversations/${selectedConversation.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        setSelectedConversation(prev =>
          prev ? { ...prev, status: status as any } : null
        );
        loadConversations();
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const updatePriority = async (priority: string) => {
    if (!selectedConversation) return;

    try {
      const response = await fetch(
        `/api/chat/conversations/${selectedConversation.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ priority }),
        }
      );

      if (response.ok) {
        setSelectedConversation(prev =>
          prev ? { ...prev, priority: priority as any } : null
        );
        loadConversations();
      }
    } catch (error) {
      console.error('Error updating priority:', error);
    }
  };

  const deleteConversation = async () => {
    if (!selectedConversation) return;

    if (!confirm('هل أنت متأكد من حذف هذه المحادثة؟')) return;

    try {
      const response = await fetch(
        `/api/chat/conversations/${selectedConversation.id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        setSelectedConversation(null);
        setMessages([]);
        loadConversations();
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    if (days < 7) return `منذ ${days} يوم`;
    return date.toLocaleDateString('ar-EG');
  };

  const filteredConversations = conversations.filter(c => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.guestName?.toLowerCase().includes(query) ||
      c.guestEmail?.toLowerCase().includes(query) ||
      c.user?.name?.toLowerCase().includes(query) ||
      c.user?.email.toLowerCase().includes(query) ||
      c.lastMessage?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="flex h-[calc(100vh-12rem)] rounded-lg border bg-background overflow-hidden">
      {/* Conversations List */}
      <div className="w-80 border-l flex flex-col">
        {/* Filters */}
        <div className="p-3 border-b space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pr-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="تصفية حسب الحالة" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="waiting">
                في الانتظار ({statusCounts.waiting || 0})
              </SelectItem>
              <SelectItem value="active">
                نشط ({statusCounts.active || 0})
              </SelectItem>
              <SelectItem value="resolved">
                تم الحل ({statusCounts.resolved || 0})
              </SelectItem>
              <SelectItem value="closed">
                مغلق ({statusCounts.closed || 0})
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* List */}
        <ScrollArea className="flex-1">
          <div className="divide-y">
            {filteredConversations.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                لا توجد محادثات
              </div>
            ) : (
              filteredConversations.map(conversation => (
                <button
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation)}
                  className={cn(
                    'w-full p-3 text-right hover:bg-muted/50 transition-colors',
                    selectedConversation?.id === conversation.id &&
                      'bg-muted'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={conversation.user?.image} />
                      <AvatarFallback>
                        {conversation.user?.name?.[0] ||
                          conversation.guestName?.[0] ||
                          'ز'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium truncate">
                          {conversation.user?.name ||
                            conversation.guestName ||
                            'زائر'}
                        </p>
                        <div className="flex items-center gap-1">
                          <div
                            className={cn(
                              'h-2 w-2 rounded-full',
                              statusColors[conversation.status]
                            )}
                          />
                          {conversation.unreadCount > 0 && (
                            <Badge
                              variant="destructive"
                              className="h-5 px-1.5 text-xs"
                            >
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conversation.lastMessage}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {formatTime(conversation.lastMessageAt || conversation.createdAt)}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            priorityColors[conversation.priority]
                          )}
                        >
                          {priorityLabels[conversation.priority]}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      {selectedConversation ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={selectedConversation.user?.image} />
                  <AvatarFallback>
                    {selectedConversation.user?.name?.[0] ||
                      selectedConversation.guestName?.[0] ||
                      'ز'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">
                    {selectedConversation.user?.name ||
                      selectedConversation.guestName ||
                      'زائر'}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {selectedConversation.user?.email && (
                      <a
                        href={`mailto:${selectedConversation.user.email}`}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <Mail className="h-3 w-3" />
                        {selectedConversation.user.email}
                      </a>
                    )}
                    {selectedConversation.guestEmail && (
                      <a
                        href={`mailto:${selectedConversation.guestEmail}`}
                        className="flex items-center gap-1 hover:text-primary"
                      >
                        <Mail className="h-3 w-3" />
                        {selectedConversation.guestEmail}
                      </a>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedConversation.status}
                  onValueChange={updateStatus}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiting">في الانتظار</SelectItem>
                    <SelectItem value="active">نشط</SelectItem>
                    <SelectItem value="resolved">تم الحل</SelectItem>
                    <SelectItem value="closed">مغلق</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={selectedConversation.priority}
                  onValueChange={updatePriority}
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفض</SelectItem>
                    <SelectItem value="normal">عادي</SelectItem>
                    <SelectItem value="high">عالي</SelectItem>
                    <SelectItem value="urgent">عاجل</SelectItem>
                  </SelectContent>
                </Select>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={deleteConversation}>
                      <Trash2 className="ml-2 h-4 w-4" />
                      حذف المحادثة
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-2',
                    message.senderType === 'admin' ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback
                      className={cn(
                        message.senderType === 'customer'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-secondary-foreground'
                      )}
                    >
                      {message.senderType === 'customer'
                        ? selectedConversation.user?.name?.[0] ||
                          selectedConversation.guestName?.[0] ||
                          'ز'
                        : 'م'}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      'max-w-[70%] rounded-2xl px-3 py-2',
                      message.senderType === 'admin'
                        ? 'bg-primary text-primary-foreground rounded-tl-none'
                        : 'bg-secondary text-secondary-foreground rounded-tr-none'
                    )}
                  >
                    {message.senderType === 'admin' && (
                      <p className="text-xs font-semibold mb-1 opacity-70">
                        {message.senderName}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">
                      {message.content}
                    </p>
                    <p
                      className={cn(
                        'text-xs mt-1 opacity-60',
                        message.senderType === 'admin' ? 'text-left' : 'text-right'
                      )}
                    >
                      {formatTime(message.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t p-3">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder="اكتب ردك..."
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* No conversation selected */
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground">
              اختر محادثة للبدء
            </h3>
            <p className="text-sm text-muted-foreground/70">
              اختر محادثة من القائمة للرد على العملاء
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
