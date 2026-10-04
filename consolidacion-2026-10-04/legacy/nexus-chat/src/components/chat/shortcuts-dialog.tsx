'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useChatStore } from '@/store/chat-store';
import { SHORTCUTS_LIST } from '@/hooks/use-keyboard-shortcuts';
import { Keyboard } from 'lucide-react';

export function ShortcutsDialog() {
  const open = useChatStore((s) => s.shortcutsOpen);
  const setOpen = useChatStore((s) => s.setShortcutsOpen);

  const categories = Array.from(
    new Set(SHORTCUTS_LIST.map((s) => s.category))
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5 text-primary" />
            Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>
            Speed up your workflow with these shortcuts.
            Use <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">⌘</kbd> on Mac or{' '}
            <kbd className="px-1.5 py-0.5 text-xs rounded border bg-muted font-mono">Ctrl</kbd> on Windows/Linux.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] -mx-1 px-1">
          <div className="space-y-5 pb-2">
            {categories.map((category) => (
              <div key={category} className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  {category}
                </h4>
                <div className="space-y-1">
                  {SHORTCUTS_LIST.filter((s) => s.category === category).map(
                    (shortcut, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-accent/50 transition-colors"
                      >
                        <span className="text-sm text-foreground">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, j) => (
                            <kbd
                              key={j}
                              className="min-w-[1.5rem] text-center px-1.5 py-0.5 text-xs rounded border bg-muted font-mono font-semibold shadow-sm"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center gap-2 pt-2 border-t">
          <Badge variant="secondary" className="gap-1">
            <Keyboard className="h-3 w-3" />
            {SHORTCUTS_LIST.length} shortcuts
          </Badge>
          <span className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 text-xs rounded border bg-muted font-mono">?</kbd> anytime to open this
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
