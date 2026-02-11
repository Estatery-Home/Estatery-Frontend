"use client";

import * as React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Paperclip, Image as ImageIcon, Send } from "lucide-react";
import { Sidebar, TopBar, LogoutConfirmDialog } from "@/components/dashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { clientsTableData } from "@/lib/clients";
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
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = React.useState(false);
  const [input, setInput] = React.useState("");

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

  const selectedClient = selectedClientId
    ? clientsTableData.find((c) => c.clientId === selectedClientId)
    : undefined;

  const messages: ChatMessage[] = selectedClientId
    ? messagesByClient[selectedClientId] ?? []
    : [];

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

  return (
    <div className="flex min-h-screen bg-[#f1f5f9]">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogoutClick={() => setLogoutDialogOpen(true)}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            <header className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl font-bold text-[#1e293b]">Messages</h1>
                <p className="mt-1 text-sm text-[#64748b]">
                  Chat with your clients, share files, and keep all communication in one place.
                </p>
              </div>
              {selectedClient && (
                <div className="hidden items-center gap-2 rounded-full border border-[#e2e8f0] bg-white px-3 py-1.5 sm:flex">
                  <div className="flex size-7 items-center justify-center rounded-full bg-[var(--logo-muted)] text-xs font-semibold text-[var(--logo)]">
                    {selectedClient.avatarInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#0f172a]">
                      {selectedClient.name}
                    </p>
                    <p className="truncate text-xs text-[#94a3b8]">
                      Client • {selectedClient.clientId}
                    </p>
                  </div>
                </div>
              )}
            </header>

            <section className="flex min-h-[480px] flex-col overflow-hidden rounded-xl border border-[#e2e8f0] bg-white shadow-sm md:flex-row">
              {/* Chats list */}
              <aside className="w-full border-b border-[#e2e8f0] bg-[#f8fafc] md:w-64 md:border-b-0 md:border-r">
                <div className="border-b border-[#e2e8f0] px-4 py-3">
                  <p className="text-sm font-semibold text-[#0f172a]">Chats</p>
                  <p className="text-xs text-[#94a3b8]">Select a client to start chatting.</p>
                </div>
                <div className="max-h-[520px] space-y-0.5 overflow-y-auto py-2">
                  {clientsTableData.map((c) => {
                    const msgs = messagesByClient[c.clientId] ?? [];
                    const last = msgs[msgs.length - 1];
                    const isActive = c.clientId === selectedClientId;
                    return (
                      <button
                        key={c.clientId}
                        type="button"
                        onClick={() => handleSelectClient(c.clientId)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition-colors",
                          isActive
                            ? "bg-white text-[#0f172a]"
                            : "text-[#475569] hover:bg-[#e2e8f0]"
                        )}
                      >
                        <div className="flex size-8 items-center justify-center rounded-full bg-[var(--logo-muted)] text-xs font-semibold text-[var(--logo)]">
                          {c.avatarInitials}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{c.name}</p>
                          {last && (
                            <p className="truncate text-xs text-[#94a3b8]">
                              {last.author === "you" ? "You: " : ""} {last.text}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </aside>

              {/* Chat area */}
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                  {(!selectedClient || messages.length === 0) && (
                    <p className="text-center text-sm text-[#94a3b8]">
                      {selectedClient
                        ? "Start a conversation with your client."
                        : "Choose a client from the list to view the conversation."}
                    </p>
                  )}
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "flex w-full",
                        m.author === "you" ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                          m.author === "you"
                            ? "bg-[var(--logo)] text-white rounded-br-sm"
                            : "bg-[#f1f5f9] text-[#0f172a] rounded-bl-sm"
                        )}
                      >
                        <p>{m.text}</p>
                        <span
                          className={cn(
                            "mt-1 block text-[10px]",
                            m.author === "you" ? "text-white/70" : "text-[#94a3b8]"
                          )}
                        >
                          {m.timestamp}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-[#e2e8f0] px-4 py-3">
                  <div className="flex items-end gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleFileButtonClick}
                        className="flex size-9 items-center justify-center rounded-full border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
                        aria-label="Attach file"
                      >
                        <Paperclip className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={handleImageButtonClick}
                        className="flex size-9 items-center justify-center rounded-full border border-[#e2e8f0] text-[#64748b] hover:bg-[#f8fafc]"
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
                    <div className="flex-1">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={2}
                        placeholder={
                          selectedClient ? "Type a message..." : "Choose a client to start chatting..."
                        }
                        className="w-full resize-none rounded-lg border border-[#e2e8f0] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[var(--logo)] focus:outline-none focus:ring-2 focus:ring-[var(--logo)]/20"
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleSend}
                      disabled={!input.trim() || !selectedClientId}
                      className="flex items-center gap-2 rounded-full bg-[var(--logo)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--logo-hover)]"
                    >
                      <Send className="size-4" />
                      Send
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

