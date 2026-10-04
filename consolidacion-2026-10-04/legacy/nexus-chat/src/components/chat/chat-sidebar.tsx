'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import { formatDistanceToNow } from 'date-fns';
import {
  Archive,
  BarChart3,
  Bookmark,
  Copy,
  Download,
  FileJson,
  FileText,
  Keyboard,
  LayoutGrid,
  Loader2,
  MessageSquare,
  MoreVertical,
  Moon,
  Pencil,
  Pin,
  Plus,
  Search,
  SearchCheck,
  Settings,
  Sparkles,
  Sun,
  Tag,
  ThumbsUp,
  Trash2,
  Upload,
} from 'lucide-react';

import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { getTagColor } from '@/lib/tag-colors';
import { LegalFooter } from '@/components/privacy/legal-footer';
import { useChatStore } from '@/store/chat-store';
import type { ChatMessage, Conversation } from '@/types';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function buildMarkdown(conv: Conversation, messages: ChatMessage[]): string {
  const lines: string[] = [];
  lines.push(`# ${conv.title || 'Untitled Conversation'}`);
  lines.push('');
  lines.push(
    `> Exported from Nexus AI · ${new Date().toLocaleString()} · Model: ${conv.model}`
  );
  lines.push('');

  if (conv.systemPrompt?.trim()) {
    lines.push('## System Prompt');
    lines.push('');
    lines.push(conv.systemPrompt.trim());
    lines.push('');
  }

  if (messages.length === 0) {
    lines.push('_(No messages)_');
    lines.push('');
  }

  for (const msg of messages) {
    const roleLabel =
      msg.role === 'user'
        ? '🧑 You'
        : msg.role === 'assistant'
          ? '🤖 Assistant'
          : '⚙️ System';
    lines.push(`## ${roleLabel}`);
    lines.push('');
    lines.push(msg.content?.trim() || '_(no content)_');
    lines.push('');

    if (msg.metadata?.images?.length) {
      for (const img of msg.metadata.images) {
        lines.push(`![${img.name || 'attached-image'}](${img.url})`);
        lines.push('');
      }
    }

    if (msg.metadata?.generatedImage) {
      lines.push(
        `![generated-image](${msg.metadata.generatedImage.url})`
      );
      lines.push('');
      lines.push(`_Prompt: ${msg.metadata.generatedImage.prompt}_`);
      lines.push('');
    }
  }

  return lines.join('\n');
}

