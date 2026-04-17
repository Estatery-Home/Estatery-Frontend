"use client";

/**
 * Messages – real 1:1 threads via GET/POST /api/messages/conversations/…
 * Query: ?conversationId=1 | ?userId=5 (opens or creates thread with that user)
 */
import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Send,
  Search,
  MessageCircle,
  ChevronRight,
  Phone,
  UserPlus,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/contexts/NotificationsContext";
import {
  fetchMessageConversations,
  openMessageConversation,
  fetchConversationMessages,
  postConversationMessage,
} from "@/lib/api-client";
import type { ConversationSummary, ThreadMessage } from "@/lib/api-types";

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

function initials(username: string): string {
  const t = username.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

function formatMessageTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function Messages() {
  const query = useQuery();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { refreshUnreadCount } = useNotifications();

  const [conversations, setConversations] = React.useState<ConversationSummary[]>([]);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [thread, setThread] = React.useState<ThreadMessage[]>([]);
  const [input, setInput] = React.useState("");
  const [chatSearch, setChatSearch] = React.useState("");
  const [newUserId, setNewUserId] = React.useState("");
  const [listLoading, setListLoading] = React.useState(true);
  const [threadLoading, setThreadLoading] = React.useState(false);
  const [listError, setListError] = React.useState<string | null>(null);
  const [sendError, setSendError] = React.useState<string | null>(null);
  const [opening, setOpening] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);
  const openedUserRef = React.useRef(false);

  const loadConversations = React.useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setListError(null);
      const list = await fetchMessageConversations();
      setConversations(list);
    } catch {
      setListError("Could not load conversations.");
    } finally {
      setListLoading(false);
    }
  }, [isAuthenticated]);

  React.useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  React.useEffect(() => {
    if (!isAuthenticated) return;
    const t = setInterval(() => void loadConversations(), 15000);
    return () => clearInterval(t);
  }, [isAuthenticated, loadConversations]);

  const loadThread = React.useCallback(
    async (conversationId: number) => {
      setThreadLoading(true);
      try {
        const msgs = await fetchConversationMessages(conversationId);
        setThread(msgs);
        void refreshUnreadCount();
      } finally {
        setThreadLoading(false);
      }
    },
    [refreshUnreadCount]
  );

  React.useEffect(() => {
    if (!selectedId) {
      setThread([]);
      return;
    }
    void loadThread(selectedId);
    const poll = setInterval(() => void loadThread(selectedId), 5000);
    return () => clearInterval(poll);
  }, [selectedId, loadThread]);

  /* Deep link: ?userId= — open once */
  React.useEffect(() => {
    const raw = query.get("userId");
    if (!raw || !isAuthenticated || openedUserRef.current) return;
    const uid = Number(raw);
    if (!Number.isFinite(uid) || uid < 1) return;
    openedUserRef.current = true;
    (async () => {
      try {
        setOpening(true);
        const { conversation } = await openMessageConversation(uid);
        setConversations((prev) => {
          const rest = prev.filter((c) => c.id !== conversation.id);
          return [conversation, ...rest];
        });
        setSelectedId(conversation.id);
        navigate(`/dashboard/messages?conversationId=${conversation.id}`, { replace: true });
      } catch (e) {
        setListError(e instanceof Error ? e.message : "Could not open chat.");
        openedUserRef.current = false;
      } finally {
        setOpening(false);
      }
    })();
  }, [query, isAuthenticated, navigate]);

  /* Deep link: ?conversationId= */
  React.useEffect(() => {
    const raw = query.get("conversationId");
    if (!raw) return;
    const id = Number(raw);
    if (Number.isFinite(id) && id > 0) setSelectedId(id);
  }, [query]);

  const selected = conversations.find((c) => c.id === selectedId);
  const other = selected?.other_user;

  const filtered = React.useMemo(() => {
    const term = chatSearch.trim().toLowerCase();
    if (!term) return conversations;
    return conversations.filter(
      (c) =>
        c.other_user?.username.toLowerCase().includes(term) ||
        c.other_user?.email.toLowerCase().includes(term) ||
        String(c.id).includes(term)
    );
  }, [conversations, chatSearch]);

  const selectConversation = (id: number) => {
    setSelectedId(id);
    navigate(`/dashboard/messages?conversationId=${id}`);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !selectedId || !user) return;
    setSendError(null);
    try {
      const msg = await postConversationMessage(selectedId, text);
      setInput("");
      setThread((prev) => [...prev, msg]);
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedId
            ? {
                ...c,
                last_message: {
                  body: msg.body.slice(0, 200),
                  created_at: msg.created_at,
                  sender_id: msg.sender_id,
                },
                updated_at: msg.created_at,
              }
            : c
        )
      );
      void loadConversations();
    } catch (e) {
      setSendError(e instanceof Error ? e.message : "Send failed.");
    }
  };

  const handleOpenByUserId = async () => {
    const uid = Number(newUserId.trim());
    if (!Number.isFinite(uid) || uid < 1) {
      setListError("Enter a valid numeric user ID.");
      return;
    }
    setListError(null);
    try {
      setOpening(true);
      const { conversation } = await openMessageConversation(uid);
      setConversations((prev) => {
        const rest = prev.filter((c) => c.id !== conversation.id);
        return [conversation, ...rest];
      });
      setNewUserId("");
      selectConversation(conversation.id);
    } catch (e) {
      setListError(e instanceof Error ? e.message : "Could not start chat.");
    } finally {
      setOpening(false);
    }
  };

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const phoneDigits = (other?.phone ?? "").replace(/\D/g, "");

  if (!isAuthenticated) {
    return (
      <DashboardLayout>
        <p className="text-[#64748b]">Log in to use messages.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header className="rounded-xl border border-[#e2e8f0] bg-white px-4 py-4 shadow-sm sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[#1e293b]">Messages</h1>
              <p className="mt-1 text-xs text-[#64748b]">
                Real conversations stored on the server. Open a chat with any user by ID, or pick an existing thread.
              </p>
            </div>
            {other && (
              <div className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white/90 px-4 py-2.5 shadow-sm">
                <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--logo-muted)] to-[var(--logo)]/30 text-sm font-semibold text-[var(--logo)]">
                  {initials(other.username)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#0f172a]">{other.username}</p>
                  <p className="truncate text-xs text-[#94a3b8]">User #{other.id}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {listError && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
            {listError}
          </div>
        )}

        <section className="flex flex-col overflow-x-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm md:flex-row md:items-stretch">
          <aside className="flex w-full shrink-0 flex-col border-b border-[#e2e8f0] bg-gradient-to-b from-[#fafbfc] to-[#f8fafc] md:w-80 md:border-b-0 md:border-r">
            <div className="border-b border-[#e2e8f0] px-4 py-4 space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                <Input
                  value={chatSearch}
                  onChange={(e) => setChatSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="h-9 w-full rounded-xl border-[#e2e8f0] bg-white pl-9 pr-3 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <Input
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  placeholder="User ID"
                  type="number"
                  min={1}
                  className="h-9 flex-1 rounded-xl border-[#e2e8f0] text-sm"
                />
                <Button
                  type="button"
                  size="sm"
                  disabled={opening}
                  onClick={() => void handleOpenByUserId()}
                  className="shrink-0 gap-1 bg-[var(--logo)] hover:bg-[var(--logo-hover)]"
                >
                  <UserPlus className="size-4" />
                  Chat
                </Button>
              </div>
              <p className="text-xs font-medium text-[#64748b]">
                {filtered.length} conversation{filtered.length !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="max-h-[min(60vh,520px)] space-y-0.5 overflow-y-auto py-2">
              {listLoading ? (
                <p className="px-4 py-6 text-center text-sm text-[#94a3b8]">Loading…</p>
              ) : (
                filtered.map((c) => {
                  const last = c.last_message;
                  const active = c.id === selectedId;
                  const name = c.other_user?.username ?? `User #${c.other_user?.id ?? "?"}`;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => selectConversation(c.id)}
                      className={cn(
                        "group mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all",
                        active
                          ? "bg-[var(--logo)]/15 text-[#0f172a] shadow-sm"
                          : "text-[#475569] hover:bg-white/80"
                      )}
                    >
                      <div
                        className={cn(
                          "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                          active ? "bg-[var(--logo)] text-white" : "bg-[var(--logo-muted)] text-[var(--logo)]"
                        )}
                      >
                        {initials(c.other_user?.username ?? "?")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{name}</p>
                        {last ? (
                          <p className="truncate text-xs text-[#94a3b8]">
                            {last.sender_id === user?.id ? "You: " : ""}
                            {last.body}
                          </p>
                        ) : (
                          <p className="text-xs italic text-[#94a3b8]">No messages yet</p>
                        )}
                      </div>
                      <ChevronRight
                        className={cn(
                          "size-4 shrink-0 text-[#cbd5e1]",
                          active ? "text-[var(--logo)]" : "opacity-0 group-hover:opacity-60"
                        )}
                      />
                    </button>
                  );
                })
              )}
              {!listLoading && filtered.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-[#94a3b8]">
                  No conversations. Enter a user ID above to start.
                </div>
              )}
            </div>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            {other && (
              <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-white/95 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-[var(--logo-muted)] text-sm font-semibold text-[var(--logo)]">
                    {initials(other.username)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#1e293b]">{other.username}</p>
                    <p className="text-xs text-[#64748b]">{other.email}</p>
                  </div>
                </div>
                {phoneDigits ? (
                  <a
                    href={`tel:${phoneDigits}`}
                    className="flex size-9 items-center justify-center rounded-lg text-[#64748b] hover:bg-[#f1f5f9] hover:text-[var(--logo)]"
                    aria-label="Call"
                  >
                    <Phone className="size-4" />
                  </a>
                ) : null}
              </div>
            )}

            <div
              className={cn(
                "relative min-h-[240px] flex-1 bg-[linear-gradient(to_bottom,#f8fafc_0%,#ffffff_100%)] px-4 py-4 md:min-h-[320px]",
                selectedId && "cursor-text"
              )}
              onClick={() => selectedId && textareaRef.current?.focus()}
            >
              {!selectedId ? (
                <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 py-8 text-center md:min-h-[320px]">
                  <div className="flex size-20 items-center justify-center rounded-2xl bg-[var(--logo-muted)]/50">
                    <MessageCircle className="size-10 text-[var(--logo)]" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-base font-medium text-[#1e293b]">Choose or start a conversation</p>
                    <p className="mt-1 text-sm text-[#64748b]">Select a thread or enter another user&apos;s numeric ID.</p>
                  </div>
                </div>
              ) : threadLoading && thread.length === 0 ? (
                <p className="py-8 text-center text-sm text-[#64748b]">Loading messages…</p>
              ) : thread.length === 0 ? (
                <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 py-8 text-center">
                  <MessageCircle className="size-8 text-[var(--logo)]" strokeWidth={1.5} />
                  <p className="text-sm text-[#64748b]">No messages yet. Say hello below.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {thread.map((m) => {
                    const isMe = m.sender_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={cn("flex w-full", isMe ? "justify-end" : "justify-start")}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm",
                            isMe
                              ? "rounded-br-md bg-gradient-to-br from-[var(--logo)] to-[var(--logo-hover)] text-white"
                              : "rounded-bl-md border border-[#e2e8f0] bg-white text-[#0f172a]"
                          )}
                        >
                          {!isMe && (
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                              {m.sender_username}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.body}</p>
                          <span
                            className={cn(
                              "mt-1 block text-[10px] font-medium",
                              isMe ? "text-white/80" : "text-[#94a3b8]"
                            )}
                          >
                            {formatMessageTime(m.created_at)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            <div className="border-t border-[#e2e8f0] bg-white/95 px-4 py-4">
              {sendError && <p className="mb-2 text-sm text-red-600">{sendError}</p>}
              <div className="flex items-end gap-3">
                <div className="min-w-0 flex-1">
                  <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={2}
                    placeholder={selectedId ? "Type a message…" : "Select a conversation"}
                    disabled={!selectedId}
                    className="w-full resize-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5 text-sm focus:border-[var(--logo)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20 disabled:opacity-60"
                  />
                </div>
                <Button
                  type="button"
                  onClick={() => void handleSend()}
                  disabled={!input.trim() || !selectedId}
                  className="size-11 shrink-0 rounded-xl bg-[var(--logo)] p-0 hover:bg-[var(--logo-hover)]"
                >
                  <Send className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
}
