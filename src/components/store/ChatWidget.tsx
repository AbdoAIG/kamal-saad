'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useStore } from '@/store/useStore';

interface Message {
  id: string;
  content: string;
  senderType: 'customer' | 'admin' | 'bot';
  senderName: string;
  createdAt: string;
  type: string;
}

interface Conversation {
  id: string;
  status: string;
  messages: Message[];
}

export default function ChatWidget() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showStartForm, setShowStartForm] = useState(true);
  const [guestInfo, setGuestInfo] = useState({ name: '', email: '', phone: '' });
  const [initialMessage, setInitialMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { user, isAuthenticated } = useStore();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && !showStartForm) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized, showStartForm]);

  // Check for existing conversation on mount
  useEffect(() => {
    if (isOpen) {
      checkExistingConversation();
    }
  }, [isOpen]);

  const checkExistingConversation = async () => {
    try {
      const response = await fetch('/api/chat/conversations');
      const data = await response.json();

      if (data.conversations && data.conversations.length > 0) {
        const latestConversation = data.conversations[0];
        setConversation(latestConversation);
        setShowStartForm(false);
        await loadMessages(latestConversation.id);
      }
    } catch (error) {
      console.error('Error checking conversation:', error);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const startConversation = async () => {
    if (!initialMessage.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestName: !isAuthenticated ? guestInfo.name || 'زائر' : undefined,
          guestEmail: !isAuthenticated ? guestInfo.email : undefined,
          guestPhone: !isAuthenticated ? guestInfo.phone : undefined,
          message: initialMessage,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setConversation(data);
        setMessages(data.messages || []);
        setShowStartForm(false);
        setInitialMessage('');
        if (!isAuthenticated) {
          setGuestInfo({ name: '', email: '', phone: '' });
        }
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || !conversation) return;

    const messageText = input.trim();
    setInput('');
    setIsLoading(true);

    // Optimistically add message
    const tempMessage: Message = {
      id: 'temp-' + Date.now(),
      content: messageText,
      senderType: 'customer',
      senderName: user?.userName || 'أنت',
      createdAt: new Date().toISOString(),
      type: 'text',
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          content: messageText,
          guestName: !isAuthenticated ? user?.userName || 'زائر' : undefined,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        // Replace temp message with real one
        setMessages(prev =>
          prev.map(m => (m.id === tempMessage.id ? data : m))
        );
      } else {
        // Remove temp message on error
        setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showStartForm) {
        startConversation();
      } else {
        sendMessage();
      }
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Polling for new messages
  useEffect(() => {
    if (!isOpen || isMinimized || !conversation) return;

    const interval = setInterval(() => {
      loadMessages(conversation.id);
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen, isMinimized, conversation]);

  // Don't show chat widget on admin pages
  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      {/* Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed bottom-6 left-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300',
          'bg-primary text-primary-foreground hover:bg-primary/90',
          isOpen && 'scale-0'
        )}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {/* Chat Window */}
      <div
        className={cn(
          'fixed bottom-6 left-6 z-50 flex flex-col rounded-2xl bg-background shadow-2xl transition-all duration-300',
          'border border-border overflow-hidden',
          isMinimized ? 'h-12 w-72' : 'h-[500px] w-96',
          !isOpen && 'scale-0 opacity-0'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <div>
              <h3 className="font-semibold text-sm">الدعم الفني</h3>
              {!isMinimized && (
                <p className="text-xs opacity-80">نحن هنا لمساعدتك</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="rounded-full p-1 hover:bg-primary-foreground/20"
            >
              {isMinimized ? (
                <Maximize2 className="h-4 w-4" />
              ) : (
                <Minimize2 className="h-4 w-4" />
              )}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 hover:bg-primary-foreground/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {!isMinimized && (
          <>
            {showStartForm ? (
              /* Start Conversation Form */
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-4">
                  <div className="text-center mb-6">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <MessageCircle className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="font-semibold">مرحباً بك!</h4>
                    <p className="text-sm text-muted-foreground">
                      كيف يمكننا مساعدتك اليوم؟
                    </p>
                  </div>

                  {!isAuthenticated && (
                    <div className="space-y-3">
                      <Input
                        placeholder="الاسم"
                        value={guestInfo.name}
                        onChange={e =>
                          setGuestInfo({ ...guestInfo, name: e.target.value })
                        }
                        className="text-right"
                      />
                      <Input
                        type="email"
                        placeholder="البريد الإلكتروني (اختياري)"
                        value={guestInfo.email}
                        onChange={e =>
                          setGuestInfo({ ...guestInfo, email: e.target.value })
                        }
                        className="text-right"
                      />
                      <Input
                        type="tel"
                        placeholder="رقم الهاتف (اختياري)"
                        value={guestInfo.phone}
                        onChange={e =>
                          setGuestInfo({ ...guestInfo, phone: e.target.value })
                        }
                        className="text-right"
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <textarea
                      placeholder="اكتب رسالتك هنا..."
                      value={initialMessage}
                      onChange={e => setInitialMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-right placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <Button
                      onClick={startConversation}
                      disabled={!initialMessage.trim() || isLoading}
                      className="w-full"
                    >
                      {isLoading ? 'جاري الإرسال...' : 'بدء المحادثة'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              /* Chat Messages */
              <>
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map(message => (
                      <div
                        key={message.id}
                        className={cn(
                          'flex gap-2',
                          message.senderType === 'customer'
                            ? 'flex-row-reverse'
                            : 'flex-row'
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
                              ? 'أ'
                              : message.senderType === 'bot'
                              ? '🤖'
                              : 'م'}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            'max-w-[70%] rounded-2xl px-3 py-2',
                            message.senderType === 'customer'
                              ? 'bg-primary text-primary-foreground rounded-tl-none'
                              : 'bg-secondary text-secondary-foreground rounded-tr-none'
                          )}
                        >
                          {message.senderType !== 'customer' && (
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
                              message.senderType === 'customer'
                                ? 'text-left'
                                : 'text-right'
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
                      placeholder="اكتب رسالتك..."
                      value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading}
                      className="flex-1 text-right"
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
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
