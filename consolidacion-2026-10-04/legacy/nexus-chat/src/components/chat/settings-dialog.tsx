'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChatStore } from '@/store/chat-store';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import {
  Bot,
  Volume2,
  Palette,
  Sliders,
  Gauge,
  Loader2,
  Library,
  Save,
  Play,
} from 'lucide-react';

const VOICES = [
  { value: 'tongtong', label: 'Tongtong — Warm & Friendly' },
  { value: 'chuichui', label: 'Chuichui — Lively & Cute' },
  { value: 'xiaochen', label: 'Xiaochen — Calm & Professional' },
  { value: 'jam', label: 'Jam — British Gentleman' },
  { value: 'kazi', label: 'Kazi — Clear & Standard' },
  { value: 'douji', label: 'Douji — Natural & Fluent' },
  { value: 'luodo', label: 'Luodo — Expressive' },
];

export function SettingsDialog() {
  const open = useChatStore((s) => s.settingsOpen);
  const setOpen = useChatStore((s) => s.setSettingsOpen);
  const settings = useChatStore((s) => s.settings);
  const updateSettings = useChatStore((s) => s.updateSettings);

  const { theme, setTheme } = useTheme();

  const [form, setForm] = useState({
    systemPrompt: '',
    temperature: 0.7,
    ttsVoice: 'tongtong',
    ttsSpeed: 1.0,
    ttsEnabled: false,
    streamingEnabled: true,
    maxHistoryMessages: 20,
  });
  const [saving, setSaving] = useState(false);
  const [testingVoice, setTestingVoice] = useState(false);

  useEffect(() => {
    if (settings) {
      setForm({
        systemPrompt: settings.systemPrompt,
        temperature: settings.temperature,
        ttsVoice: settings.ttsVoice,
        ttsSpeed: settings.ttsSpeed,
        ttsEnabled: settings.ttsEnabled,
        streamingEnabled: settings.streamingEnabled,
        maxHistoryMessages: settings.maxHistoryMessages,
      });
    }
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(form);
      toast.success('Settings saved');
      setOpen(false);
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const testVoice = async () => {
    setTestingVoice(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `Hello, this is a test of the ${form.ttsVoice} voice.`,
          voice: form.ttsVoice,
          speed: form.ttsSpeed,
        }),
      });
      if (!res.ok) throw new Error('TTS failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audio.play();
      toast.success('Playing test voice...');
    } catch {
      toast.error('Failed to test voice');
    } finally {
      setTestingVoice(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sliders className="h-5 w-5 text-primary" />
            Settings
          </DialogTitle>
          <DialogDescription>
            Customize your Nexus AI experience
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="assistant" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="assistant" className="gap-1.5">
              <Bot className="h-4 w-4" />
              <span className="hidden sm:inline">Assistant</span>
            </TabsTrigger>
            <TabsTrigger value="voice" className="gap-1.5">
              <Volume2 className="h-4 w-4" />
              <span className="hidden sm:inline">Voice</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
          </TabsList>

          {/* Assistant Tab */}
          <TabsContent value="assistant" className="space-y-5 mt-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">System Prompt</Label>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => {
                    setOpen(false);
                    useChatStore.getState().setSystemPromptsOpen(true);
                  }}
                >
                  <Library className="h-3.5 w-3.5" />
                  Library
                </Button>
              </div>
              <Textarea
                value={form.systemPrompt}
                onChange={(e) =>
                  setForm((f) => ({ ...f, systemPrompt: e.target.value }))
                }
                placeholder="Define how the AI assistant should behave..."
                className="min-h-[120px] resize-y"
              />
              <p className="text-xs text-muted-foreground">
                This prompt is prepended to every conversation to set the assistant&apos;s behavior.
                Use the Library to save and reuse custom prompts.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Gauge className="h-4 w-4" />
                  Temperature
                </Label>
                <span className="text-sm font-mono text-primary">
                  {form.temperature.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[form.temperature]}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, temperature: v[0] }))
                }
                min={0}
                max={2}
                step={0.1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Precise (0.0)</span>
                <span>Balanced (0.7)</span>
                <span>Creative (2.0)</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">
                  Max History Messages
                </Label>
                <span className="text-sm font-mono text-primary">
                  {form.maxHistoryMessages}
                </span>
              </div>
              <Slider
                value={[form.maxHistoryMessages]}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, maxHistoryMessages: v[0] }))
                }
                min={5}
                max={50}
                step={5}
              />
              <p className="text-xs text-muted-foreground">
                Number of previous messages to include as context for each new message.
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Streaming Responses</Label>
                <p className="text-xs text-muted-foreground">
                  Show responses as they are generated in real-time.
                </p>
              </div>
              <Switch
                checked={form.streamingEnabled}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, streamingEnabled: v }))
                }
              />
            </div>
          </TabsContent>

          {/* Voice Tab */}
          <TabsContent value="voice" className="space-y-5 mt-5">
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Enable TTS</Label>
                <p className="text-xs text-muted-foreground">
                  Allow reading assistant messages aloud.
                </p>
              </div>
              <Switch
                checked={form.ttsEnabled}
                onCheckedChange={(v) =>
                  setForm((f) => ({ ...f, ttsEnabled: v }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Voice</Label>
              <Select
                value={form.ttsVoice}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, ttsVoice: v }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICES.map((v) => (
                    <SelectItem key={v.value} value={v.value}>
                      {v.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Speech Speed</Label>
                <span className="text-sm font-mono text-primary">
                  {form.ttsSpeed.toFixed(1)}x
                </span>
              </div>
              <Slider
                value={[form.ttsSpeed]}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, ttsSpeed: v[0] }))
                }
                min={0.5}
                max={2}
                step={0.1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.5x (Slow)</span>
                <span>1.0x (Normal)</span>
                <span>2.0x (Fast)</span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={testVoice}
              disabled={testingVoice}
              className="w-full gap-2"
            >
              {testingVoice ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Test Voice
            </Button>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-5 mt-5">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Theme</Label>
              <Select
                value={theme || 'system'}
                onValueChange={(v) => setTheme(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">☀️ Light</SelectItem>
                  <SelectItem value="dark">🌙 Dark</SelectItem>
                  <SelectItem value="system">💻 System</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Choose your preferred color theme.
              </p>
            </div>

            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-primary" />
                <span className="text-sm font-medium">Primary Color</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Nexus AI uses a violet/purple accent color scheme by default.
              </p>
              <div className="flex gap-2 pt-2">
                <div className="h-8 w-8 rounded-md bg-primary" />
                <div className="h-8 w-8 rounded-md bg-chart-1" />
                <div className="h-8 w-8 rounded-md bg-chart-4" />
                <div className="h-8 w-8 rounded-md bg-chart-2" />
                <div className="h-8 w-8 rounded-md bg-chart-3" />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
