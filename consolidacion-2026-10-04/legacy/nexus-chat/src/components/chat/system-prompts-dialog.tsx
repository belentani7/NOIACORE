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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useChatStore } from '@/store/chat-store';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import {
  Bot,
  Plus,
  Pencil,
  Trash2,
  Check,
  Star,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SystemPromptEntry {
  id: string;
  title: string;
  content: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

const PRESET_PROMPTS = [
  {
    title: 'Professional Assistant',
    content:
      'You are a professional assistant. Provide clear, concise, and well-structured responses. Use formal language and maintain a helpful tone.',
  },
  {
    title: 'Creative Writer',
    content:
      'You are a creative writer with a vivid imagination. Write engaging, descriptive content with rich vocabulary and storytelling techniques.',
  },
  {
    title: 'Code Expert',
    content:
      'You are an expert programmer. Provide clean, well-commented code with explanations. Follow best practices and suggest optimizations.',
  },
  {
    title: 'Language Tutor',
    content:
      'You are a patient language tutor. Help users learn languages by providing corrections, explanations, and examples. Encourage practice.',
  },
];

export function SystemPromptsDialog() {
  const open = useChatStore((s) => s.systemPromptsOpen);
  const setOpen = useChatStore((s) => s.setSystemPromptsOpen);
  const updateSettings = useChatStore((s) => s.updateSettings);
  const settings = useChatStore((s) => s.settings);

  const [prompts, setPrompts] = useState<SystemPromptEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SystemPromptEntry | null>(null);
  const [saving, setSaving] = useState(false);

  const loadPrompts = useCallback(async () => {
    setLoading(true);
    try {
      const { prompts } = await api.listSystemPrompts();
      setPrompts(prompts);
    } catch {
      toast.error('Failed to load system prompts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      void loadPrompts();
    }
  }, [open, loadPrompts]);

  const handleSave = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error('Title and content are required');
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await api.updateSystemPrompt(editingId, {
          title: editTitle.trim(),
          content: editContent.trim(),
        });
        toast.success('System prompt updated');
      } else {
        await api.createSystemPrompt({
          title: editTitle.trim(),
          content: editContent.trim(),
        });
        toast.success('System prompt created');
      }
      setEditingId(null);
      setEditTitle('');
      setEditContent('');
      setIsCreating(false);
      await loadPrompts();
    } catch {
      toast.error('Failed to save system prompt');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
    setIsCreating(false);
  };

  const handleEdit = (prompt: SystemPromptEntry) => {
    setEditingId(prompt.id);
    setEditTitle(prompt.title);
    setEditContent(prompt.content);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingId(null);
    setEditTitle('');
    setEditContent('');
    setIsCreating(true);
  };

  const handleSetDefault = async (prompt: SystemPromptEntry) => {
    try {
      await api.updateSystemPrompt(prompt.id, { isDefault: true });
      await loadPrompts();
      toast.success(`"${prompt.title}" set as default system prompt`);
    } catch {
      toast.error('Failed to set default');
    }
  };

  const handleApplyToSettings = async (prompt: SystemPromptEntry) => {
    try {
      await updateSettings({ systemPrompt: prompt.content });
      toast.success(`Applied "${prompt.title}" to your settings`);
      setOpen(false);
    } catch {
      toast.error('Failed to apply system prompt');
    }
  };

  const handleUsePreset = async (preset: (typeof PRESET_PROMPTS)[0]) => {
    setSaving(true);
    try {
      await api.createSystemPrompt({
        title: preset.title,
        content: preset.content,
      });
      toast.success(`Added "${preset.title}" preset`);
      await loadPrompts();
    } catch {
      toast.error('Failed to add preset');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteSystemPrompt(deleteTarget.id);
      toast.success('System prompt deleted');
      setDeleteTarget(null);
      await loadPrompts();
    } catch {
      toast.error('Failed to delete system prompt');
    }
  };

  const isEditing = editingId !== null || isCreating;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Bot className="h-5 w-5 text-primary" />
            System Prompts Library
          </DialogTitle>
          <DialogDescription>
            Save and reuse custom system prompts to customize how Nexus AI behaves.
          </DialogDescription>
        </DialogHeader>

        {!isEditing ? (
          <>
            {/* Presets */}
            {prompts.length === 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Quick Start Presets
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_PROMPTS.map((preset) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => handleUsePreset(preset)}
                      disabled={saving}
                      className="group flex items-start gap-2 rounded-lg border border-border bg-card p-3 text-left hover:border-primary/40 transition-colors"
                    >
                      <Plus className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {preset.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
                          {preset.content}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Create button */}
            <Button onClick={handleCreate} className="w-full gap-2" size="sm">
              <Plus className="h-4 w-4" />
              Create New System Prompt
            </Button>

            {/* List */}
            <ScrollArea className="flex-1 -mx-1 px-1 min-h-[200px]">
              {loading ? (
                <div className="space-y-2 py-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="rounded-lg border p-3 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>
              ) : prompts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-3">
                    <Bot className="h-7 w-7 text-primary/50" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    No custom prompts yet. Use presets above or create your own.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 pb-2">
                  {prompts.map((prompt) => (
                    <div
                      key={prompt.id}
                      className="group rounded-lg border border-border bg-card p-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <Bot className="h-4 w-4 shrink-0 text-primary" />
                          <span className="text-sm font-medium text-foreground truncate">
                            {prompt.title}
                          </span>
                          {prompt.isDefault && (
                            <Badge className="text-[9px] h-4 px-1.5 gap-0.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
                              <Star className="h-2.5 w-2.5 fill-amber-500" />
                              Default
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleApplyToSettings(prompt)}
                            title="Apply to settings"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => handleEdit(prompt)}
                            title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {!prompt.isDefault && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleSetDefault(prompt)}
                              title="Set as default"
                            >
                              <Star className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={() => setDeleteTarget(prompt)}
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {prompt.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {settings && (
              <div className="pt-2 border-t">
                <p className="text-[10px] text-muted-foreground/70">
                  Current active prompt:{' '}
                  <span className="font-mono">
                    {settings.systemPrompt.substring(0, 60)}
                    {settings.systemPrompt.length > 60 ? '…' : ''}
                  </span>
                </p>
              </div>
            )}
          </>
        ) : (
          /* Edit/Create form */
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="e.g. My Custom Assistant"
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                System Prompt Content
              </label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Define how the AI assistant should behave..."
                className="min-h-[200px] resize-y font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                This prompt will be prepended to conversations to set the assistant&apos;s behavior and personality.
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancel} size="sm">
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !editTitle.trim() || !editContent.trim()}
                size="sm"
                className="gap-2"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {editingId ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete system prompt?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete{' '}
              <span className="font-medium text-foreground">
                &ldquo;{deleteTarget?.title}&rdquo;
              </span>
              . This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
