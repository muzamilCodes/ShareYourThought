'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useSession } from '@/hooks/useSession';
import type { Conversation, Message, User } from '@/types';

function formatChatTime(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffHours < 24 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const targetUserParam = searchParams.get('user');

  const { session, ready } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activePartner, setActivePartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const activePartnerRef = useRef<User | null>(null);

  useEffect(() => {
    activePartnerRef.current = activePartner;
  }, [activePartner]);

  // Auto-scroll to bottom of messages
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Load all user conversations
  const loadConversations = async (token: string) => {
    try {
      const res = await api.getConversations(token);
      setConversations(res.conversations || []);
    } catch {
      setConversations([]);
    } finally {
      setLoadingList(false);
    }
  };

  // Load specific chat messages
  const loadChat = async (partnerIdOrUsername: string, token: string, silent = false) => {
    if (!silent) setLoadingChat(true);
    try {
      const res = await api.getMessages(partnerIdOrUsername, token);
      if (res?.partner) {
        setActivePartner(res.partner);
        activePartnerRef.current = res.partner;
        setMessages(res.messages || []);
      }
    } catch {
      // ignore
    } finally {
      if (!silent) {
        setLoadingChat(false);
        setTimeout(() => scrollToBottom('auto'), 80);
      }
    }
  };

  // Initial load
  useEffect(() => {
    if (!ready || !session?.token) return;
    loadConversations(session.token);

    if (targetUserParam) {
      loadChat(targetUserParam, session.token);
    }
  }, [ready, session?.token, targetUserParam]);

  // Real-time polling every 2.5 seconds for active chat & conversation updates
  useEffect(() => {
    if (!session?.token) return;

    const interval = setInterval(() => {
      // Poll conversations quietly
      api.getConversations(session.token).then((res) => {
        if (res?.conversations) setConversations(res.conversations);
      }).catch(() => {});

      // Poll active chat if open
      const currentPartner = activePartnerRef.current;
      if (currentPartner) {
        const partnerIdentifier = currentPartner._id || currentPartner.id || currentPartner.username;
        if (partnerIdentifier) {
          api.getMessages(partnerIdentifier, session.token).then((res) => {
            if (res?.messages) {
              setMessages((prev) => {
                if (res.messages.length !== prev.length) {
                  setTimeout(() => scrollToBottom('smooth'), 50);
                }
                return res.messages;
              });
            }
          }).catch(() => {});
        }
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [session?.token]);

  // Handle Search for Users
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.searchUsers(searchQuery.trim());
        setSearchResults(res.users || []);
      } catch {
        setSearchResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Scroll to bottom when message count changes
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length]);

  const handleSelectPartner = (partner: User) => {
    setActivePartner(partner);
    setSearchQuery('');
    setSearchResults([]);
    if (session?.token) {
      const idOrUser = partner._id || partner.id || partner.username;
      loadChat(idOrUser, session.token);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activePartner || !session?.token || sending) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSending(true);

    const partnerId = activePartner._id || activePartner.id || activePartner.username;

    // Optimistic UI update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      _id: tempId,
      sender: session.user,
      recipient: activePartner,
      content: textToSend,
      read: false,
      createdAt: new Date().toISOString()
    };
    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => scrollToBottom('smooth'), 30);

    try {
      const res = await api.sendMessage(partnerId, textToSend, session.token);
      if (res?.message) {
        setMessages((prev) =>
          prev.map((m) => (m._id === tempId ? res.message : m))
        );
        // Refresh conversations list snippet
        loadConversations(session.token);
      }
    } catch {
      // revert optimistic on failure
      setMessages((prev) => prev.filter((m) => m._id !== tempId));
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  if (ready && !session) {
    return (
      <div className="page container" style={{ maxWidth: '650px' }}>
        <div style={{ textAlign: 'center', padding: '60px 24px', background: 'var(--paper)', borderRadius: '20px', border: '1px solid var(--line)' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '12px' }}>💬</span>
          <h1 className="display-title" style={{ fontSize: '1.6rem', marginBottom: '8px', color: 'var(--ink)' }}>
            Sign in to Chat
          </h1>
          <p className="section-copy" style={{ margin: '0 auto 20px auto', fontSize: '0.92rem', maxWidth: '38ch' }}>
            Send direct messages, share ideas, and connect one-on-one with Share Your Thoughts creators.
          </p>
          <Link href="/login" className="button">
            Login to Share Your Thoughts
          </Link>
        </div>
      </div>
    );
  }

  const currentUserId = session?.user?._id || session?.user?.id;

  return (
    <div className="chat-container">
      {/* =========================================================
          LEFT PANE: CONVERSATIONS LIST & USER SEARCH
      ========================================================= */}
      <div className={`chat-sidebar ${activePartner ? 'has-active-chat' : ''}`}>
        <div className="chat-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
              💬 Messages
            </h1>
          </div>

          {/* Search bar */}
          <div className="chat-search-wrap">
            <span style={{ fontSize: '0.85rem' }}>🔍</span>
            <input
              type="text"
              placeholder="Search or start new chat…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="chat-search-input"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '0.8rem' }}
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        {/* User Search Results */}
        {searchQuery.trim() && (
          <div className="chat-search-results">
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', padding: '8px 16px', textTransform: 'uppercase' }}>
              People
            </div>
            {searchResults.length ? (
              searchResults
                .filter((u) => (u._id || u.id) !== currentUserId)
                .map((u) => {
                  const avatar = u.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(u.name)}`;
                  return (
                    <div
                      key={u._id || u.id}
                      className="chat-conv-item"
                      onClick={() => handleSelectPartner(u)}
                    >
                      <img src={avatar} alt={u.name} className="chat-conv-avatar" />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.90rem', color: 'var(--ink)' }}>{u.name}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>@{u.username}</div>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.86rem' }}>
                No users found
              </div>
            )}
          </div>
        )}

        {/* Conversations List */}
        <div className="chat-conversations-list">
          {loadingList ? (
            <div style={{ padding: '30px', textAlign: 'center', color: 'var(--muted)', fontSize: '0.88rem' }}>
              Loading chats…
            </div>
          ) : conversations.length ? (
            conversations.map((conv) => {
              const partner = conv.partner;
              if (!partner) return null;
              const pId = partner._id || partner.id;
              const isSelected = activePartner && (activePartner._id === pId || activePartner.id === pId);
              const avatar = partner.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(partner.name || 'User')}`;

              return (
                <div
                  key={pId}
                  className={`chat-conv-item ${isSelected ? 'is-active' : ''}`}
                  onClick={() => handleSelectPartner(partner)}
                >
                  <div style={{ position: 'relative' }}>
                    <img src={avatar} alt={partner.name} className="chat-conv-avatar" />
                    {conv.unreadCount > 0 ? (
                      <span className="chat-unread-badge">{conv.unreadCount}</span>
                    ) : null}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                      <span style={{ fontWeight: conv.unreadCount > 0 ? 800 : 700, fontSize: '0.90rem', color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {partner.name}
                      </span>
                      {conv.lastMessage?.createdAt && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--muted)', flexShrink: 0, marginLeft: '6px' }}>
                          {formatChatTime(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.80rem', color: conv.unreadCount > 0 ? 'var(--ink)' : 'var(--muted)', fontWeight: conv.unreadCount > 0 ? 700 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {conv.lastMessage?.isSender ? 'You: ' : ''}
                      {conv.lastMessage?.content || 'Started conversation'}
                    </div>
                  </div>
                </div>
              );
            })
          ) : !searchQuery ? (
            <div style={{ padding: '40px 20px', textAlign: 'center' }}>
              <span style={{ fontSize: '2rem', display: 'block', marginBottom: '8px' }}>✉️</span>
              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>
                No messages yet. Search for a user above to start chatting!
              </p>
            </div>
          ) : null}
        </div>
      </div>

      {/* =========================================================
          RIGHT PANE: ACTIVE CHAT THREAD
      ========================================================= */}
      <div className={`chat-main ${!activePartner ? 'is-empty-pane' : ''}`}>
        {activePartner ? (
          <>
            {/* Chat Top Header */}
            <div className="chat-header">
              <button
                type="button"
                className="chat-back-btn mobile-only"
                onClick={() => setActivePartner(null)}
                aria-label="Back to conversations"
              >
                ←
              </button>

              <img
                src={
                  activePartner.avatar ||
                  `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(activePartner.name || 'User')}`
                }
                alt={activePartner.name}
                className="chat-header-avatar"
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--ink)' }}>
                    {activePartner.name}
                  </span>
                  {activePartner.isPrivate ? <span title="Private Account">🔒</span> : null}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                  @{activePartner.username}
                </div>
              </div>

              <Link
                href={`/profile/${activePartner.username}`}
                className="button-ghost"
                style={{ fontSize: '0.80rem', padding: '6px 12px', borderRadius: '12px' }}
              >
                View Profile →
              </Link>
            </div>

            {/* Chat Messages Body */}
            <div className="chat-messages-body">
              {loadingChat ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontSize: '0.88rem' }}>
                  Loading message history…
                </div>
              ) : messages.length ? (
                messages.map((msg) => {
                  const sId = msg.sender?._id || msg.sender?.id || (typeof msg.sender === 'string' ? msg.sender : '');
                  const isMe = sId.toString() === currentUserId?.toString();

                  return (
                    <div
                      key={msg._id}
                      className={`chat-bubble-row ${isMe ? 'is-me' : 'is-partner'}`}
                    >
                      <div className={`chat-bubble ${isMe ? 'chat-bubble-me' : 'chat-bubble-partner'}`}>
                        <div className="chat-bubble-text">{msg.content}</div>
                        <div className="chat-bubble-meta">
                          <span>{formatChatTime(msg.createdAt)}</span>
                          {isMe && (
                            <span style={{ fontSize: '0.72rem', marginLeft: '4px' }}>
                              {msg.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
                  <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '8px' }}>👋</span>
                  <p style={{ margin: '0 0 6px 0', fontWeight: 700, color: 'var(--ink)', fontSize: '1rem' }}>
                    Say hello to {activePartner.name}!
                  </p>
                  <p style={{ margin: 0, fontSize: '0.84rem' }}>
                    This is the start of your direct conversation.
                  </p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Compose Bar */}
            <form className="chat-compose-bar" onSubmit={handleSendMessage}>
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message ${activePartner.name}…`}
                className="chat-compose-input"
                maxLength={2000}
              />

              <button
                type="submit"
                disabled={!inputText.trim() || sending}
                className="button"
                style={{
                  minHeight: 'auto',
                  padding: '8px 18px',
                  borderRadius: '20px',
                  fontSize: '0.86rem',
                  fontWeight: 700,
                  opacity: !inputText.trim() || sending ? 0.5 : 1
                }}
              >
                Send ✈️
              </button>
            </form>
          </>
        ) : (
          <div className="chat-empty-state">
            <div className="chat-empty-icon">💬</div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 8px 0', color: 'var(--ink)' }}>
              Your Messages
            </h2>
            <p style={{ maxWidth: '38ch', margin: '0 0 20px 0', fontSize: '0.92rem', color: 'var(--muted)', lineHeight: 1.5 }}>
              Send private thoughts, ideas, and connect directly with other writers on Share Your Thoughts.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="page container" style={{ textAlign: 'center', padding: '60px 0' }}>
          <p className="empty-state">Loading messages…</p>
        </div>
      }
    >
      <MessagesContent />
    </Suspense>
  );
}
