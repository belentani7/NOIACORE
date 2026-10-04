'use client';

import { useMemo, useState } from 'react';
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
import { useChatStore } from '@/store/chat-store';
import { toast } from 'sonner';
import {
  Search,
  LayoutGrid,
  Code,
  GraduationCap,
  PenTool,
  Languages,
  Database,
  Mail,
  Lightbulb,
  BarChart3,
  Plane,
  ChefHat,
  Calculator,
  Briefcase,
  Sparkles,
  Plus,
  Check,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  code: Code,
  'graduation-cap': GraduationCap,
  'pen-tool': PenTool,
  languages: Languages,
  database: Database,
  mail: Mail,
  lightbulb: Lightbulb,
  'bar-chart': BarChart3,
  plane: Plane,
  'chef-hat': ChefHat,
  calculator: Calculator,
  briefcase: Briefcase,
};

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  development: 'Development',
  writing: 'Writing',
  learning: 'Learning',
  creative: 'Creative',
  analysis: 'Analysis',
  lifestyle: 'Lifestyle',
  career: 'Career',
};

export function TemplatesDialog() {
  const open = useChatStore((s) => s.templatesOpen);
  const setOpen = useChatStore((s) => s.setTemplatesOpen);
  const templates = useChatStore((s) => s.templates);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const setTemplatesOpen = useChatStore((s) => s.setTemplatesOpen);

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(templates.map((t) => t.category));
    return ['all', ...Array.from(set)];
  }, [templates]);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      const matchesSearch =
        !search ||
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.description.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === 'all' || t.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, search, activeCategory]);

  const handleUseTemplate = (content: string, title: string) => {
    setSelectedTemplate(null);
    setTemplatesOpen(false);
    toast.success(`Using template: ${title}`);
    // Send the template as a user message
    sendMessage(content).catch(() => {
      toast.error('Failed to use template');
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <LayoutGrid className="h-5 w-5 text-primary" />
            Prompt Templates
          </DialogTitle>
          <DialogDescription>
            Quick-start templates for common tasks. Click a template to use it.
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates..."
            className="pl-9"
          />
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={activeCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat)}
              className="h-7 text-xs"
            >
              {cat === 'all' ? 'All' : CATEGORY_LABELS[cat] || cat}
            </Button>
          ))}
        </div>

        {/* Templates grid */}
        <ScrollArea className="flex-1 -mx-1 px-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Sparkles className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">
                No templates found. Try a different search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
              {filtered.map((template) => {
                const Icon = ICON_MAP[template.icon || ''] || Sparkles;
                const isSelected = selectedTemplate === template.id;

                return (
                  <div
                    key={template.id}
                    className={`group relative rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'hover:border-primary/40'
                    }`}
                    onClick={() =>
                      setSelectedTemplate(
                        isSelected ? null : template.id || null
                      )
                    }
                  >
                    <div className="flex items-start gap-3 mb-2">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">
                          {template.title}
                        </h4>
                        <Badge variant="secondary" className="mt-1 text-[10px] h-5">
                          {CATEGORY_LABELS[template.category] || template.category}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {template.description}
                    </p>

                    {isSelected && (
                      <div className="mt-3 space-y-2 fade-in">
                        <div className="rounded-lg bg-muted p-3 text-xs font-mono max-h-32 overflow-y-auto scrollbar-thin">
                          {template.content}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            placeholder="Add your specific request..."
                            className="h-8 text-xs"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <Button
                            size="sm"
                            className="h-8 gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleUseTemplate(
                                template.content,
                                template.title
                              );
                            }}
                          >
                            <Plus className="h-3 w-3" />
                            Use
                          </Button>
                        </div>
                      </div>
                    )}

                    {!isSelected && (
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          {filtered.length} template{filtered.length !== 1 ? 's' : ''} available
        </div>
      </DialogContent>
    </Dialog>
  );
}
