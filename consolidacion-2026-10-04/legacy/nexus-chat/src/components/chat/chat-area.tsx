'use client';

/* ------------------------------------------------------------------ */
/* Ambient module declarations for react-syntax-highlighter           */
/* (The package does not ship its own types and @types/react-syntax-  */
/* highlighter is not installed in this project.)                     */
/* ------------------------------------------------------------------ */
declare module 'react-syntax-highlighter' {
  import type { ComponentType, ReactNode, CSSProperties } from 'react';
  export interface SyntaxHighlighterProps {
    language?: string;
    style?: Record<string, CSSProperties>;
    customStyle?: CSSProperties;
    codeTagProps?: Record<string, unknown>;
    showLineNumbers?: boolean;
    lineNumberStyle?: CSSProperties;
    wrapLongLines?: boolean;
    children?: ReactNode;
    [key: string]: unknown;
  }
  const SyntaxHighlighter: ComponentType<SyntaxHighlighterProps>;
  export default SyntaxHighlighter;
  export const Prism: ComponentType<SyntaxHighlighterProps>;
  export const Light: ComponentType<SyntaxHighlighterProps>;
}

declare module 'react-syntax-highlighter/dist/esm/styles/prism' {
  import type { CSSProperties } from 'react';
  export const oneDark: Record<string, CSSProperties>;
  export const oneLight: Record<string, CSSProperties>;
}

/* ------------------------------------------------------------------ */
/* Imports                                                            */
/* ------------------------------------------------------------------ */
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type KeyboardEvent,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useTheme } from 'next-themes';
import { format, isToday, isYesterday } from 'date-fns';
import {
  Bookmark,
  Check,
  ChevronDown,
  Clipboard,
  Clock,
  Code,
  Download,
  ExternalLink,
  FileText,
  Globe,
  Image as ImageIcon,
  ImagePlus,
  LayoutGrid,
  Loader2,
  Menu,
  MessageSquare,
  Mic,
  Palette,
  Pencil,
  Pin,
  Plus,
  RefreshCw,
  Search,
  Send,
  Settings,
  Sparkles,
  Square,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useChatStore } from '@/store/chat-store';
import type { ChatMessage, SearchResult } from '@/types';
import {
  addToPromptHistory,
  clearPromptHistory,
  getPromptHistory,
  type PromptHistoryEntry,
} from '@/lib/prompt-history';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

/* ------------------------------------------------------------------ */
/* Constants                                                          */
/* ------------------------------------------------------------------ */

const MAX_TEXTAREA_HEIGHT = 160; // ~6 lines

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTimestamp(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'HH:mm');
    }
    if (isYesterday(date)) {
      return `Yesterday ${format(date, 'HH:mm')}`;
    }
    return format(date, 'MMM d, HH:mm');
  } catch {
    return '';
  }
}

