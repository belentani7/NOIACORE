'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatStore } from '@/store/chat-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Search,
  Sparkles,
  User,
  ExternalLink,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface SearchResultEntry {
  id: string;
  content: string;
  snippet: string;
  role: string;
  type: string;
  createdAt: string;
  conversationId: string;
  conversationTitle: string;
  bookmarked: boolean;
  reaction: string | null;
}

function formatTimestamp(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
    return format(date, 'MMM d');
  } catch {
    return '';
  }
}

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

export function SearchMessagesDialog() {
  const open = useChatStore((s) => s.searchMessagesOpen);
  const setOpen = useChatStore((s) => s.setSearchMessagesOpen);
  const selectConversation = useChatStore((s) => s.selectConversation);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setLoading(true);
    setHasSearched(true);
    try {
      const { results: res } = await api.searchMessages(q, 30);
      setResults(res);
    } catch {
      toast.error('Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search on query change
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void performSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, open, performSearch]);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery('');
      setResults([]);
      setHasSearched(false);
    }
  }, [open]);

  const handleGoTo = (conversationId: string) => {
    selectConversation(conversationId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Search className="h-5 w-5 text-primary" />
            Search Messages
          </DialogTitle>
          <DialogDescription>
            Search across all your conversations. Find any message by content.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search message content..."
            className="pl-9 pr-9"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (debounceRef.current) clearTimeout(debounceRef.current);
                void performSearch(query);
              }
            }}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        <ScrollArea className="flex-1 -mx-1 px-1 min-h-[200px]">
          {!hasSearched ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Search className="h-8 w-8 text-primary/50" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Search your conversations
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Type to search across all message content. Results update as you type.
              </p>
            </div>
          ) : loading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-3 space-y-2">
                  <Skeleton className="h-3 w-1/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                No results found
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                No messages match &ldquo;{query}&rdquo;. Try different keywords.
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-2">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="group rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition-colors cursor-pointer"
                  onClick={() => handleGoTo(result.conversationId)}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {result.role === 'user' ? (
                        <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                      <span className="text-xs font-medium text-foreground">
                        {result.role === 'user' ? 'You' : 'Nexus AI'}
                      </span>
                      {result.type !== 'text' && (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                          {result.type}
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground truncate">
                        in &ldquo;{result.conversationTitle}&rdquo;
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] text-muted-foreground/70">
                        {formatTimestamp(result.createdAt)}
                      </span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                    <HighlightMatch text={result.snippet} query={query} />
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {hasSearched && !loading && results.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
            </span>
            <span className="text-[10px] text-muted-foreground/60">
              Click a result to open the conversation
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
