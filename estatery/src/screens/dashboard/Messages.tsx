"use client";

/**
 * Messages – chat with clients; sidebar list, message thread.
 * URL ?clientId= selects client; mock messages per client.
 */
import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Paperclip,
  Image as ImageIcon,
  Send,
  Search,
  MessageCircle,
  ChevronRight,
  Phone,
} from "lucide-react";
import { useSidebarCollapse } from "@/hooks/use-sidebar-collapse";
import { Sidebar, TopBar, LogoutConfirmDialog } from "@/components/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientsTableData, getClientDetail } from "@/lib/clients";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: number;
  author: "you" | "client";
  text: string;
  timestamp: string;
};

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function Messages() {
  const query = useQuery();
  const navigate = useNavigate();
  const initialClientId = query.get("clientId") ?? clientsTableData[0]?.clientId;

  const [selectedClientId, setSelectedClientId] = React.useState<string | undefined>(
    initialClientId || undefined
  );

  const { logout } = useAuth();
  const { collapsed: sidebarCollapsed, onToggle } = useSidebarCollapse();
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [input, setInput] = React.useState("");
  const [chatSearch, setChatSearch] = React.useState("");

  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);

  const [messagesByClient, setMessagesByClient] = React.useState<Record<string, ChatMessage[]>>(
    () => {
      const initial: Record<string, ChatMessage[]> = {};
      clientsTableData.forEach((c) => {
        initial[c.clientId] = [
          {
            id: 1,
            author: "client",
            text: `Hi, this is ${c.name}. I have a question about my upcoming payment.`,
            timestamp: "09:15 AM",
          },
          {
            id: 2,
            author: "you",
            text: "Hello! Sure, I'd be happy to help.",
            timestamp: "09:17 AM",
          },
        ];
      });
      return initial;
    }
  );

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const imageInputRef = React.useRef<HTMLInputElement | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const selectedClient = selectedClientId
    ? clientsTableData.find((c) => c.clientId === selectedClientId)
    : undefined;

  const messages: ChatMessage[] = selectedClientId
    ? messagesByClient[selectedClientId] ?? []
    : [];

  // Filter clients by search
  const filteredClients = React.useMemo(() => {
    const term = chatSearch.trim().toLowerCase();
    if (!term) return clientsTableData;
    return clientsTableData.filter(
      (c) =>
        c.name.toLowerCase().includes(term) ||
        c.clientId.includes(term) ||
        c.propertyName.toLowerCase().includes(term)
    );
  }, [chatSearch]);

  const handleLogoutConfirm = () => {
    logout();
    setLogoutDialogOpen(false);
  };

  const pushMessage = (clientId: string, text: string, author: ChatMessage["author"]) => {
    setMessagesByClient((prev) => {
      const existing = prev[clientId] ?? [];
      const next: ChatMessage = {
        id: existing.length + 1,
        author,
        text,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      return { ...prev, [clientId]: [...existing, next] };
    });
  };

  const handleSend = () => {
    const text = input.trim();
    if (!text || !selectedClientId) return;
    pushMessage(selectedClientId, text, "you");
    setInput("");
  };

  // Auto-scroll to bottom when messages change
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
    navigate(`/dashboard/messages?clientId=${clientId}`);
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageButtonClick = () => {
    imageInputRef.current?.click();
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClientId) return;
    pushMessage(selectedClientId, `Sent a file: ${file.name}`, "you");
    event.target.value = "";
  };

  const handleImageChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.[0];
    if (!file || !selectedClientId) return;
    pushMessage(selectedClientId, `Sent an image: ${file.name}`, "you");
    event.target.value = "";
  };

  const handleChatAreaClick = () => {
    if (selectedClientId) textareaRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8fafc] via-[#f1f5f9] to-[#e2e8f0]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={onToggle}
        onLogoutClick={() => setLogoutDialogOpen(true)}
      />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[margin] duration-300",
          sidebarCollapsed ? "ml-[72px]" : "ml-[240px]"
        )}
      >
        <TopBar />
        <main className="min-h-[calc(100vh-2.75rem)] flex-1 overflow-auto p-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-6">
            {/* Header */}
            <header className="rounded-2xl border border-white/60 bg-white/80 px-6 py-5 shadow-lg shadow-slate-200/50 backdrop-blur-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="bg-gradient-to-r from-[#1e293b] to-[#475569] bg-clip-text text-2xl font-bold text-transparent">
                    Messages
                  </h1>
                  <p className="mt-1.5 text-sm text-[#64748b]">
                    Chat with your clients, share files, and keep all communication in one place.
                  </p>
                </div>
                {selectedClient && (
                  <div className="flex items-center gap-3 rounded-2xl border border-[#e2e8f0] bg-white/90 px-4 py-2.5 shadow-sm transition-all duration-200 hover:shadow-md">
                    <div className="relative">
                      <div className="flex size-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--logo-muted)] to-[var(--logo)]/30 text-sm font-semibold text-[var(--logo)]">
                        {selectedClient.avatarInitials}
                      </div>
                      <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-white bg-emerald-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#0f172a]">
                        {selectedClient.name}
                      </p>
                      <p className="truncate text-xs text-[#94a3b8]">
                        Client ID • {selectedClient.clientId}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </header>

            {/* Chat container */}
            <section className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-white/80 bg-white shadow-xl shadow-slate-200/50 md:flex-row">
              {/* Chats sidebar */}
              <aside className="flex w-full flex-col border-b border-[#e2e8f0] bg-gradient-to-b from-[#fafbfc] to-[#f8fafc] md:w-72 md:border-b-0 md:border-r">
                <div className="border-b border-[#e2e8f0] px-4 py-4">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94a3b8]" />
                    <Input
                      value={chatSearch}
                      onChange={(e) => setChatSearch(e.target.value)}
                      placeholder="Search conversations..."
                      className="h-9 w-full rounded-xl border-[#e2e8f0] bg-white pl-9 pr-3 text-sm placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:ring-2 focus:ring-[var(--logo)]/20"
                    />
                  </div>
                  <p className="mt-2 text-xs font-medium text-[#64748b]">
                    {filteredClients.length} conversation
                    {filteredClients.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex-1 space-y-0.5 overflow-y-auto py-2">
                  {filteredClients.map((c) => {
                    const msgs = messagesByClient[c.clientId] ?? [];
                    const last = msgs[msgs.length - 1];
                    const isActive = c.clientId === selectedClientId;
                    return (
                      <button
                        key={c.clientId}
                        type="button"
                        onClick={() => handleSelectClient(c.clientId)}
                        className={cn(
                          "group mx-2 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200",
                          isActive
                            ? "bg-[var(--logo)]/15 text-[#0f172a] shadow-sm"
                            : "text-[#475569] hover:bg-white/80 hover:text-[#1e293b]"
                        )}
                      >
                        <div
                          className={cn(
                            "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-transform duration-200 group-hover:scale-105",
                            isActive ? "bg-[var(--logo)] text-white" : "bg-[var(--logo-muted)] text-[var(--logo)]"
                          )}
                        >
                          {c.avatarInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{c.name}</p>
                          {last ? (
                            <p className="truncate text-xs text-[#94a3b8]">
                              {last.author === "you" ? "You: " : ""}
                              {last.text}
                            </p>
                          ) : (
                            <p className="text-xs italic text-[#94a3b8]">No messages yet</p>
                          )}
                        </div>
                        <ChevronRight
                          className={cn(
                            "size-4 shrink-0 text-[#cbd5e1] transition-all duration-200",
                            isActive ? "translate-x-0 text-[var(--logo)]" : "opacity-0 -translate-x-2 group-hover:opacity-60"
                          )}
                        />
                      </button>
                    );
                  })}
                  {filteredClients.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-[#94a3b8]">No conversations found</p>
                      <p className="mt-1 text-xs text-[#cbd5e1]">
                        Try a different search term
                      </p>
                    </div>
                  )}
                </div>
              </aside>

              {/* Chat area */}
              <div className="flex min-w-0 flex-1 flex-col">
                {/* Chat header (sticky) */}
                {selectedClient && (
                  <div className="flex items-center justify-between border-b border-[#e2e8f0] bg-white/95 px-4 py-3 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-[var(--logo-muted)] text-sm font-semibold text-[var(--logo)]">
                        {selectedClient.avatarInitials}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1e293b]">
                          {selectedClient.name}
                        </p>
                        <p className="text-xs text-[#64748b]">Client • {selectedClient.clientId}</p>
                      </div>
                    </div>
                    <a
                      href={`tel:${(getClientDetail(selectedClient.clientId)?.phone ?? "").replace(/\D/g, "")}`}
                      className="flex size-9 items-center justify-center rounded-lg text-[#64748b] transition-colors hover:bg-[#f1f5f9] hover:text-[var(--logo)]"
                      aria-label="Call client"
                    >
                      <Phone className="size-4" />
                    </a>
                  </div>
                )}

                {/* Messages area */}
                <div
                  onClick={handleChatAreaClick}
                  className={cn(
                    "relative flex-1 overflow-y-auto bg-[linear-gradient(to_bottom,#f8fafc_0%,#ffffff_100%)] px-4 py-4",
                    selectedClientId && "cursor-text"
                  )}
                >
                  {!selectedClient ? (
                    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 text-center">
                      <div className="flex size-20 items-center justify-center rounded-2xl bg-[var(--logo-muted)]/50">
                        <MessageCircle className="size-10 text-[var(--logo)]" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-base font-medium text-[#1e293b]">
                          Choose a conversation
                        </p>
                        <p className="mt-1 text-sm text-[#64748b]">
                          Select a client from the list to start chatting
                        </p>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-4 text-center">
                      <div className="flex size-16 items-center justify-center rounded-2xl bg-[var(--logo-muted)]/50">
                        <MessageCircle className="size-8 text-[var(--logo)]" strokeWidth={1.5} />
                      </div>
                      <p className="text-sm text-[#64748b]">
                        No messages yet. Start the conversation!
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className={cn(
                            "flex w-full transition-opacity duration-200",
                            m.author === "you" ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "group relative max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-200",
                              m.author === "you"
                                ? "rounded-br-md bg-gradient-to-br from-[var(--logo)] to-[var(--logo-hover)] text-white"
                                : "rounded-bl-md border border-[#e2e8f0] bg-white text-[#0f172a] shadow-sm hover:shadow-md"
                            )}
                          >
                            <p className="text-sm leading-relaxed">{m.text}</p>
                            <span
                              className={cn(
                                "mt-1 block text-[10px] font-medium",
                                m.author === "you" ? "text-white/80" : "text-[#94a3b8]"
                              )}
                            >
                              {m.timestamp}
                            </span>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Input area */}
                <div className="border-t border-[#e2e8f0] bg-white/95 px-4 py-4 backdrop-blur-sm">
                  <div className="flex items-end gap-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleFileButtonClick}
                        disabled={!selectedClientId}
                        className="flex size-10 items-center justify-center rounded-xl border border-[#e2e8f0] text-[#64748b] transition-all duration-200 hover:border-[var(--logo)]/50 hover:bg-[var(--logo-muted)]/50 hover:text-[var(--logo)] disabled:opacity-50 disabled:hover:bg-transparent"
                        aria-label="Attach file"
                      >
                        <Paperclip className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleImageButtonClick}
                        disabled={!selectedClientId}
                        className="flex size-10 items-center justify-center rounded-xl border border-[#e2e8f0] text-[#64748b] transition-all duration-200 hover:border-[var(--logo)]/50 hover:bg-[var(--logo-muted)]/50 hover:text-[var(--logo)] disabled:opacity-50 disabled:hover:bg-transparent"
                        aria-label="Attach image"
                      >
                        <ImageIcon className="size-4" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                      <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageChange}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={2}
                        placeholder={
                          selectedClient
                            ? "Type a message..."
                            : "Choose a client to start chatting..."
                        }
                        disabled={!selectedClientId}
                        className="w-full resize-none rounded-xl border border-[#e2e8f0] bg-[#f8fafc] px-4 py-2.5 text-sm text-[#0f172a] placeholder:text-[#94a3b8] transition-all duration-200 focus:border-[var(--logo)] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20 disabled:opacity-60"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleSend}
                      disabled={!input.trim() || !selectedClientId}
                      className="flex size-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-[var(--logo)] px-5 font-medium text-white shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-[var(--logo-hover)] hover:shadow-lg disabled:translate-y-0 disabled:opacity-50 disabled:hover:bg-[var(--logo)]"
                    >
                      <Send className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
      <LogoutConfirmDialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogoutConfirm}
      />
    </div>
  );
}