/** Extract plain text from markdown (strip formatting) */
function markdownToPlainText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, (m) => m.replace(/```\w*\n?/g, '').replace(/```/g, ''))
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^>\s+/gm, '')
    .replace(/^[-*+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    .replace(/^---+$/gm, '')
    .trim();
}

/** Extract code blocks from markdown content */
function extractCodeBlocks(md: string): string {
  const blocks: string[] = [];
  // Match fenced code blocks
  const fenceRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let match;
  while ((match = fenceRegex.exec(md)) !== null) {
    const lang = match[1];
    const code = match[2].trim();
    if (lang) {
      blocks.push(`// ${lang}\n${code}`);
    } else {
      blocks.push(code);
    }
  }
  // If no fenced blocks, look for inline code
  if (blocks.length === 0) {
    const inlineRegex = /`([^`]+)`/g;
    while ((match = inlineRegex.exec(md)) !== null) {
      blocks.push(match[1]);
    }
  }
  return blocks.length > 0 ? blocks.join('\n\n---\n\n') : '';
}

interface Suggestion {
  emoji: string;
  title: string;
  description: string;
  prompt: string;
  mode?: 'search' | 'image-gen';
}

const SUGGESTIONS: Suggestion[] = [
  {
    emoji: '💡',
    title: 'Brainstorm ideas',
    description: 'Spark creativity with fresh concepts',
    prompt:
      'Help me brainstorm 5 creative ideas for a weekend side project I can build using AI.',
  },
  {
    emoji: '✍️',
    title: 'Write something',
    description: 'Draft posts, emails, or stories',
    prompt:
      'Write a short, engaging blog post introduction about the future of human-AI collaboration.',
  },
  {
    emoji: '🔍',
    title: 'Search the web',
    description: 'Get up-to-date answers with sources',
    prompt: 'What are the latest breakthroughs in multimodal AI this year?',
    mode: 'search',
  },
  {
    emoji: '🎨',
    title: 'Generate an image',
    description: 'Create art from a text description',
    prompt:
      'A serene mountain lake at sunset with mist rising from the water, cinematic lighting, ultra detailed',
    mode: 'image-gen',
  },
];

/* ------------------------------------------------------------------ */
/* Markdown renderer with syntax highlighting + copy button           */
/* ------------------------------------------------------------------ */

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const { resolvedTheme } = useTheme();
  const codeStyle = resolvedTheme === 'light' ? oneLight : oneDark;

  return (
    <div className={cn('markdown-body', className)}>
      <ReactMarkdown
        components={{
          code(props) {
            const { node: _node, className: cls, children, ...rest } = props;
            const inline = !cls;
            const match = /language-(\w+)/.exec(cls || '');
            const codeString = String(children ?? '').replace(/\n$/, '');

            if (inline) {
              return (
                <code className={cls} {...rest}>
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                language={match?.[1] || 'text'}
                code={codeString}
                style={codeStyle}
              />
            );
          },
          a({ href, children, ...rest }) {
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" {...rest}>
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

interface CodeBlockProps {
  language: string;
  code: string;
  style: Record<string, CSSProperties>;
}

function CodeBlock({ language, code, style }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lineCount = code.split('\n').length;
  const showLineNumbers = lineCount > 3;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Failed to copy code');
    }
  };

  const displayLang = language && language !== 'text' ? language : 'code';

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-border bg-muted/30">
      <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-3 py-1.5">
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
          </div>
          <span className="font-mono text-xs text-muted-foreground">{displayLang}</span>
          {showLineNumbers && (
            <span className="text-[10px] text-muted-foreground/60">
              {lineCount} lines
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1 px-2 text-xs hover:bg-accent"
          onClick={handleCopy}
          aria-label="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-green-500" /> Copied
            </>
          ) : (
            <>
              <Clipboard className="h-3 w-3" /> Copy
            </>
          )}
        </Button>
      </div>
      <div className="overflow-x-auto scrollbar-thin">
        <SyntaxHighlighter
          language={language}
          style={style}
          showLineNumbers={showLineNumbers}
          lineNumberStyle={{
            color: 'var(--muted-foreground)',
            opacity: 0.4,
            paddingRight: '1rem',
            userSelect: 'none',
            minWidth: '2rem',
          }}
          customStyle={{
            margin: 0,
            borderRadius: 0,
            background: 'transparent',
            fontSize: '0.8rem',
            padding: '0.875rem 1rem',
            fontFamily: 'var(--font-geist-mono), monospace',
          }}
          codeTagProps={{ style: { fontFamily: 'var(--font-geist-mono), monospace' } }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Streaming dots indicator                                           */
/* ------------------------------------------------------------------ */

function StreamingDots() {
  return (
    <span className="inline-flex items-center gap-1 px-1" aria-label="streaming">
      <motion.span
        className="h-1.5 w-1.5 rounded-full bg-primary"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
      />
      <motion.span
        className="h-1.5 w-1.5 rounded-full bg-primary"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
      />
      <motion.span
        className="h-1.5 w-1.5 rounded-full bg-primary"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
      />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Search results display                                             */
/* ------------------------------------------------------------------ */

function SearchResultsList({ results }: { results: SearchResult[] }) {
  if (!results || results.length === 0) return null;
  return (
    <div className="my-3 grid gap-2 sm:grid-cols-2">
      {results.map((r, i) => (
        <a
          key={`${r.url}-${i}`}
          href={r.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group rounded-lg border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-accent/40"
        >
          <div className="flex items-start gap-2">
            <Search className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
                {r.title}
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {r.snippet}
              </p>
              <div className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                <ExternalLink className="h-3 w-3" />
                <span className="truncate">{r.domain}</span>
              </div>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Generated image display                                            */
/* ------------------------------------------------------------------ */

function GeneratedImageDisplay({
  imageUrl,
  prompt,
  size,
}: {
  imageUrl: string;
  prompt: string;
  size: string;
}) {
  const handleDownload = async () => {
    try {
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexus-ai-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Image downloaded');
    } catch {
      toast.error('Failed to download image');
    }
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border border-border">
      <div className="relative aspect-square bg-muted">
        <img
          src={imageUrl}
          alt={prompt}
          className="h-full w-full object-cover"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={handleDownload}
          className="absolute right-2 top-2 gap-1.5 backdrop-blur-sm"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </Button>
      </div>
      <div className="border-t border-border bg-muted/40 px-3 py-2">
        <p className="line-clamp-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Prompt:</span> {prompt}
        </p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Size: {size}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Image thumbnails                                                   */
/* ------------------------------------------------------------------ */

function ImageThumbnails({
  images,
  className,
}: {
  images: Array<{ url: string; name?: string }>;
  className?: string;
}) {
  if (!images || images.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {images.map((img, i) => (
        <div
          key={`${img.url}-${i}`}
          className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border"
        >
          <img
            src={img.url}
            alt={img.name || `attachment-${i + 1}`}
            className="h-full w-full object-cover"
          />
          {img.name && (
            <div className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-1 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
              {img.name}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Message item                                                       */
/* ------------------------------------------------------------------ */

interface MessageItemProps {
  message: ChatMessage;
  isStreaming: boolean;
  isLast: boolean;
  onSpeak: (text: string, messageId: string) => void;
  speakingId: string | null;
  onStopSpeak: () => void;
  onRegenerate: () => void;
  onCopy: (text: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onReact?: (messageId: string, reaction: 'up' | 'down') => void;
  onBookmark?: (messageId: string) => void;
}

function MessageItem({
  message,
  isStreaming,
  isLast,
  onSpeak,
  speakingId,
  onStopSpeak,
  onRegenerate,
  onCopy,
  onEdit,
  onReact,
  onBookmark,
}: MessageItemProps) {
  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';
  const isSystem = message.role === 'system';
  const isStreamingMessage = isStreaming && isLast;
  const isSpeaking = speakingId === (message.id || '');
  const hasImages = !!message.metadata?.images?.length;
  const hasSearch = message.type === 'search' && !!message.metadata?.searchResults?.length;
  const hasGeneratedImage = message.type === 'image-gen' && !!message.metadata?.generatedImage;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const editRef = useRef<HTMLTextAreaElement>(null);
  const timestamp = formatTimestamp(message.createdAt);

  /* System messages: centered, muted */
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <div className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  const startEdit = () => {
    setEditValue(message.content);
    setIsEditing(true);
    setTimeout(() => {
      editRef.current?.focus();
      editRef.current?.select();
    }, 0);
  };

  const commitEdit = () => {
    const trimmed = editValue.trim();
    setIsEditing(false);
    if (!trimmed || trimmed === message.content) return;
    if (message.id && onEdit) {
      onEdit(message.id, trimmed);
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditValue('');
  };

  /* User message: right-aligned bubble */
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="group flex flex-col items-end gap-1"
      >
        {hasImages && (
          <ImageThumbnails images={message.metadata!.images!} className="justify-end" />
        )}
        {isEditing ? (
          <div className="max-w-[85%] w-full space-y-2">
            <textarea
              ref={editRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  commitEdit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
              className="w-full resize-none rounded-2xl rounded-br-md border-2 border-primary bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px]"
              rows={Math.min(6, editValue.split('\n').length)}
            />
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={cancelEdit} className="h-7 text-xs">
                Cancel
              </Button>
              <Button size="sm" onClick={commitEdit} className="h-7 text-xs gap-1.5">
                <Send className="h-3 w-3" />
                Send
              </Button>
            </div>
          </div>
        ) : (
          message.content && (
            <div
              className={cn(
                'max-w-[80%] whitespace-pre-wrap break-words rounded-2xl rounded-br-md bg-gradient-to-br from-primary to-primary/90 px-4 py-2.5 text-primary-foreground shadow-md shadow-primary/20'
              )}
            >
              {message.content}
            </div>
          )
        )}
        <div className="flex h-6 items-center gap-1 opacity-60 transition-opacity group-hover:opacity-100">
          {timestamp && !isEditing && (
            <span className="text-[10px] text-muted-foreground/70 px-1">
              {timestamp}
            </span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-foreground"
                onClick={() => onCopy(message.content)}
                aria-label="Copy message"
              >
                <Clipboard className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Copy</TooltipContent>
          </Tooltip>
          {onEdit && !isStreaming && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={startEdit}
                  aria-label="Edit message"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit & resend</TooltipContent>
            </Tooltip>
          )}
        </div>
      </motion.div>
    );
  }

  /* Assistant message: left-aligned with avatar */
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="group flex gap-3"
    >
      {/* Avatar */}
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-primary ring-1 ring-primary/20 shadow-sm">
        <Sparkles className="h-4 w-4" />
      </div>

      {/* Body */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Nexus AI</span>
          {message.type === 'vision' && (
            <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px]">
              <ImageIcon className="h-2.5 w-2.5" /> Vision
            </Badge>
          )}
          {message.type === 'search' && (
            <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px]">
              <Globe className="h-2.5 w-2.5" /> Web
            </Badge>
          )}
          {message.type === 'image-gen' && (
            <Badge variant="secondary" className="h-5 gap-1 px-1.5 text-[10px]">
              <Palette className="h-2.5 w-2.5" /> Image
            </Badge>
          )}
        </div>

        {/* Vision: show analyzed images */}
        {message.type === 'vision' && hasImages && (
          <ImageThumbnails images={message.metadata!.images!} className="mb-2" />
        )}

        {/* Search results cards */}
        {hasSearch && (
          <SearchResultsList results={message.metadata!.searchResults!} />
        )}

        {/* Generated image */}
        {hasGeneratedImage && (
          <GeneratedImageDisplay
            imageUrl={message.metadata!.generatedImage!.url}
            prompt={message.metadata!.generatedImage!.prompt}
            size={message.metadata!.generatedImage!.size}
          />
        )}

        {/* Text content (with streaming cursor when applicable) */}
        {message.content ? (
          isStreamingMessage ? (
            <div className="typing-cursor">
              <MarkdownRenderer content={message.content} />
            </div>
          ) : (
            <MarkdownRenderer content={message.content} />
          )
        ) : isStreamingMessage ? (
          <div className="flex items-center gap-2 py-2 text-muted-foreground">
            <StreamingDots />
            <span className="text-xs">Thinking...</span>
          </div>
        ) : null}

        {/* Action buttons */}
        {!isStreamingMessage && message.content && (
          <div className="mt-1 flex h-7 items-center gap-0.5 opacity-60 transition-opacity group-hover:opacity-100">
            {timestamp && (
              <span className="text-[10px] text-muted-foreground/70 px-1.5 mr-0.5">
                {timestamp}
              </span>
            )}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      aria-label="Copy message"
                    >
                      <Clipboard className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Copy options</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="start" className="w-48">
                <DropdownMenuItem onClick={() => onCopy(message.content)}>
                  <Clipboard className="h-3.5 w-3.5" />
                  Copy as Markdown
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCopy(markdownToPlainText(message.content))}>
                  <FileText className="h-3.5 w-3.5" />
                  Copy as Plain Text
                </DropdownMenuItem>
                {(() => {
                  const code = extractCodeBlocks(message.content);
                  if (!code) return null;
                  return (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onCopy(code)}>
                        <Code className="h-3.5 w-3.5" />
                        Copy Code Only
                      </DropdownMenuItem>
                    </>
                  );
                })()}
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    isSpeaking
                      ? onStopSpeak()
                      : onSpeak(message.content, message.id || '')
                  }
                  aria-label={isSpeaking ? 'Stop reading' : 'Read aloud'}
                >
                  {isSpeaking ? (
                    <VolumeX className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isSpeaking ? 'Stop' : 'Read aloud'}</TooltipContent>
            </Tooltip>
            {onReact && (
              <>
                <div className="mx-0.5 h-4 w-px bg-border" />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-7 w-7 transition-colors',
                        message.reaction === 'up'
                          ? 'text-green-500 bg-green-500/10'
                          : 'text-muted-foreground hover:text-green-500'
                      )}
                      onClick={() => onReact(message.id || '', 'up')}
                      aria-label="Good response"
                      aria-pressed={message.reaction === 'up'}
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Good response</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        'h-7 w-7 transition-colors',
                        message.reaction === 'down'
                          ? 'text-destructive bg-destructive/10'
                          : 'text-muted-foreground hover:text-destructive'
                      )}
                      onClick={() => onReact(message.id || '', 'down')}
                      aria-label="Bad response"
                      aria-pressed={message.reaction === 'down'}
                    >
                      <ThumbsDown className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Bad response</TooltipContent>
                </Tooltip>
              </>
            )}
            {isLast && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    onClick={onRegenerate}
                    aria-label="Regenerate response"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Regenerate</TooltipContent>
              </Tooltip>
            )}
            {onBookmark && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-7 w-7 transition-colors',
                      message.bookmarked
                        ? 'text-amber-500 bg-amber-500/10'
                        : 'text-muted-foreground hover:text-amber-500'
                    )}
                    onClick={() => onBookmark(message.id || '')}
                    aria-label={message.bookmarked ? 'Remove bookmark' : 'Bookmark message'}
                    aria-pressed={message.bookmarked}
                  >
                    <Bookmark className={cn('h-3.5 w-3.5', message.bookmarked && 'fill-amber-500')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{message.bookmarked ? 'Bookmarked' : 'Bookmark'}</TooltipContent>
              </Tooltip>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Loading skeletons                                                  */
/* ------------------------------------------------------------------ */

function LoadingSkeletons() {
  return (
    <div className="space-y-6">
      {[0, 1].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty state / Welcome screen                                       */
/* ------------------------------------------------------------------ */

interface EmptyStateProps {
  onSuggestionClick: (s: Suggestion) => void;
}

function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="relative flex min-h-full flex-col items-center justify-center px-4 py-10 overflow-hidden"
    >
      {/* Animated gradient orbs background */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -bottom-20 -right-20 h-80 w-80 rounded-full bg-chart-4/20 blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, -20, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 h-48 w-48 rounded-full bg-chart-2/15 blur-3xl"
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Logo with pulse ring */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="relative mb-6"
      >
        <motion.div
          className="absolute inset-0 rounded-3xl bg-primary/30 blur-xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.3, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-chart-4 shadow-lg shadow-primary/30">
          <Sparkles className="h-10 w-10 text-primary-foreground" />
        </div>
      </motion.div>

      <h1 className="gradient-text relative text-3xl font-bold tracking-tight sm:text-4xl">
        Welcome to Nexus AI
      </h1>
      <p className="mt-3 max-w-md text-center text-sm text-muted-foreground sm:text-base relative">
        Your multimodal AI assistant. Chat, search the web, analyze images,
        generate artwork, and more — all in one place.
      </p>

      {/* Feature pills */}
      <div className="mt-5 flex flex-wrap justify-center gap-2 relative">
        {[
          { icon: Sparkles, label: 'Streaming Chat' },
          { icon: Globe, label: 'Web Search' },
          { icon: ImageIcon, label: 'Image Analysis' },
          { icon: Palette, label: 'Image Generation' },
          { icon: Volume2, label: 'Voice I/O' },
        ].map((f, i) => (
          <motion.div
            key={f.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 + i * 0.05 }}
            className="flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm"
          >
            <f.icon className="h-3 w-3 text-primary" />
            {f.label}
          </motion.div>
        ))}
      </div>

      {/* Suggestion cards */}
      <div className="mt-8 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2 relative">
        {SUGGESTIONS.map((s, i) => (
          <motion.button
            key={s.title}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.05 }}
            whileHover={{ y: -2, scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onSuggestionClick(s)}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card/80 p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40 backdrop-blur-sm relative overflow-hidden"
          >
            {/* Hover gradient effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <span className="text-2xl relative">{s.emoji}</span>
            <div className="min-w-0 flex-1 relative">
              <p className="font-medium text-foreground">{s.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {s.description}
              </p>
            </div>
            <motion.div
              className="text-primary opacity-0 transition-opacity group-hover:opacity-100 relative"
              initial={false}
            >
              <Send className="h-4 w-4" />
            </motion.div>
          </motion.button>
        ))}
      </div>

      {/* Footer hint */}
      <p className="mt-6 text-xs text-muted-foreground/60 relative">
        Press{' '}
        <kbd className="px-1.5 py-0.5 rounded border bg-muted font-mono text-[10px]">?</kbd>{' '}
        for keyboard shortcuts
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Chat header                                                        */
/* ------------------------------------------------------------------ */

function ChatHeader() {
  const conversations = useChatStore((s) => s.conversations);
  const currentConversationId = useChatStore((s) => s.currentConversationId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const messages = useChatStore((s) => s.messages);
  const setSidebarOpen = useChatStore((s) => s.setSidebarOpen);
  const setSettingsOpen = useChatStore((s) => s.setSettingsOpen);
  const setTemplatesOpen = useChatStore((s) => s.setTemplatesOpen);
  const createConversation = useChatStore((s) => s.createConversation);
  const updateConversation = useChatStore((s) => s.updateConversation);
  const togglePinConversation = useChatStore((s) => s.togglePinConversation);

  const conversation = useMemo(
    () => conversations.find((c) => c.id === currentConversationId),
    [conversations, currentConversationId]
  );

  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  const startEdit = () => {
    setTitleDraft(conversation?.title || 'New Chat');
    setIsEditing(true);
  };

  const commitEdit = async () => {
    const trimmed = titleDraft.trim();
    setIsEditing(false);
    if (!currentConversationId || !conversation) return;
    if (!trimmed || trimmed === conversation.title) return;
    try {
      await updateConversation(currentConversationId, { title: trimmed });
      toast.success('Title updated');
    } catch {
      toast.error('Failed to update title');
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setTitleDraft('');
  };

  const handleNewChat = async () => {
    if (isStreaming) {
      toast.message('Please wait for the current response to finish');
      return;
    }
    await createConversation();
  };

  const title = conversation?.title || 'New Chat';

  // Conversation stats
  const messageCount = messages.length;
  const totalChars = messages.reduce((sum, m) => sum + (m.content?.length || 0), 0);
  const approxTokens = Math.ceil(totalChars / 4);
  const positiveReactions = messages.filter((m) => m.reaction === 'up').length;
  const negativeReactions = messages.filter((m) => m.reaction === 'down').length;

  return (
    <header className="glass sticky top-0 z-20 flex h-14 shrink-0 items-center gap-2 border-b px-3 sm:px-4">
      {/* Mobile menu */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setSidebarOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Title (editable) */}
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            className="h-8 max-w-xs text-sm"
            placeholder="Conversation title"
          />
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="group flex min-w-0 items-center gap-1.5 rounded-md px-1.5 py-1 text-left hover:bg-accent/60"
            aria-label="Edit conversation title"
          >
            <span className="truncate text-sm font-medium text-foreground">
              {title}
            </span>
            <Pencil className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        )}

        {/* Model badge */}
        <Badge
          variant="secondary"
          className="hidden shrink-0 gap-1 sm:inline-flex"
        >
          <Sparkles className="h-3 w-3 text-primary" />
          Nexus AI
        </Badge>

        {/* Streaming indicator */}
        <AnimatePresence>
          {isStreaming && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="hidden items-center gap-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary sm:inline-flex"
            >
              <StreamingDots />
              <span>Generating</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation stats */}
        {messageCount > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="hidden lg:flex items-center gap-2 rounded-full bg-muted/60 px-2.5 py-0.5 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {messageCount}
                </span>
                <span className="h-3 w-px bg-border" />
                <span className="flex items-center gap-1 font-mono">
                  ~{approxTokens > 1000 ? `${(approxTokens / 1000).toFixed(1)}k` : approxTokens} tok
                </span>
                {positiveReactions > 0 && (
                  <>
                    <span className="h-3 w-px bg-border" />
                    <span className="flex items-center gap-0.5 text-green-500">
                      <ThumbsUp className="h-3 w-3" />
                      {positiveReactions}
                    </span>
                  </>
                )}
                {negativeReactions > 0 && (
                  <>
                    <span className="h-3 w-px bg-border" />
                    <span className="flex items-center gap-0.5 text-destructive">
                      <ThumbsDown className="h-3 w-3" />
                      {negativeReactions}
                    </span>
                  </>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-0.5 text-xs">
                <div>{messageCount} messages in conversation</div>
                <div>~{approxTokens} tokens ({totalChars} chars)</div>
                {positiveReactions > 0 && <div>{positiveReactions} positive reactions</div>}
                {negativeReactions > 0 && <div>{negativeReactions} negative reactions</div>}
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex shrink-0 items-center gap-0.5">
        {currentConversationId && conversation && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => togglePinConversation(currentConversationId)}
                aria-label={conversation.pinned ? 'Unpin conversation' : 'Pin conversation'}
                className={conversation.pinned ? 'text-primary' : 'text-muted-foreground'}
              >
                <Pin className={cn('h-4 w-4', conversation.pinned && 'fill-primary')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{conversation.pinned ? 'Unpin' : 'Pin'}</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNewChat}
              aria-label="New chat"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>New chat</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTemplatesOpen(true)}
              aria-label="Templates"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Templates</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSettingsOpen(true)}
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Messages list                                                      */
/* ------------------------------------------------------------------ */

interface MessagesListProps {
  onSuggestionClick: (s: Suggestion) => void;
  onSpeak: (text: string, messageId: string) => void;
  speakingId: string | null;
  onStopSpeak: () => void;
  onRegenerate: () => void;
  onCopy: (text: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onReact?: (messageId: string, reaction: 'up' | 'down') => void;
  onBookmark?: (messageId: string) => void;
}

function MessagesList({
  onSuggestionClick,
  onSpeak,
  speakingId,
  onStopSpeak,
  onRegenerate,
  onCopy,
  onEdit,
  onReact,
  onBookmark,
}: MessagesListProps) {
  const messages = useChatStore((s) => s.messages);
  const loadingMessages = useChatStore((s) => s.loadingMessages);
  const isStreaming = useChatStore((s) => s.isStreaming);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessage = messages[messages.length - 1];
  const lastContent = lastMessage?.content || '';
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Auto-scroll to bottom on new messages / streaming updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, lastContent, isStreaming, loadingMessages]);

  // Track scroll position to show/hide scroll-to-bottom button
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      setShowScrollButton(distanceFromBottom > 200);
    };
    el.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => el.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  };

  return (
    <div className="relative flex-1 overflow-hidden">
      <div
        ref={scrollRef}
        className="scrollbar-thin h-full overflow-y-auto"
      >
        <div className="mx-auto w-full max-w-3xl px-4 py-6">
          {loadingMessages ? (
            <LoadingSkeletons />
          ) : messages.length === 0 ? (
            <EmptyState onSuggestionClick={onSuggestionClick} />
          ) : (
            <div className="space-y-6">
              {messages.map((m, i) => (
                <MessageItem
                  key={m.id || `msg-${i}-${m.createdAt || ''}`}
                  message={m}
                  isStreaming={isStreaming}
                  isLast={i === messages.length - 1}
                  onSpeak={onSpeak}
                  speakingId={speakingId}
                  onStopSpeak={onStopSpeak}
                  onRegenerate={onRegenerate}
                  onCopy={onCopy}
                  onEdit={onEdit}
                  onReact={onReact}
                  onBookmark={onBookmark}
                />
              ))}
            </div>
          )}
          <div ref={bottomRef} className="h-2" />
        </div>
      </div>

      {/* Scroll to bottom button */}
      <AnimatePresence>
        {showScrollButton && messages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10"
          >
            <Button
              size="icon"
              onClick={scrollToBottom}
              className="h-9 w-9 rounded-full shadow-lg border border-border bg-card text-foreground hover:bg-accent"
              aria-label="Scroll to bottom"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chat input                                                         */
/* ------------------------------------------------------------------ */

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
}

function ChatInput({ value, onChange, onSend }: ChatInputProps) {
  const isStreaming = useChatStore((s) => s.isStreaming);
  const stopStreaming = useChatStore((s) => s.stopStreaming);
  const attachedImages = useChatStore((s) => s.attachedImages);
  const addAttachedImage = useChatStore((s) => s.addAttachedImage);
  const removeAttachedImage = useChatStore((s) => s.removeAttachedImage);
  const enableWebSearch = useChatStore((s) => s.enableWebSearch);
  const setEnableWebSearch = useChatStore((s) => s.setEnableWebSearch);
  const imageGenMode = useChatStore((s) => s.imageGenMode);
  const setImageGenMode = useChatStore((s) => s.setImageGenMode);
  const setTemplatesOpen = useChatStore((s) => s.setTemplatesOpen);
  const settings = useChatStore((s) => s.settings);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [promptHistory, setPromptHistory] = useState<PromptHistoryEntry[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const dragCounter = useRef(0);

  // Load prompt history on mount
  useEffect(() => {
    setPromptHistory(getPromptHistory());
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [value]);

  const canSend = (value.trim().length > 0 || attachedImages.length > 0) && !isStreaming;

  const handleSend = () => {
    if (!canSend) return;
    // Save to prompt history
    if (value.trim()) {
      const type = imageGenMode ? 'image-gen' : enableWebSearch ? 'search' : attachedImages.length > 0 ? 'vision' : 'text';
      addToPromptHistory(value, type);
      setPromptHistory(getPromptHistory());
    }
    onSend();
  };

  const insertFromHistory = (content: string) => {
    onChange(content);
    setShowHistory(false);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  /* Image upload */
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    processImageFiles(files);
    e.target.value = '';
  };

  const processImageFiles = (files: File[]) => {
    let added = 0;
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 8 * 1024 * 1024) {
        toast.error(`${file.name} is larger than 8MB`);
        continue;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          addAttachedImage({ url: reader.result, name: file.name });
        }
      };
      reader.onerror = () => toast.error(`Failed to read ${file.name}`);
      reader.readAsDataURL(file);
      added++;
    }
    if (added > 0) {
      toast.success(`${added} image${added > 1 ? 's' : ''} attached`);
    }
  };

  /* Drag and drop */
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processImageFiles(files);
    }
  };

  /* Voice recording */
  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  const toggleRecording = async () => {
    if (isRecording) {
      stopRecording();
      return;
    }

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      toast.error('Voice recording is not supported in this browser');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size === 0) {
          toast.error('No audio captured');
          return;
        }

        const reader = new FileReader();
        reader.onloadend = async () => {
          if (typeof reader.result !== 'string') return;
          const base64 = reader.result.split(',')[1];
          setIsTranscribing(true);
          try {
            const { transcript } = await api.asr(base64);
            onChange((value ? value + ' ' : '') + transcript);
            toast.success('Transcribed');
          } catch {
            toast.error('Failed to transcribe audio');
          } finally {
            setIsTranscribing(false);
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      recorderRef.current = recorder;
      setIsRecording(true);
    } catch {
      toast.error('Microphone access denied or unavailable');
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        recorderRef.current.stop();
      }
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const showCharCount = value.length > 500;

  return (
    <div
      className="glass sticky bottom-0 z-10 border-t px-3 py-3 sm:px-4 sm:py-4 relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center rounded-t-2xl border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-primary">
            <ImagePlus className="h-10 w-10" />
            <span className="text-sm font-medium">Drop images to attach</span>
          </div>
        </div>
      )}
      <div className="mx-auto w-full max-w-3xl">
        {/* Attachments preview */}
        {attachedImages.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachedImages.map((img, i) => (
              <div
                key={`${img.url}-${i}`}
                className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border"
              >
                <img
                  src={img.url}
                  alt={img.name || `attachment-${i + 1}`}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeAttachedImage(i)}
                  className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
                  aria-label={`Remove ${img.name || 'attachment'}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Image gen mode hint */}
        {imageGenMode && (
          <div className="mb-2 flex items-center gap-1.5 rounded-md bg-primary/10 px-2.5 py-1.5 text-xs text-primary">
            <Palette className="h-3.5 w-3.5" />
            <span>Image generation mode — describe what you want to create</span>
          </div>
        )}

        {/* Input row */}
        <div className="flex items-end gap-2 rounded-2xl border border-border bg-background p-2 shadow-sm focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/30">
          {/* Toolbar (left) */}
          <div className="flex shrink-0 items-center gap-0.5">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageUpload}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming || imageGenMode}
                  aria-label="Attach image"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Attach image (vision)</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8',
                    isRecording
                      ? 'text-destructive'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={toggleRecording}
                  disabled={isStreaming || isTranscribing}
                  aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
                >
                  {isTranscribing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mic className="h-4 w-4" />
                  )}
                  {isRecording && (
                    <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5">
                      <span className="absolute inset-0 animate-ping rounded-full bg-destructive" />
                      <span className="absolute inset-0 rounded-full bg-destructive" />
                    </span>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isTranscribing
                  ? 'Transcribing...'
                  : isRecording
                  ? 'Stop recording'
                  : 'Voice input'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8',
                    enableWebSearch
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setEnableWebSearch(!enableWebSearch)}
                  disabled={isStreaming || imageGenMode}
                  aria-label="Toggle web search"
                  aria-pressed={enableWebSearch}
                >
                  <Globe className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Web search {enableWebSearch ? 'on' : 'off'}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    'h-8 w-8',
                    imageGenMode
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                  onClick={() => setImageGenMode(!imageGenMode)}
                  disabled={isStreaming || attachedImages.length > 0}
                  aria-label="Toggle image generation mode"
                  aria-pressed={imageGenMode}
                >
                  <ImagePlus className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                Image generation {imageGenMode ? 'on' : 'off'}
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setTemplatesOpen(true)}
                  aria-label="Open templates"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Templates</TooltipContent>
            </Tooltip>

            {/* Prompt history */}
            <Popover open={showHistory} onOpenChange={setShowHistory}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      disabled={isStreaming}
                      aria-label="Prompt history"
                    >
                      <Clock className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                </TooltipTrigger>
                <TooltipContent>Recent prompts</TooltipContent>
              </Tooltip>
              <PopoverContent
                side="top"
                align="start"
                className="w-80 p-0"
                onOpenAutoFocus={(e) => e.preventDefault()}
              >
                <div className="flex items-center justify-between border-b px-3 py-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Recent Prompts
                  </span>
                  {promptHistory.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-[10px] text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        clearPromptHistory();
                        setPromptHistory([]);
                        setShowHistory(false);
                        toast.success('History cleared');
                      }}
                    >
                      Clear all
                    </Button>
                  )}
                </div>
                <ScrollArea className="max-h-64">
                  {promptHistory.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-8 px-4 text-center">
                      <Clock className="h-8 w-8 text-muted-foreground/40" />
                      <p className="text-xs text-muted-foreground">
                        No recent prompts yet.
                      </p>
                      <p className="text-[10px] text-muted-foreground/60">
                        Your sent messages will appear here for quick reuse.
                      </p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {promptHistory.map((entry, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => insertFromHistory(entry.content)}
                          className="group flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-accent transition-colors"
                        >
                          <span className="mt-0.5 text-[10px] text-muted-foreground/60 shrink-0">
                            {entry.type === 'image-gen' ? '🎨' :
                             entry.type === 'search' ? '🔍' :
                             entry.type === 'vision' ? '👁' : '💬'}
                          </span>
                          <span className="flex-1 text-xs text-foreground line-clamp-2">
                            {entry.content}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              imageGenMode
                ? 'Describe the image you want to create...'
                : enableWebSearch
                ? 'Ask anything — web search is on...'
                : 'Message Nexus AI...'
            }
            className="scrollbar-thin max-h-[160px] min-h-[24px] flex-1 resize-none border-0 bg-transparent px-2 py-1.5 text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />

          {/* Send / Stop button */}
          <div className="flex shrink-0 items-end">
            {isStreaming ? (
              <Button
                size="icon"
                variant="destructive"
                className="h-8 w-8 rounded-lg"
                onClick={stopStreaming}
                aria-label="Stop generating"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={handleSend}
                disabled={!canSend}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Footer hint */}
        <div className="mt-1.5 flex items-center justify-between px-1">
          <p className="text-[11px] text-muted-foreground">
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">
              Enter
            </kbd>{' '}
            to send ·{' '}
            <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px]">
              Shift+Enter
            </kbd>{' '}
            for newline
          </p>
          {showCharCount && (
            <span className="text-[11px] text-muted-foreground">{value.length}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main ChatArea component                                            */
/* ------------------------------------------------------------------ */

export function ChatArea() {
  const sendMessage = useChatStore((s) => s.sendMessage);
  const stopStreaming = useChatStore((s) => s.stopStreaming);
  const regenerateLastMessage = useChatStore((s) => s.regenerateLastMessage);
  const setEnableWebSearch = useChatStore((s) => s.setEnableWebSearch);
  const setImageGenMode = useChatStore((s) => s.setImageGenMode);
  const settings = useChatStore((s) => s.settings);
  const isStreaming = useChatStore((s) => s.isStreaming);

  const [input, setInput] = useState('');
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSend = useCallback(
    async (text?: string) => {
      const content = (text ?? input).trim();
      const hasAttachments = useChatStore.getState().attachedImages.length > 0;
      if (!content && !hasAttachments) return;
      setInput('');
      await sendMessage(content);
    },
    [input, sendMessage]
  );

  const handleSuggestionClick = useCallback(
    (s: Suggestion) => {
      if (isStreaming) {
        toast.message('Please wait for the current response to finish');
        return;
      }
      if (s.mode === 'search') setEnableWebSearch(true);
      if (s.mode === 'image-gen') setImageGenMode(true);
      setInput(s.prompt);
      void handleSend(s.prompt);
    },
    [handleSend, isStreaming, setEnableWebSearch, setImageGenMode]
  );

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard');
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  const handleStopSpeak = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setSpeakingId(null);
  }, []);

  const ttsVoice = settings?.ttsVoice;
  const ttsSpeed = settings?.ttsSpeed;

  const handleSpeak = useCallback(
    async (text: string, messageId: string) => {
      if (!text.trim()) return;

      // Stop any current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        if (speakingId === messageId) {
          setSpeakingId(null);
          return;
        }
        setSpeakingId(null);
      }

      setSpeakingId(messageId);
      try {
        const voice = ttsVoice || 'tongtong';
        const speed = ttsSpeed || 1.0;
        const audioUrl = await api.tts(text, voice, speed);
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.onended = () => {
          setSpeakingId(null);
          audioRef.current = null;
        };
        audio.onerror = () => {
          setSpeakingId(null);
          audioRef.current = null;
          toast.error('Audio playback failed');
        };
        await audio.play();
      } catch (err) {
        setSpeakingId(null);
        toast.error(
          err instanceof Error ? err.message : 'Failed to generate audio'
        );
      }
    },
    [ttsVoice, ttsSpeed, speakingId]
  );

  const handleRegenerate = useCallback(async () => {
    if (isStreaming) return;
    try {
      await regenerateLastMessage();
    } catch {
      toast.error('Failed to regenerate response');
    }
  }, [isStreaming, regenerateLastMessage]);

  const editMessage = useChatStore((s) => s.editMessage);

  const handleEdit = useCallback(
    async (messageId: string, newContent: string) => {
      if (isStreaming) {
        toast.message('Please wait for the current response to finish');
        return;
      }
      try {
        await editMessage(messageId, newContent);
        toast.success('Message edited & resent');
      } catch {
        toast.error('Failed to edit message');
      }
    },
    [isStreaming, editMessage]
  );

  const setMessageReaction = useChatStore((s) => s.setMessageReaction);

  const handleReact = useCallback(
    async (messageId: string, reaction: 'up' | 'down') => {
      try {
        await setMessageReaction(messageId, reaction);
      } catch {
        toast.error('Failed to save reaction');
      }
    },
    [setMessageReaction]
  );

  const toggleBookmark = useChatStore((s) => s.toggleBookmark);

  const handleBookmark = useCallback(
    async (messageId: string) => {
      try {
        await toggleBookmark(messageId);
      } catch {
        toast.error('Failed to toggle bookmark');
      }
    },
    [toggleBookmark]
  );

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex h-full flex-col">
        <ChatHeader />
        <MessagesList
          onSuggestionClick={handleSuggestionClick}
          onSpeak={handleSpeak}
          speakingId={speakingId}
          onStopSpeak={handleStopSpeak}
          onRegenerate={handleRegenerate}
          onCopy={handleCopy}
          onEdit={handleEdit}
          onReact={handleReact}
          onBookmark={handleBookmark}
        />
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={() => void handleSend()}
        />
        {/* Stop streaming accessibility helper (hidden) */}
        {isStreaming && (
          <button
            type="button"
            onClick={stopStreaming}
            className="sr-only"
            aria-label="Stop generating response"
          >
            Stop
          </button>
        )}
      </div>
    </TooltipProvider>
  );
}

export default ChatArea;
