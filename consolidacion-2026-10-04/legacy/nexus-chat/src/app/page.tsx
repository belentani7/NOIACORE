'use client';

import { useEffect, useCallback, useRef } from 'react';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { ChatArea } from '@/components/chat/chat-area';
import { SettingsDialog } from '@/components/chat/settings-dialog';
import { TemplatesDialog } from '@/components/chat/templates-dialog';
import { ShortcutsDialog } from '@/components/chat/shortcuts-dialog';
import { BookmarksDialog } from '@/components/chat/bookmarks-dialog';
import { SearchMessagesDialog } from '@/components/chat/search-messages-dialog';
import { ReactionsDialog } from '@/components/chat/reactions-dialog';
import { SystemPromptsDialog } from '@/components/chat/system-prompts-dialog';
import { StatsDialog } from '@/components/chat/stats-dialog';
import { CookieConsentBanner } from '@/components/privacy/cookie-consent-banner';
import { PrivacyDialog } from '@/components/privacy/privacy-dialog';
import { LegalDialog } from '@/components/privacy/legal-dialog';
import { useChatStore } from '@/store/chat-store';
import { useIsMobile } from '@/hooks/use-mobile';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export default function Home() {
  const sidebarOpen = useChatStore((s) => s.sidebarOpen);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const loadConversations = useChatStore((s) => s.loadConversations);
  const loadTemplates = useChatStore((s) => s.loadTemplates);
  const loadSettings = useChatStore((s) => s.loadSettings);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const createConversation = useChatStore((s) => s.createConversation);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);
  const setSettingsOpen = useChatStore((s) => s.setSettingsOpen);
  const setTemplatesOpen = useChatStore((s) => s.setTemplatesOpen);
  const setShortcutsOpen = useChatStore((s) => s.setShortcutsOpen);
  const setSearchMessagesOpen = useChatStore((s) => s.setSearchMessagesOpen);
  const stopStreaming = useChatStore((s) => s.stopStreaming);
  const isMobile = useIsMobile();

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadConversations();
    loadTemplates();
    loadSettings();
  }, [loadConversations, loadTemplates, loadSettings]);

  // On mobile, close the sidebar by default (it renders as a drawer)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile, setSidebarOpen]);

  // Focus the search input
  const focusSearch = useCallback(() => {
    const searchInput = document.querySelector<HTMLInputElement>(
      'input[aria-label="Search conversations"]'
    );
    if (searchInput) {
      searchInput.focus();
      searchInput.select();
    } else {
      searchRef.current?.focus();
    }
  }, []);

  // Focus the message input
  const focusInput = useCallback(() => {
    const input = document.querySelector<HTMLTextAreaElement>(
      'textarea[aria-label*="Message"]'
    );
    input?.focus();
  }, []);

  const handleNewChat = useCallback(async () => {
    await createConversation();
  }, [createConversation]);

  const handleSendMessage = useCallback(() => {
    // Find the send button and click it, or dispatch event on textarea
    const sendBtn = document.querySelector<HTMLButtonElement>(
      'button[aria-label="Send message"]'
    );
    if (sendBtn && !sendBtn.disabled) {
      sendBtn.click();
    }
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen(!useChatStore.getState().sidebarOpen);
  }, [setSidebarOpen]);

  // Set up keyboard shortcuts
  useKeyboardShortcuts({
    onNewChat: handleNewChat,
    onFocusSearch: focusSearch,
    onSendMessage: handleSendMessage,
    onStopStreaming: stopStreaming,
    onToggleSidebar: handleToggleSidebar,
    onOpenSettings: () => setSettingsOpen(true),
    onOpenTemplates: () => setTemplatesOpen(true),
    onOpenShortcuts: () => setShortcutsOpen(true),
    onOpenSearchMessages: () => setSearchMessagesOpen(true),
    onFocusInput: focusInput,
  });

  const handleMobileSelect = (id: string | null) => {
    if (id) {
      selectConversation(id);
    }
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar - desktop */}
      <aside
        className={`hidden md:flex transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'w-72 lg:w-80' : 'w-0'
        } overflow-hidden`}
      >
        <ChatSidebar />
      </aside>

      {/* Sidebar - mobile (drawer via Sheet) */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-80 p-0 max-w-[85vw] overflow-hidden">
            <SheetHeader className="sr-only">
              <SheetTitle>Conversations</SheetTitle>
            </SheetHeader>
            <div className="h-full">
              <ChatSidebar onMobileSelect={handleMobileSelect} />
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Main chat area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <ChatArea />
      </main>

      {/* Dialogs */}
      <SettingsDialog />
      <TemplatesDialog />
      <ShortcutsDialog />
      <BookmarksDialog />
      <SearchMessagesDialog />
      <ReactionsDialog />
      <SystemPromptsDialog />
      <StatsDialog />
      <PrivacyDialog />
      <LegalDialog />

      {/* RGPD: Cookie consent banner */}
      <CookieConsentBanner />
    </div>
  );
}
