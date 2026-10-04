'use client';

import { useEffect } from 'react';

export interface ShortcutHandlers {
  onNewChat?: () => void;
  onFocusSearch?: () => void;
  onSendMessage?: () => void;
  onStopStreaming?: () => void;
  onToggleSidebar?: () => void;
  onOpenSettings?: () => void;
  onOpenTemplates?: () => void;
  onOpenShortcuts?: () => void;
  onOpenSearchMessages?: () => void;
  onFocusInput?: () => void;
}

/**
 * Global keyboard shortcuts hook.
 * - Cmd/Ctrl+K: New chat
 * - Cmd/Ctrl+/: Focus search
 * - Cmd/Ctrl+Enter: Send message
 * - Cmd/Ctrl+.: Stop streaming
 * - Cmd/Ctrl+B: Toggle sidebar
 * - Cmd/Ctrl+,: Open settings
 * - Cmd/Ctrl+J: Open templates
 * - ?: Open shortcuts help (when not typing in input)
 * - Escape: Close dialogs (handled by shadcn) / blur input
 */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      const target = e.target as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;

      // Cmd/Ctrl+K - New chat
      if (mod && e.key === 'k') {
        e.preventDefault();
        e.stopPropagation();
        handlers.onNewChat?.();
        return;
      }

      // Cmd/Ctrl+/ - Focus search
      if (mod && e.key === '/') {
        e.preventDefault();
        handlers.onFocusSearch?.();
        return;
      }

      // Cmd/Ctrl+Enter - Send message
      if (mod && e.key === 'Enter') {
        e.preventDefault();
        handlers.onSendMessage?.();
        return;
      }

      // Cmd/Ctrl+. - Stop streaming
      if (mod && e.key === '.') {
        e.preventDefault();
        handlers.onStopStreaming?.();
        return;
      }

      // Cmd/Ctrl+B - Toggle sidebar
      if (mod && e.key === 'b') {
        e.preventDefault();
        handlers.onToggleSidebar?.();
        return;
      }

      // Cmd/Ctrl+, - Open settings
      if (mod && e.key === ',') {
        e.preventDefault();
        handlers.onOpenSettings?.();
        return;
      }

      // Cmd/Ctrl+J - Open templates
      if (mod && e.key === 'j') {
        e.preventDefault();
        handlers.onOpenTemplates?.();
        return;
      }

      // Cmd/Ctrl+Shift+F - Search messages (full-text)
      if (mod && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        handlers.onOpenSearchMessages?.();
        return;
      }

      // ? - Open shortcuts help (only when not typing)
      if (e.key === '?' && !isTyping) {
        e.preventDefault();
        handlers.onOpenShortcuts?.();
        return;
      }

      // Escape - focus input if typing
      if (e.key === 'Escape' && isTyping) {
        target?.blur();
        handlers.onFocusInput?.();
        return;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlers]);
}

export const SHORTCUTS_LIST = [
  {
    keys: ['⌘', 'K'],
    description: 'Start a new chat',
    category: 'Chat',
  },
  {
    keys: ['⌘', '/'],
    description: 'Focus conversation search',
    category: 'Navigation',
  },
  {
    keys: ['⌘', '↵'],
    description: 'Send message',
    category: 'Chat',
  },
  {
    keys: ['⌘', '.'],
    description: 'Stop generating',
    category: 'Chat',
  },
  {
    keys: ['⌘', 'B'],
    description: 'Toggle sidebar',
    category: 'Navigation',
  },
  {
    keys: ['⌘', ','],
    description: 'Open settings',
    category: 'Navigation',
  },
  {
    keys: ['⌘', 'J'],
    description: 'Browse prompt templates',
    category: 'Navigation',
  },
  {
    keys: ['⌘', '⇧', 'F'],
    description: 'Search messages (full-text)',
    category: 'Navigation',
  },
  {
    keys: ['?'],
    description: 'Show this help',
    category: 'Help',
  },
  {
    keys: ['Esc'],
    description: 'Close dialogs / blur input',
    category: 'Help',
  },
  {
    keys: ['⇧', '↵'],
    description: 'New line in input',
    category: 'Chat',
  },
] as const;
