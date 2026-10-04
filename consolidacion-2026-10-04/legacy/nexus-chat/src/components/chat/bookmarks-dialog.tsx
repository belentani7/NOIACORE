'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useChatStore } from '@/store/chat-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Bookmark, ExternalLink, Trash2, Loader2, Sparkles, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';

interface BookmarkEntry {
  id: string;
  content: string;
  role: string;
  type: string;
  createdAt: string;
  conversation?: {
    id: string;
    title: string;
  };
}

function formatTimestamp(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isToday(date)) return format(date, 'HH:mm');
    if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
    return format(date, 'MMM d, HH:mm');
  } catch {
    return '';
  }
}

export function BookmarksDialog() {
  const open = useChatStore((s) => s.bookmarksOpen);
  const setOpen = useChatStore((s) => s.setBookmarksOpen);
  const selectConversation = useChatStore((s) => s.selectConversation);

  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const { messages } = await api.getBookmarks(50);
      setBookmarks(messages as BookmarkEntry[]);
    } catch {
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadBookmarks();
    }
  }, [open, loadBookmarks]);

  const handleRemove = async (id: string) => {
    // Optimistic remove
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
    try {
      await api.updateMessage({ id, bookmarked: false });
      toast.success('Bookmark removed');
    } catch {
      toast.error('Failed to remove bookmark');
      // Revert by reloading
      const { messages } = await api.getBookmarks(50);
      setBookmarks(messages as BookmarkEntry[]);
    }
  };

  const handleGoTo = (conversationId: string) => {
    selectConversation(conversationId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bookmark className="h-5 w-5 text-primary fill-primary" />
            Bookmarked Messages
          </DialogTitle>
          <DialogDescription>
            Your saved messages across all conversations. Click to jump to the conversation.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-1 px-1">
          {loading ? (
            <div className="space-y-3 py-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="rounded-lg border p-4 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              ))}
            </div>
          ) : bookmarks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4">
                <Bookmark className="h-8 w-8 text-primary/50" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">
                No bookmarks yet
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs">
                Bookmark important messages by clicking the bookmark icon on any message.
                They&apos;ll appear here for quick access.
              </p>
            </div>
          ) : (
            <div className="space-y-2 pb-2">
              {bookmarks.map((bm) => (
                <div
                  key={bm.id}
                  className="group rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {bm.role === 'user' ? (
                        <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                      )}
                      <span className="text-xs font-medium text-foreground">
                        {bm.role === 'user' ? 'You' : 'Nexus AI'}
                      </span>
                      {bm.type !== 'text' && (
                        <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                          {bm.type}
                        </Badge>
                      )}
                      {bm.conversation && (
                        <span className="text-[10px] text-muted-foreground truncate">
                          in &ldquo;{bm.conversation.title}&rdquo;
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground/70 shrink-0">
                      {formatTimestamp(bm.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm text-foreground line-clamp-3 mb-2 leading-relaxed">
                    {bm.content}
                  </p>

                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {bm.conversation && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleGoTo(bm.conversation!.id)}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Go to conversation
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 text-destructive hover:text-destructive"
                      onClick={() => handleRemove(bm.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {!loading && bookmarks.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              {bookmarks.length} bookmarked message{bookmarks.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
