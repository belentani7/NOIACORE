'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatStore } from '@/store/chat-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  BarChart3,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Bookmark,
  Sparkles,
  User,
  Pin,
  Tag,
  Hash,
  TrendingUp,
  FileText,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

interface StatsData {
  conversations: { total: number; pinned: number };
  messages: {
    total: number;
    byRole: { user: number; assistant: number };
    byType: {
      text: number;
      vision: number;
      search: number;
      imageGen: number;
    };
  };
  reactions: { positive: number; negative: number };
  bookmarks: number;
  tags: Record<string, number>;
  activity: Array<{ date: string; count: number }>;
  content: { totalCharacters: number; estimatedTokens: number };
}

function StatCard({
  icon: Icon,
  label,
  value,
  sublabel,
  color,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sublabel?: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-1">
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', color)}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sublabel && (
        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{sublabel}</p>
      )}
    </div>
  );
}

function ActivityChart({ data }: { data: Array<{ date: string; count: number }> }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-6 text-xs text-muted-foreground">
        No recent activity
      </div>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="flex items-end gap-1 h-24 mt-2">
      {data.map((d, i) => {
        const height = (d.count / maxCount) * 100;
        return (
          <div
            key={i}
            className="flex-1 flex flex-col items-center gap-1 group"
          >
            <div className="relative w-full flex-1 flex items-end">
              <div
                className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-t-sm transition-all group-hover:from-primary group-hover:to-primary relative"
                style={{ height: `${height}%`, minHeight: '4px' }}
              >
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  {d.count}
                </span>
              </div>
            </div>
            <span className="text-[8px] text-muted-foreground/60">
              {format(parseISO(d.date), 'EEE')}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function StatsDialog() {
  const open = useChatStore((s) => s.statsOpen);
  const setOpen = useChatStore((s) => s.setStatsOpen);

  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getStats();
      setStats(data);
    } catch {
      toast.error('Failed to load stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadStats();
    }
  }, [open, loadStats]);

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
    return n.toString();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <BarChart3 className="h-5 w-5 text-primary" />
            Usage Statistics
          </DialogTitle>
          <DialogDescription>
            Overview of your Nexus AI usage across all conversations.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-1 px-1">
          {loading ? (
            <div className="space-y-3 py-2">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
              <Skeleton className="h-32" />
            </div>
          ) : stats ? (
            <div className="space-y-4 pb-2">
              {/* Main stat cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard
                  icon={MessageSquare}
                  label="Conversations"
                  value={stats.conversations.total}
                  sublabel={`${stats.conversations.pinned} pinned`}
                  color="bg-primary/10 text-primary"
                />
                <StatCard
                  icon={Hash}
                  label="Messages"
                  value={formatNumber(stats.messages.total)}
                  sublabel={`${stats.messages.byRole.user} you · ${stats.messages.byRole.assistant} AI`}
                  color="bg-blue-500/10 text-blue-500"
                />
                <StatCard
                  icon={ThumbsUp}
                  label="Positive"
                  value={stats.reactions.positive}
                  sublabel="liked responses"
                  color="bg-green-500/10 text-green-500"
                />
                <StatCard
                  icon={Bookmark}
                  label="Bookmarks"
                  value={stats.bookmarks}
                  sublabel="saved messages"
                  color="bg-amber-500/10 text-amber-500"
                />
              </div>

              {/* Activity chart */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Activity (Last 7 Days)
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Messages per day
                </p>
                <ActivityChart data={stats.activity} />
              </div>

              {/* Message breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* By role */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Messages by Role
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs text-foreground">You</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {stats.messages.byRole.user}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span className="text-xs text-foreground">Nexus AI</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        {stats.messages.byRole.assistant}
                      </span>
                    </div>
                  </div>
                </div>

                {/* By type */}
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Messages by Type
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-foreground">💬 Text</span>
                      <span className="text-sm font-semibold text-foreground">
                        {stats.messages.byType.text}
                      </span>
                    </div>
                    {stats.messages.byType.vision > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground">👁 Vision</span>
                        <span className="text-sm font-semibold text-foreground">
                          {stats.messages.byType.vision}
                        </span>
                      </div>
                    )}
                    {stats.messages.byType.search > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground">🔍 Search</span>
                        <span className="text-sm font-semibold text-foreground">
                          {stats.messages.byType.search}
                        </span>
                      </div>
                    )}
                    {stats.messages.byType.imageGen > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-foreground">🎨 Image Gen</span>
                        <span className="text-sm font-semibold text-foreground">
                          {stats.messages.byType.imageGen}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Content stats */}
              <div className="grid grid-cols-2 gap-3">
                <StatCard
                  icon={FileText}
                  label="Characters"
                  value={formatNumber(stats.content.totalCharacters)}
                  color="bg-cyan-500/10 text-cyan-500"
                />
                <StatCard
                  icon={Brain}
                  label="Est. Tokens"
                  value={formatNumber(stats.content.estimatedTokens)}
                  color="bg-violet-500/10 text-violet-500"
                />
              </div>

              {/* Tags */}
              {Object.keys(stats.tags).length > 0 && (
                <div className="rounded-lg border border-border bg-card p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-foreground">
                      Tags ({Object.keys(stats.tags).length})
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(stats.tags)
                      .sort(([, a], [, b]) => b - a)
                      .map(([tag, count]) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="gap-1"
                        >
                          <Tag className="h-2.5 w-2.5" />
                          {tag}
                          <span className="text-[9px] text-muted-foreground ml-1">
                            {count}
                          </span>
                        </Badge>
                      ))}
                  </div>
                </div>
              )}

              {/* Reactions summary */}
              <div className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <ThumbsUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">
                    Reactions Summary
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center justify-between rounded-md bg-green-500/5 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <ThumbsUp className="h-4 w-4 text-green-500" />
                      <span className="text-xs text-foreground">Positive</span>
                    </div>
                    <span className="text-lg font-bold text-green-500">
                      {stats.reactions.positive}
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-md bg-destructive/5 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <ThumbsDown className="h-4 w-4 text-destructive" />
                      <span className="text-xs text-foreground">Negative</span>
                    </div>
                    <span className="text-lg font-bold text-destructive">
                      {stats.reactions.negative}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                No statistics available
              </p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
