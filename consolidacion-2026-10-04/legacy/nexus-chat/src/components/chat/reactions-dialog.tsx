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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useChatStore } from '@/store/chat-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';

interface ReactionEntry {
  id: string;
  content: string;
  role: string;
  type: string;
  reaction: string | null;
  createdAt: string;
  conversationId: string;
  conversationTitle: string;
  bookmarked: boolean;
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

export function ReactionsDialog() {
  const open = useChatStore((s) => s.reactionsOpen);
  const setOpen = useChatStore((s) => s.setReactionsOpen);
  const selectConversation = useChatStore((s) => s.selectConversation);

  const [results, setResults] = useState<ReactionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'up' | 'down'>('all');
  const [positiveCount, setPositiveCount] = useState(0);
  const [negativeCount, setNegativeCount] = useState(0);

  const loadReactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getReactions('', 50);
      setResults(data.results);
      setPositiveCount(data.positiveCount);
      setNegativeCount(data.negativeCount);
    } catch {
      toast.error('Failed to load reactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadReactions();
    }
  }, [open, loadReactions]);

  const handleGoTo = (conversationId: string) => {
    selectConversation(conversationId);
    setOpen(false);
  };

  const filtered = results.filter((r) => {
    if (activeTab === 'all') return true;
    return r.reaction === activeTab;
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <ThumbsUp className="h-5 w-5 text-primary" />
            Reactions Summary
          </DialogTitle>
          <DialogDescription>
            Review all your liked and disliked AI responses across conversations.
          </DialogDescription>
        </DialogHeader>

        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className={cn(
              'rounded-lg border p-3 cursor-pointer transition-colors',
              activeTab === 'up'
                ? 'border-green-500/40 bg-green-500/5'
                : 'border-border hover:border-green-500/30'
            )}
            onClick={() => setActiveTab('up')}
          >
            <div className="flex items-center gap-2 mb-1">
              <ThumbsUp className="h-4 w-4 text-green-500" />
              <span className="text-xs font-medium text-muted-foreground">
                Positive
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{positiveCount}</p>
          </div>
          <div
            className={cn(
              'rounded-lg border p-3 cursor-pointer transition-colors',
              activeTab === 'down'
                ? 'border-destructive/40 bg-destructive/5'
                : 'border-border hover:border-destructive/30'
            )}
            onClick={() => setActiveTab('down')}
          >
            <div className="flex items-center gap-2 mb-1">
              <ThumbsDown className="h-4 w-4 text-destructive" />
              <span className="text-xs font-medium text-muted-foreground">
                Negative
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{negativeCount}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'all' | 'up' | 'down')}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all" className="text-xs">
              All ({results.length})
            </TabsTrigger>
            <TabsTrigger value="up" className="text-xs gap-1">
              <ThumbsUp className="h-3 w-3" />
              Liked ({positiveCount})
            </TabsTrigger>
            <TabsTrigger value="down" className="text-xs gap-1">
              <ThumbsDown className="h-3 w-3" />
              Disliked ({negativeCount})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-3">
            <ScrollArea className="h-[300px] -mx-1 px-1">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-lg border p-3 space-y-2">
                      <Skeleton className="h-3 w-1/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    No reactions yet
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-xs">
                    Use the thumbs up/down buttons on AI responses to rate them.
                    They&apos;ll appear here for review.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pb-2">
                  {filtered.map((entry) => (
                    <div
                      key={entry.id}
                      className="group rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition-colors cursor-pointer"
                      onClick={() => handleGoTo(entry.conversationId)}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary" />
                          <span className="text-xs font-medium text-foreground">
                            Nexus AI
                          </span>
                          {entry.reaction === 'up' ? (
                            <Badge className="text-[9px] h-4 px-1.5 gap-0.5 bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/10">
                              <ThumbsUp className="h-2.5 w-2.5" />
                              Liked
                            </Badge>
                          ) : (
                            <Badge className="text-[9px] h-4 px-1.5 gap-0.5 bg-destructive/10 text-destructive hover:bg-destructive/10">
                              <ThumbsDown className="h-2.5 w-2.5" />
                              Disliked
                            </Badge>
                          )}
                          <span className="text-[10px] text-muted-foreground truncate">
                            in &ldquo;{entry.conversationTitle}&rdquo;
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[10px] text-muted-foreground/70">
                            {formatTimestamp(entry.createdAt)}
                          </span>
                          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                        {entry.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-xs text-muted-foreground">
              Showing {filtered.length} of {results.length} reactions
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