function downloadBlob(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/** Convert simple markdown to HTML for print */
function markdownToHtml(md: string): string {
  let html = escapeHtml(md);
  // Code blocks
  html = html.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="code-block"><code>${code.trim()}</code></pre>`;
  });
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  // Headers
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Bold and italic
  html = html.replace(/\*\*\*([^*]+)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // Links
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank">$1</a>'
  );
  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
  // Lists
  html = html.replace(/^[\s]*[-*+]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*?<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  // Paragraphs (lines not already wrapped)
  html = html
    .split('\n\n')
    .map((block) => {
      if (block.match(/^<(h[1-6]|ul|ol|pre|blockquote|div)/)) return block;
      if (block.trim() === '') return '';
      return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
  return html;
}

function buildPrintableHTML(conv: Conversation, messages: ChatMessage[]): string {
  const title = escapeHtml(conv.title || 'Untitled Conversation');
  const dateStr = new Date(conv.createdAt).toLocaleString();

  const messagesHtml = messages
    .map((msg) => {
      const role = msg.role === 'user' ? 'You' : msg.role === 'assistant' ? 'Nexus AI' : 'System';
      const roleClass = msg.role === 'user' ? 'user-msg' : 'assistant-msg';
      const content = markdownToHtml(msg.content || '');
      const time = msg.createdAt
        ? new Date(msg.createdAt).toLocaleTimeString()
        : '';
      return `
        <div class="message ${roleClass}">
          <div class="message-header">
            <span class="role">${escapeHtml(role)}</span>
            ${time ? `<span class="time">${escapeHtml(time)}</span>` : ''}
          </div>
          <div class="message-content">${content}</div>
        </div>
      `;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;
    color: #1a1a2e;
    background: #fff;
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
  }
  .header {
    text-align: center;
    margin-bottom: 40px;
    padding-bottom: 20px;
    border-bottom: 2px solid #7c3aed;
  }
  .header h1 {
    font-size: 28px;
    color: #7c3aed;
    margin-bottom: 8px;
  }
  .header .meta {
    font-size: 13px;
    color: #666;
  }
  .message {
    margin-bottom: 24px;
    padding: 16px;
    border-radius: 12px;
    page-break-inside: avoid;
  }
  .user-msg {
    background: #f3f0ff;
    border-left: 3px solid #7c3aed;
    margin-left: 40px;
  }
  .assistant-msg {
    background: #f8f9fa;
    border-left: 3px solid #10b981;
    margin-right: 40px;
  }
  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-size: 12px;
    color: #666;
  }
  .role {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .user-msg .role { color: #7c3aed; }
  .assistant-msg .role { color: #10b981; }
  .message-content {
    font-size: 14px;
    line-height: 1.7;
  }
  .message-content h1, .message-content h2, .message-content h3 {
    margin: 12px 0 6px;
    color: #1a1a2e;
  }
  .message-content h1 { font-size: 20px; }
  .message-content h2 { font-size: 17px; }
  .message-content h3 { font-size: 15px; }
  .message-content p { margin-bottom: 8px; }
  .message-content ul, .message-content ol {
    margin: 8px 0 8px 24px;
  }
  .message-content li { margin-bottom: 4px; }
  .message-content a { color: #7c3aed; }
  .message-content blockquote {
    border-left: 3px solid #d1d5db;
    padding-left: 12px;
    margin: 8px 0;
    color: #666;
    font-style: italic;
  }
  .code-block {
    background: #1e1e2e;
    color: #cdd6f4;
    padding: 12px 16px;
    border-radius: 8px;
    overflow-x: auto;
    margin: 8px 0;
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 13px;
  }
  .inline-code {
    background: #e8e8f0;
    padding: 2px 6px;
    border-radius: 4px;
    font-family: 'Fira Code', 'Courier New', monospace;
    font-size: 0.9em;
    color: #7c3aed;
  }
  .footer {
    margin-top: 40px;
    padding-top: 20px;
    border-top: 1px solid #e5e7eb;
    text-align: center;
    font-size: 12px;
    color: #999;
  }
  @media print {
    body { padding: 20px; }
    .message { page-break-inside: avoid; }
  }
</style>
</head>
<body>
  <div class="header">
    <h1>${title}</h1>
    <div class="meta">Created: ${escapeHtml(dateStr)} · ${messages.length} messages</div>
  </div>
  <div class="messages">
    ${messagesHtml}
  </div>
  <div class="footer">
    Exported from Nexus AI · ${new Date().toLocaleString()}
  </div>
</body>
</html>`;
}

function sanitizeFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^a-z0-9-_]+/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  return cleaned.toLowerCase() || 'conversation';
}

