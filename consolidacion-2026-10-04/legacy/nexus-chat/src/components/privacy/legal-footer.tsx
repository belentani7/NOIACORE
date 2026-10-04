'use client';

import { useChatStore } from '@/store/chat-store';
import { Shield, Scale, Cookie, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LegalFooter() {
  const setPrivacyOpen = useChatStore((s) => s.setPrivacyOpen);
  const setLegalOpen = useChatStore((s) => s.setLegalOpen);

  return (
    <footer className="border-t border-sidebar-border/60 px-3 py-2">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        <span className="font-medium">© {new Date().getFullYear()} Nexus AI</span>
        <span className="text-muted-foreground/40">·</span>
        <button
          type="button"
          onClick={() => setLegalOpen(true)}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Scale className="h-2.5 w-2.5" />
          Aviso Legal
        </button>
        <button
          type="button"
          onClick={() => setLegalOpen(true)}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <BookOpen className="h-2.5 w-2.5" />
          Términos
        </button>
        <button
          type="button"
          onClick={() => setPrivacyOpen(true)}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Shield className="h-2.5 w-2.5" />
          Privacidad
        </button>
        <button
          type="button"
          onClick={() => setLegalOpen(true)}
          className="flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Cookie className="h-2.5 w-2.5" />
          Cookies
        </button>
      </div>
      <p className="text-[9px] text-muted-foreground/60 text-center mt-1">
        Barcelona, Cataluña · RGPD (UE) 2016/679 · LOPDGDD · LSSI-CE
      </p>
    </footer>
  );
}
