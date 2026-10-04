'use client';

const STORAGE_KEY = 'nexus-ai-prompt-history';
const MAX_HISTORY = 50;

export interface PromptHistoryEntry {
  content: string;
  timestamp: number;
  type: 'text' | 'vision' | 'search' | 'image-gen';
}

export function getPromptHistory(): PromptHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, MAX_HISTORY);
  } catch {
    return [];
  }
}

export function addToPromptHistory(content: string, type: PromptHistoryEntry['type'] = 'text') {
  if (typeof window === 'undefined') return;
  if (!content.trim()) return;
  try {
    const history = getPromptHistory();
    // Remove duplicates (same content)
    const filtered = history.filter((h) => h.content !== content);
    // Add to front
    filtered.unshift({ content: content.trim(), timestamp: Date.now(), type });
    // Keep only MAX_HISTORY entries
    const trimmed = filtered.slice(0, MAX_HISTORY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function clearPromptHistory() {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function removePromptFromHistory(content: string) {
  if (typeof window === 'undefined') return;
  try {
    const history = getPromptHistory();
    const filtered = history.filter((h) => h.content !== content);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}