function stripMarkdown(text: string): string {
  return text
    // Remove code blocks (```...```)
    .replace(/```[\s\S]*?```/g, ' [code] ')
    // Remove inline code (`...`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    // Remove links [text](url) -> text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    // Remove headers (#, ##, etc.)
    .replace(/^#{1,6}\s+/gm, '')
    // Remove bold/italic markers
    .replace(/\*\*\*([^*]+)\*\*\*/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/___([^_]+)___/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove blockquotes
    .replace(/^>\s+/gm, '')
    // Remove list markers (-, *, 1.)
    .replace(/^[\s]*[-*+]\s+/gm, '')
    .replace(/^[\s]*\d+\.\s+/gm, '')
    // Remove horizontal rules
    .replace(/^---+$/gm, '')
    // Remove HTML tags
    .replace(/<[^>]+>/g, '')
    // Collapse whitespace
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getPreview(conv: Conversation): string {
  const messages = conv.messages;
  if (!messages || messages.length === 0) return 'No messages yet';
  const last = messages[messages.length - 1];
  const rawContent = last.content?.trim();
  if (!rawContent) return 'No messages yet';
  const content = stripMarkdown(rawContent);
  if (!content) return 'No messages yet';
  // Truncate to ~60 chars
  const truncated = content.length > 60 ? content.slice(0, 60) + '…' : content;
  return last.role === 'user' ? `You: ${truncated}` : truncated;
}

/* ------------------------------------------------------------------ */
/* Search Highlight                                                    */
/* ------------------------------------------------------------------ */

function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const escaped = query.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);
  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark
            key={i}
            className="bg-primary/20 text-primary rounded px-0.5 font-semibold"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Theme Toggle                                                        */
/* ------------------------------------------------------------------ */

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      variant="ghost"
      size="icon"
      className="size-9 text-muted-foreground hover:text-foreground"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Light mode' : 'Dark mode'}
      suppressHydrationWarning
    >
      {/* Render both icons; CSS controls visibility to avoid hydration mismatch. */}
      <Sun className="size-4 hidden dark:block" suppressHydrationWarning />
      <Moon className="size-4 dark:hidden" suppressHydrationWarning />
    </Button>
  );
}

/* ------------------------------------------------------------------ */
/* Empty State                                                         */
/* ------------------------------------------------------------------ */

function EmptyState({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10 gap-4">
      <div className="size-14 rounded-2xl bg-gradient-to-br from-violet-500/15 to-fuchsia-500/15 ring-1 ring-violet-500/20 flex items-center justify-center">
        <MessageSquare className="size-6 text-primary" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-foreground">
          No conversations yet
        </h3>
        <p className="text-xs text-muted-foreground max-w-[220px] mx-auto leading-relaxed">
          Start a new chat to begin your conversation with Nexus AI.
        </p>
      </div>
      <Button
        onClick={onNewChat}
        size="sm"
        className="mt-1 bg-primary text-primary-foreground hover:bg-primary/90"
      >
        <Plus className="size-4" />
        Start chatting
      </Button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar Item                                                        */
/* ------------------------------------------------------------------ */

interface SidebarItemProps {
  conversation: Conversation;
  active: boolean;
  renaming: boolean;
  renameValue: string;
  searchQuery?: string;
  onRenameChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onSelect: (id: string) => void;
  onPin: (id: string) => void;
  onRename: (conv: Conversation) => void;
  onExport: (conv: Conversation) => void;
  onExportPDF: (conv: Conversation) => void;
  onExportJSON: (conv: Conversation) => void;
  onDuplicate: (id: string) => void;
  onArchive: (id: string) => void;
  onAddTag: (conv: Conversation) => void;
  onDelete: (conv: Conversation) => void;
}

function SidebarItem({
  conversation: conv,
  active,
  renaming,
  renameValue,
  searchQuery,
  onRenameChange,
  onCommitRename,
  onCancelRename,
  onSelect,
  onPin,
  onRename,
  onExport,
  onExportPDF,
  onExportJSON,
  onDuplicate,
  onArchive,
  onAddTag,
  onDelete,
}: SidebarItemProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming) {
      // defer focus to next tick so input is mounted
      const t = window.setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 0);
      return () => window.clearTimeout(t);
    }
  }, [renaming]);

  const preview = getPreview(conv);
  const messageCount = conv._count?.messages ?? 0;

  let relativeTime = '';
  try {
    relativeTime = formatDistanceToNow(new Date(conv.updatedAt), {
      addSuffix: true,
    });
  } catch {
    relativeTime = '';
  }

  if (renaming) {
    return (
      <div
        className={cn(
          'rounded-lg px-2 py-1.5 bg-accent/60 border-l-2',
          active ? 'border-primary' : 'border-transparent'
        )}
      >
        <Input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onCommitRename();
            } else if (e.key === 'Escape') {
              e.preventDefault();
              onCancelRename();
            }
          }}
          onBlur={onCommitRename}
          className="h-8 text-sm"
          aria-label="Rename conversation"
        />
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(conv.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(conv.id);
        }
      }}
      className={cn(
        'group relative rounded-lg px-3 py-2.5 cursor-pointer transition-colors',
        'hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        active && 'bg-accent border-l-2 border-primary',
        !active && 'border-l-2 border-transparent'
      )}
      aria-current={active ? 'true' : undefined}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {conv.pinned && (
              <Pin
                className="size-3 shrink-0 text-primary fill-primary"
                aria-label="Pinned"
              />
            )}
            <h3 className="text-sm font-medium truncate text-foreground">
              <HighlightMatch text={conv.title || 'Untitled'} query={searchQuery || ''} />
            </h3>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5 leading-snug">
            <HighlightMatch text={preview} query={searchQuery || ''} />
          </p>
          <div className="flex items-center gap-2 mt-1.5">
            {relativeTime && (
              <span className="text-[10px] text-muted-foreground/80 uppercase tracking-wide">
                {relativeTime}
              </span>
            )}
            {messageCount > 0 && (
              <Badge
                variant="secondary"
                className="text-[10px] h-4 px-1.5 gap-0.5 font-normal"
              >
                <MessageSquare className="size-2.5" />
                {messageCount}
              </Badge>
            )}
          </div>
          {conv.tags && conv.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {conv.tags.slice(0, 3).map((tag) => {
                const color = getTagColor(tag);
                return (
                  <span
                    key={tag}
                    className={cn(
                      'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0 text-[9px] font-medium',
                      color.bg,
                      color.text
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', color.dot)} />
                    {tag}
                  </span>
                );
              })}
              {conv.tags.length > 3 && (
                <span className="text-[9px] text-muted-foreground">
                  +{conv.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 focus-visible:opacity-100 transition-opacity"
              onClick={(e) => e.stopPropagation()}
              aria-label="Conversation options"
            >
              <MoreVertical className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="w-48"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenuItem onClick={() => onPin(conv.id)}>
              <Pin className="size-4" />
              {conv.pinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRename(conv)}>
              <Pencil className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExport(conv)}>
              <Download className="size-4" />
              Export as Markdown
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExportPDF(conv)}>
              <FileText className="size-4" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onExportJSON(conv)}>
              <FileJson className="size-4" />
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDuplicate(conv.id)}>
              <Copy className="size-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive(conv.id)}>
              <Archive className="size-4" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onAddTag(conv)}>
              <Tag className="size-4" />
              Add Tag
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => onDelete(conv)}
            >
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Section Label                                                       */
/* ------------------------------------------------------------------ */

