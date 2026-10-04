/**
 * Tag color system - deterministic color assignment based on tag name hash.
 * Each tag gets a consistent color from a curated palette.
 */

export interface TagColor {
  name: string;
  bg: string;
  text: string;
  border: string;
  dot: string;
}

export const TAG_COLORS: TagColor[] = [
  {
    name: 'violet',
    bg: 'bg-violet-500/10',
    text: 'text-violet-600 dark:text-violet-400',
    border: 'border-violet-500/20',
    dot: 'bg-violet-500',
  },
  {
    name: 'blue',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
  },
  {
    name: 'green',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  {
    name: 'amber',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
  },
  {
    name: 'rose',
    bg: 'bg-rose-500/10',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-500/20',
    dot: 'bg-rose-500',
  },
  {
    name: 'cyan',
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-600 dark:text-cyan-400',
    border: 'border-cyan-500/20',
    dot: 'bg-cyan-500',
  },
  {
    name: 'orange',
    bg: 'bg-orange-500/10',
    text: 'text-orange-600 dark:text-orange-400',
    border: 'border-orange-500/20',
    dot: 'bg-orange-500',
  },
  {
    name: 'teal',
    bg: 'bg-teal-500/10',
    text: 'text-teal-600 dark:text-teal-400',
    border: 'border-teal-500/20',
    dot: 'bg-teal-500',
  },
];

/**
 * Get a deterministic color for a tag name.
 * Uses a simple hash function to always return the same color for the same tag.
 */
export function getTagColor(tagName: string): TagColor {
  let hash = 0;
  for (let i = 0; i < tagName.length; i++) {
    const char = tagName.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  const index = Math.abs(hash) % TAG_COLORS.length;
  return TAG_COLORS[index];
}

/**
 * Get the CSS classes for a tag badge.
 */
export function getTagBadgeClasses(tagName: string): string {
  const color = getTagColor(tagName);
  return `${color.bg} ${color.text}`;
}

/**
 * Get the CSS classes for a tag filter pill (active state).
 */
export function getTagPillClasses(tagName: string, isActive: boolean): string {
  if (isActive) {
    const color = getTagColor(tagName);
    return `${color.bg} ${color.text} ${color.border} border`;
  }
  return 'bg-muted text-muted-foreground hover:bg-accent';
}
