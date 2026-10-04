import type {
  Conversation,
  ChatMessage,
  PromptTemplate,
  UserSettings,
  SearchResult,
  ChatStreamEvent,
} from '@/types';

async function request<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Conversations
  listConversations: async (search = '', archived = false, tag = '') => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (archived) params.set('archived', 'true');
    if (tag) params.set('tag', tag);
    return request<{ conversations: Conversation[] }>(
      `/api/conversations?${params.toString()}`
    );
  },

  getConversation: async (id: string) => {
    return request<{ conversation: Conversation }>(`/api/conversations/${id}`);
  },

  createConversation: async (data?: {
    title?: string;
    systemPrompt?: string;
    tags?: string[];
  }) => {
    return request<{ conversation: Conversation }>(`/api/conversations`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    });
  },

  updateConversation: async (
    id: string,
    data: Partial<Pick<Conversation, 'title' | 'pinned' | 'archived' | 'systemPrompt' | 'temperature' | 'tags'>>
  ) => {
    return request<{ conversation: Conversation }>(`/api/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteConversation: async (id: string) => {
    return request<{ success: boolean }>(`/api/conversations/${id}`, {
      method: 'DELETE',
    });
  },

  generateTitle: async (id: string) => {
    return request<{ title: string; skipped: boolean }>(
      `/api/conversations/${id}/generate-title`,
      { method: 'POST' }
    );
  },

  importConversation: async (data: {
    conversation: {
      title: string;
      systemPrompt?: string | null;
      model?: string;
      temperature?: number;
      tags?: string[];
      messages: Array<{
        role: string;
        content: string;
        type?: string;
        metadata?: unknown;
        reaction?: string | null;
        bookmarked?: boolean;
      }>;
    };
  }) => {
    return request<{
      success: boolean;
      conversationId: string;
      messageCount: number;
    }>(`/api/conversations/import`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Messages
  createMessage: async (data: {
    conversationId: string;
    role: string;
    content: string;
    type?: string;
    metadata?: unknown;
  }) => {
    return request<{ message: ChatMessage }>(`/api/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateMessage: async (data: {
    id: string;
    content?: string;
    reaction?: 'up' | 'down' | null;
    bookmarked?: boolean;
    metadata?: unknown;
  }) => {
    return request<{ message: ChatMessage }>(`/api/messages`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  getBookmarks: async (limit = 50) => {
    return request<{
      messages: Array<ChatMessage & { conversation?: { id: string; title: string } }>;
    }>(`/api/messages/bookmarks?limit=${limit}`);
  },

  searchMessages: async (query: string, limit = 30) => {
    return request<{
      results: Array<{
        id: string;
        content: string;
        snippet: string;
        role: string;
        type: string;
        createdAt: string;
        conversationId: string;
        conversationTitle: string;
        bookmarked: boolean;
        reaction: string | null;
      }>;
      count: number;
      query: string;
    }>(`/api/search-messages?q=${encodeURIComponent(query)}&limit=${limit}`);
  },

  getReactions: async (type = '', limit = 50) => {
    return request<{
      results: Array<{
        id: string;
        content: string;
        role: string;
        type: string;
        reaction: string | null;
        createdAt: string;
        conversationId: string;
        conversationTitle: string;
        bookmarked: boolean;
      }>;
      count: number;
      positiveCount: number;
      negativeCount: number;
    }>(`/api/messages/reactions?type=${type}&limit=${limit}`);
  },

  // System prompts
  listSystemPrompts: async () => {
    return request<{
      prompts: Array<{
        id: string;
        title: string;
        content: string;
        isDefault: boolean;
        createdAt: string;
        updatedAt: string;
      }>;
    }>(`/api/system-prompts`);
  },

  createSystemPrompt: async (data: {
    title: string;
    content: string;
    isDefault?: boolean;
  }) => {
    return request<{
      prompt: {
        id: string;
        title: string;
        content: string;
        isDefault: boolean;
      };
    }>(`/api/system-prompts`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateSystemPrompt: async (
    id: string,
    data: { title?: string; content?: string; isDefault?: boolean }
  ) => {
    return request<{
      prompt: {
        id: string;
        title: string;
        content: string;
        isDefault: boolean;
      };
    }>(`/api/system-prompts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  deleteSystemPrompt: async (id: string) => {
    return request<{ success: boolean }>(`/api/system-prompts/${id}`, {
      method: 'DELETE',
    });
  },

  // Stats
  getStats: async () => {
    return request<{
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
    }>(`/api/stats`);
  },

  // Chat streaming
  streamChat: (
    data: {
      conversationId?: string;
      messages: Array<{ role: string; content: string }>;
      systemPrompt?: string;
      temperature?: number;
      enableSearch?: boolean;
      searchResults?: string;
    },
    callbacks: {
      onDelta: (content: string) => void;
      onDone: (fullResponse: string) => void;
      onError: (error: string) => void;
      onStart?: () => void;
    }
  ) => {
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          signal: controller.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Chat failed' }));
          callbacks.onError(err.error || `HTTP ${res.status}`);
          return;
        }

        const reader = res.body?.getReader();
        if (!reader) {
          callbacks.onError('No response body');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event: ChatStreamEvent = JSON.parse(line.slice(6));
                if (event.type === 'start' && callbacks.onStart) {
                  callbacks.onStart();
                } else if (event.type === 'delta' && event.content) {
                  callbacks.onDelta(event.content);
                } else if (event.type === 'done') {
                  callbacks.onDone(event.fullResponse || '');
                } else if (event.type === 'error') {
                  callbacks.onError(event.error || 'Unknown error');
                }
              } catch {
                // Ignore parse errors
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return;
        callbacks.onError(error instanceof Error ? error.message : 'Stream failed');
      }
    })();

    return () => controller.abort();
  },

  // Vision
  analyzeImage: async (data: {
    prompt: string;
    images: Array<{ url: string; name?: string }>;
    conversationHistory?: Array<{ role: string; content: string }>;
  }) => {
    return request<{
      success: boolean;
      analysis: string;
      imagesAnalyzed: number;
    }>('/api/vision', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // TTS
  tts: async (text: string, voice = 'tongtong', speed = 1.0) => {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice, speed }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'TTS failed' }));
      throw new Error(err.error || 'TTS failed');
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  },

  // ASR
  asr: async (audioBase64: string) => {
    return request<{ success: boolean; transcript: string }>('/api/asr', {
      method: 'POST',
      body: JSON.stringify({ audioBase64 }),
    });
  },

  // Image generation
  generateImage: async (data: {
    prompt: string;
    size?: string;
    conversationId?: string;
  }) => {
    return request<{
      success: boolean;
      imageId: string | undefined;
      imageUrl: string;
      prompt: string;
      size: string;
    }>('/api/image-gen', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Web search
  search: async (query: string, num = 8) => {
    return request<{
      success: boolean;
      query: string;
      results: SearchResult[];
      count: number;
    }>(`/api/search?q=${encodeURIComponent(query)}&num=${num}`);
  },

  // Templates
  listTemplates: async (category?: string) => {
    const params = category ? `?category=${category}` : '';
    return request<{ templates: PromptTemplate[] }>(`/api/templates${params}`);
  },

  createTemplate: async (data: {
    title: string;
    description: string;
    content: string;
    category?: string;
    icon?: string;
  }) => {
    return request<{ template: PromptTemplate }>(`/api/templates`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Settings
  getSettings: async () => {
    return request<{ settings: UserSettings }>(`/api/settings`);
  },

  updateSettings: async (data: Partial<UserSettings>) => {
    return request<{ settings: UserSettings }>(`/api/settings`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // Seed
  seed: async (force = false) => {
    return request<{ success: boolean; templatesCreated: number }>(
      '/api/seed',
      { method: 'POST', body: JSON.stringify({ force }) }
    );
  },
};