function SectionLabel({
  children,
  count,
}: {
  children: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="flex items-center justify-between px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
      <span>{children}</span>
      {count !== undefined && count > 0 && (
        <span className="rounded-full bg-muted px-1.5 py-0 text-[9px] font-medium text-muted-foreground/80">
          {count}
        </span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Sidebar                                                        */
/* ------------------------------------------------------------------ */

export function ChatSidebar({ onMobileSelect }: { onMobileSelect?: (id: string | null) => void } = {}) {
  const conversations = useChatStore((s) => s.conversations);
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const loadingConversations = useChatStore((s) => s.loadingConversations);
  const searchQuery = useChatStore((s) => s.searchQuery);
  const activeTag = useChatStore((s) => s.activeTag);

  const loadConversations = useChatStore((s) => s.loadConversations);
  const selectConversation = useChatStore((s) => s.selectConversation);
  const createConversation = useChatStore((s) => s.createConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const togglePinConversation = useChatStore((s) => s.togglePinConversation);
  const archiveConversation = useChatStore((s) => s.archiveConversation);
  const duplicateConversation = useChatStore((s) => s.duplicateConversation);
  const setSearchQuery = useChatStore((s) => s.setSearchQuery);
  const setActiveTag = useChatStore((s) => s.setActiveTag);
  const setSettingsOpen = useChatStore((s) => s.setSettingsOpen);
  const setTemplatesOpen = useChatStore((s) => s.setTemplatesOpen);
  const setShortcutsOpen = useChatStore((s) => s.setShortcutsOpen);
  const setBookmarksOpen = useChatStore((s) => s.setBookmarksOpen);
  const setSearchMessagesOpen = useChatStore((s) => s.setSearchMessagesOpen);
  const setReactionsOpen = useChatStore((s) => s.setReactionsOpen);
  const setStatsOpen = useChatStore((s) => s.setStatsOpen);

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Conversation | null>(null);
  const [creating, setCreating] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleNewChat = async () => {
    if (creating) return;
    setCreating(true);
    try {
      await createConversation();
      if (onMobileSelect) onMobileSelect(null);
    } catch {
      toast.error('Failed to create conversation');
    } finally {
      setCreating(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.conversation || !data.conversation.title) {
        toast.error('Invalid JSON format');
        return;
      }
      const result = await api.importConversation(data);
      toast.success(`Imported "${data.conversation.title}" with ${result.messageCount} messages`);
      await loadConversations();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import conversation');
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const startRename = (conv: Conversation) => {
    setRenamingId(conv.id);
    setRenameValue(conv.title || '');
  };

  const commitRename = async () => {
    const id = renamingId;
    if (!id) return;
    const trimmed = renameValue.trim();
    setRenamingId(null);
    setRenameValue('');
    if (!trimmed) return;
    const current = useChatStore
      .getState()
      .conversations.find((c) => c.id === id);
    if (current && current.title === trimmed) return;
    try {
      await api.updateConversation(id, { title: trimmed });
      await loadConversations();
      toast.success('Conversation renamed');
    } catch {
      toast.error('Failed to rename conversation');
    }
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue('');
  };

  const handleExport = async (conv: Conversation) => {
    if (exportingId) return;
    setExportingId(conv.id);
    try {
      const { conversation } = await api.getConversation(conv.id);
      const messages = conversation.messages || [];
      if (messages.length === 0) {
        toast.error('This conversation has no messages to export');
        return;
      }
      const md = buildMarkdown(conversation, messages);
      downloadBlob(
        md,
        `${sanitizeFileName(conversation.title)}.md`,
        'text/markdown'
      );
      toast.success('Conversation exported as Markdown');
    } catch {
      toast.error('Failed to export conversation');
    } finally {
      setExportingId(null);
    }
  };

  const handleExportPDF = async (conv: Conversation) => {
    if (exportingId) return;
    setExportingId(conv.id);
    try {
      const { conversation } = await api.getConversation(conv.id);
      const messages = conversation.messages || [];
      if (messages.length === 0) {
        toast.error('This conversation has no messages to export');
        return;
      }

      // Build HTML for printing
      const html = buildPrintableHTML(conversation, messages);
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Please allow popups to export as PDF');
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
      toast.success('Opening print dialog…');
    } catch {
      toast.error('Failed to export conversation');
    } finally {
      setExportingId(null);
    }
  };

  const handleExportJSON = async (conv: Conversation) => {
    if (exportingId) return;
    setExportingId(conv.id);
    try {
      const { conversation } = await api.getConversation(conv.id);
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        conversation: {
          title: conversation.title,
          systemPrompt: conversation.systemPrompt,
          model: conversation.model,
          temperature: conversation.temperature,
          tags: conversation.tags || [],
          createdAt: conversation.createdAt,
          messages: (conversation.messages || []).map((m) => ({
            role: m.role,
            content: m.content,
            type: m.type,
            metadata: m.metadata,
            reaction: m.reaction,
            bookmarked: m.bookmarked,
            createdAt: m.createdAt,
          })),
        },
      };
      const json = JSON.stringify(exportData, null, 2);
      downloadBlob(
        json,
        `${sanitizeFileName(conversation.title)}.json`,
        'application/json'
      );
      toast.success('Conversation exported as JSON');
    } catch {
      toast.error('Failed to export conversation');
    } finally {
      setExportingId(null);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveConversation(id);
      toast.success('Conversation archived');
    } catch {
      toast.error('Failed to archive conversation');
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      const newId = await duplicateConversation(id);
      if (newId) {
        toast.success('Conversation duplicated');
      } else {
        toast.error('Failed to duplicate conversation');
      }
    } catch {
      toast.error('Failed to duplicate conversation');
    }
  };

  const [tagTarget, setTagTarget] = useState<Conversation | null>(null);
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = (conv: Conversation) => {
    setTagTarget(conv);
    setTagInput('');
  };

  const commitAddTag = async () => {
    if (!tagTarget) return;
    const trimmed = tagInput.trim().toLowerCase();
    if (!trimmed) {
      setTagTarget(null);
      return;
    }
    const addTagToConversation = useChatStore.getState().addTagToConversation;
    await addTagToConversation(tagTarget.id, trimmed);
    setTagTarget(null);
    setTagInput('');
    toast.success(`Tag "${trimmed}" added`);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    try {
      await deleteConversation(target.id);
      toast.success('Conversation deleted');
    } catch {
      toast.error('Failed to delete conversation');
    }
  };

  const handleSelect = (id: string) => {
    if (id === useChatStore.getState().currentConversationId) {
      if (onMobileSelect) onMobileSelect(id);
      return;
    }
    selectConversation(id);
    if (onMobileSelect) onMobileSelect(id);
  };

  // Split into pinned / others (preserve original order)
  const pinned = conversations.filter((c) => c.pinned);
  const others = conversations.filter((c) => !c.pinned);

  const showSkeletons = loadingConversations && conversations.length === 0;
  const showEmpty = !loadingConversations && conversations.length === 0;

  return (
    <aside className="flex flex-col h-full w-full bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      {/* Header */}
      <div className="p-3 space-y-3 border-b border-sidebar-border/60">
        <div className="flex items-center gap-2 px-1">
          <div className="flex items-center justify-center size-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-sm">
            <Sparkles className="size-4" />
          </div>
          <h1 className="text-lg font-semibold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 bg-clip-text text-transparent">
            Nexus AI
          </h1>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleNewChat}
            disabled={creating}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
          >
            <Plus className="size-4" />
            {creating ? 'Creating…' : 'New Chat'}
          </Button>
          <input
            ref={importInputRef}
            type="file"
            accept=".json,application/json"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="outline"
            size="icon"
            className="shrink-0"
            onClick={() => importInputRef.current?.click()}
            disabled={importing}
            aria-label="Import conversation"
            title="Import conversation from JSON"
          >
            {importing ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
          </Button>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations…"
            className="pl-9 h-9 bg-background/60"
            aria-label="Search conversations"
          />
        </div>
      </div>

      {/* Tag filter bar */}
      {(() => {
        const tagSet = new Set<string>();
        conversations.forEach((c) => {
          (c.tags || []).forEach((t) => tagSet.add(t));
        });
        const tags = Array.from(tagSet);
        if (tags.length === 0) return null;
        return (
          <div className="px-2 pb-1 flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setActiveTag('')}
              className={cn(
                'rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors',
                activeTag === ''
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent'
              )}
            >
              All
            </button>
            {tags.map((tag) => {
              const color = getTagColor(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors flex items-center gap-1',
                    activeTag === tag
                      ? `${color.bg} ${color.text} border ${color.border}`
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', color.dot)} />
                  {tag}
                </button>
              );
            })}
          </div>
        );
      })()}

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
        {showSkeletons ? (
          <div className="space-y-2 p-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/40 p-3 space-y-2"
              >
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2.5 w-1/3" />
              </div>
            ))}
          </div>
        ) : showEmpty ? (
          <EmptyState onNewChat={handleNewChat} />
        ) : (
          <div className="space-y-0.5">
            {pinned.length > 0 && (
              <>
                <SectionLabel count={pinned.length}>Pinned</SectionLabel>
                {pinned.map((conv) => (
                  <SidebarItem
                    key={conv.id}
                    conversation={conv}
                    active={conv.id === currentConversationId}
                    renaming={renamingId === conv.id}
                    renameValue={renameValue}
                    searchQuery={searchQuery}
                    onRenameChange={setRenameValue}
                    onCommitRename={commitRename}
                    onCancelRename={cancelRename}
                    onSelect={handleSelect}
                    onPin={togglePinConversation}
                    onRename={startRename}
                    onExport={handleExport}
                    onExportPDF={handleExportPDF}
                    onExportJSON={handleExportJSON}
                    onDuplicate={handleDuplicate}
                    onArchive={handleArchive}
                    onAddTag={handleAddTag}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </>
            )}
            {others.length > 0 && (
              <SectionLabel count={others.length}>Conversations</SectionLabel>
            )}
            {others.map((conv) => (
              <SidebarItem
                key={conv.id}
                conversation={conv}
                active={conv.id === currentConversationId}
                renaming={renamingId === conv.id}
                renameValue={renameValue}
                searchQuery={searchQuery}
                onRenameChange={setRenameValue}
                onCommitRename={commitRename}
                onCancelRename={cancelRename}
                onSelect={handleSelect}
                onPin={togglePinConversation}
                onRename={startRename}
                onExport={handleExport}
                onExportPDF={handleExportPDF}
                onExportJSON={handleExportJSON}
                onDuplicate={handleDuplicate}
                onArchive={handleArchive}
                onAddTag={handleAddTag}
                onDelete={setDeleteTarget}
              />
            ))}
            {exportingId && (
              <div className="px-3 py-2 text-xs text-muted-foreground">
                Preparing export…
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-sidebar-border/60 p-2 flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setSettingsOpen(true)}
        >
          <Settings className="size-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 justify-start gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => setTemplatesOpen(true)}
        >
          <LayoutGrid className="size-4" />
          <span className="hidden sm:inline">Templates</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-9"
          onClick={() => setBookmarksOpen(true)}
          aria-label="Bookmarks"
          title="Bookmarks"
        >
          <Bookmark className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-9"
          onClick={() => setSearchMessagesOpen(true)}
          aria-label="Search messages"
          title="Search messages"
        >
          <SearchCheck className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-9"
          onClick={() => setReactionsOpen(true)}
          aria-label="Reactions summary"
          title="Reactions summary"
        >
          <ThumbsUp className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-9"
          onClick={() => setStatsOpen(true)}
          aria-label="Usage statistics"
          title="Usage statistics"
        >
          <BarChart3 className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground hover:text-foreground size-9"
          onClick={() => setShortcutsOpen(true)}
          aria-label="Keyboard shortcuts"
          title="Keyboard shortcuts (?)"
        >
          <Keyboard className="size-4" />
        </Button>
        <ThemeToggle />
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <span className="font-medium text-foreground">
                &ldquo;{deleteTarget?.title || 'Untitled'}&rdquo;
              </span>{' '}
              and all of its messages. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add tag dialog */}
      <Dialog
        open={!!tagTarget}
        onOpenChange={(open) => {
          if (!open) {
            setTagTarget(null);
            setTagInput('');
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-primary" />
              Add Tag
            </DialogTitle>
            <DialogDescription>
              Add a tag to{' '}
              <span className="font-medium text-foreground">
                &ldquo;{tagTarget?.title || 'Untitled'}&rdquo;
              </span>
              . Tags help you organize and filter conversations.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitAddTag();
                }
              }}
              placeholder="e.g. work, personal, research..."
              className="w-full"
              autoFocus
            />
            {tagTarget?.tags && tagTarget.tags.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Current tags:</p>
                <div className="flex flex-wrap gap-1">
                  {tagTarget.tags.map((t) => {
                    const color = getTagColor(t);
                    return (
                      <span
                        key={t}
                        className={cn(
                          'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-medium',
                          color.bg,
                          color.text
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', color.dot)} />
                        {t}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTagTarget(null);
                setTagInput('');
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={commitAddTag} className="gap-1.5">
              <Tag className="h-3.5 w-3.5" />
              Add Tag
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer legal - RGPD/LSSI-CE */}
      <LegalFooter />
    </aside>
  );
}

export default ChatSidebar;
