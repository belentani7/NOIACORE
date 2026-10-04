'use client';

import { create } from 'zustand';
import type {
  Conversation,
  ChatMessage,
  PromptTemplate,
  UserSettings,
  SearchResult,
} from '@/types';
import { api } from '@/lib/api';

interface ChatState {
  // Conversations
  conversations: Conversation[];
  currentConversationId: string | null;
  messages: ChatMessage[];
  loadingConversations: boolean;
  loadingMessages: boolean;

  // Streaming
  isStreaming: boolean;
  streamingMessageId: string | null;
  streamingContent: string;
  abortStream: (() => void) | null;

  // Templates
  templates: PromptTemplate[];
  loadingTemplates: boolean;

  // Settings
  settings: UserSettings | null;

  // UI State
  sidebarOpen: boolean;
  settingsOpen: boolean;
  templatesOpen: boolean;
  searchQuery: string;

  // Multi-modal input state
  attachedImages: Array<{ url: string; name?: string }>;
  enableWebSearch: boolean;
  imageGenMode: boolean;

  // Actions
  loadConversations: () => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  createConversation: () => Promise<string | null>;
  selectConversation: (id: string | null) => void;
  deleteConversation: (id: string) => Promise<void>;
  togglePinConversation: (id: string) => Promise<void>;
  archiveConversation: (id: string) => Promise<void>;
  duplicateConversation: (id: string) => Promise<string | null>;
  setSearchQuery: (q: string) => void;
  activeTag: string;
  setActiveTag: (tag: string) => void;
  addTagToConversation: (id: string, tag: string) => Promise<void>;
  removeTagFromConversation: (id: string, tag: string) => Promise<void>;
  allTags: () => string[];

  sendMessage: (content: string) => Promise<void>;
  stopStreaming: () => void;
  regenerateLastMessage: () => Promise<void>;
  editMessage: (messageId: string, newContent: string) => Promise<void>;
  setMessageReaction: (messageId: string, reaction: 'up' | 'down' | null) => Promise<void>;
  toggleBookmark: (messageId: string) => Promise<void>;

  loadTemplates: () => Promise<void>;
  loadSettings: () => Promise<void>;
  updateSettings: (data: Partial<UserSettings>) => Promise<void>;

  setSidebarOpen: (open: boolean) => void;
  setSettingsOpen: (open: boolean) => void;
  setTemplatesOpen: (open: boolean) => void;
  shortcutsOpen: boolean;
  setShortcutsOpen: (open: boolean) => void;
  bookmarksOpen: boolean;
  setBookmarksOpen: (open: boolean) => void;
  searchMessagesOpen: boolean;
  setSearchMessagesOpen: (open: boolean) => void;
  reactionsOpen: boolean;
  setReactionsOpen: (open: boolean) => void;
  systemPromptsOpen: boolean;
  setSystemPromptsOpen: (open: boolean) => void;
  statsOpen: boolean;
  setStatsOpen: (open: boolean) => void;
  privacyOpen: boolean;
  setPrivacyOpen: (open: boolean) => void;
  legalOpen: boolean;
  setLegalOpen: (open: boolean) => void;

  addAttachedImage: (img: { url: string; name?: string }) => void;
  removeAttachedImage: (index: number) => void;
  clearAttachedImages: () => void;
  setEnableWebSearch: (enabled: boolean) => void;
  setImageGenMode: (enabled: boolean) => void;

  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  loadingConversations: false,
  loadingMessages: false,

  isStreaming: false,
  streamingMessageId: null,
  streamingContent: '',
  abortStream: null,

  templates: [],
  loadingTemplates: false,

  settings: null,

  sidebarOpen: true,
  settingsOpen: false,
  templatesOpen: false,
  shortcutsOpen: false,
  bookmarksOpen: false,
  searchMessagesOpen: false,
  reactionsOpen: false,
  systemPromptsOpen: false,
  statsOpen: false,
  privacyOpen: false,
  legalOpen: false,
  searchQuery: '',
  activeTag: '',

  attachedImages: [],
  enableWebSearch: false,
  imageGenMode: false,

  loadConversations: async () => {
    set({ loadingConversations: true });
    try {
      const { conversations } = await api.listConversations(
        get().searchQuery,
        false,
        get().activeTag
      );
      set({ conversations, loadingConversations: false });
    } catch (error) {
      console.error('loadConversations error:', error);
      set({ loadingConversations: false });
    }
  },

  loadConversation: async (id) => {
    set({ loadingMessages: true, currentConversationId: id });
    try {
      const { conversation } = await api.getConversation(id);
      set({
        messages: conversation.messages || [],
        loadingMessages: false,
      });
    } catch (error) {
      console.error('loadConversation error:', error);
      set({ loadingMessages: false, messages: [] });
    }
  },

  createConversation: async () => {
    try {
      const { conversation } = await api.createConversation();
      set((state) => ({
        conversations: [conversation, ...state.conversations],
        currentConversationId: conversation.id,
        messages: [],
      }));
      return conversation.id;
    } catch (error) {
      console.error('createConversation error:', error);
      return null;
    }
  },

  selectConversation: (id) => {
    set({ currentConversationId: id, messages: [] });
    if (id) {
      get().loadConversation(id);
    }
  },

  deleteConversation: async (id) => {
    try {
      await api.deleteConversation(id);
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        currentConversationId:
          state.currentConversationId === id ? null : state.currentConversationId,
        messages: state.currentConversationId === id ? [] : state.messages,
      }));
    } catch (error) {
      console.error('deleteConversation error:', error);
    }
  },

  togglePinConversation: async (id) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;
    try {
      await api.updateConversation(id, { pinned: !conv.pinned });
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, pinned: !c.pinned } : c
        ),
      }));
      get().loadConversations();
    } catch (error) {
      console.error('togglePinConversation error:', error);
    }
  },

  archiveConversation: async (id) => {
    try {
      await api.updateConversation(id, { archived: true });
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        currentConversationId:
          state.currentConversationId === id ? null : state.currentConversationId,
        messages: state.currentConversationId === id ? [] : state.messages,
      }));
    } catch (error) {
      console.error('archiveConversation error:', error);
    }
  },

  duplicateConversation: async (id) => {
    try {
      // Fetch the original conversation with messages
      const { conversation: original } = await api.getConversation(id);
      // Create a new conversation
      const { conversation: copy } = await api.createConversation({
        title: `${original.title} (copy)`,
        systemPrompt: original.systemPrompt || undefined,
        model: original.model,
        temperature: original.temperature,
        tags: original.tags || [],
      });
      // Copy all messages
      if (original.messages) {
        for (const msg of original.messages) {
          await api.createMessage({
            conversationId: copy.id,
            role: msg.role,
            content: msg.content,
            type: msg.type,
            metadata: msg.metadata,
          });
        }
      }
      // Refresh list
      await get().loadConversations();
      return copy.id;
    } catch (error) {
      console.error('duplicateConversation error:', error);
      return null;
    }
  },

  setSearchQuery: (q) => {
    set({ searchQuery: q });
    get().loadConversations();
  },

  setActiveTag: (tag) => {
    set({ activeTag: tag });
    get().loadConversations();
  },

  addTagToConversation: async (id, tag) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;
    const currentTags = conv.tags || [];
    if (currentTags.includes(tag)) return;
    const newTags = [...currentTags, tag];
    // Optimistic update
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, tags: newTags } : c
      ),
    }));
    try {
      await api.updateConversation(id, { tags: newTags });
    } catch (error) {
      console.error('Add tag error:', error);
      // Revert
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, tags: currentTags } : c
        ),
      }));
    }
  },

  removeTagFromConversation: async (id, tag) => {
    const conv = get().conversations.find((c) => c.id === id);
    if (!conv) return;
    const currentTags = conv.tags || [];
    const newTags = currentTags.filter((t) => t !== tag);
    // Optimistic update
    set((state) => ({
      conversations: state.conversations.map((c) =>
        c.id === id ? { ...c, tags: newTags } : c
      ),
    }));
    try {
      await api.updateConversation(id, { tags: newTags });
    } catch (error) {
      console.error('Remove tag error:', error);
      set((state) => ({
        conversations: state.conversations.map((c) =>
          c.id === id ? { ...c, tags: currentTags } : c
        ),
      }));
    }
  },

  allTags: () => {
    const tagSet = new Set<string>();
    get().conversations.forEach((c) => {
      (c.tags || []).forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet);
  },

  sendMessage: async (content) => {
    if (!content.trim() && get().attachedImages.length === 0) return;

    let conversationId = get().currentConversationId;
    const settings = get().settings;

    // Create conversation if none selected
    if (!conversationId) {
      conversationId = await get().createConversation();
      if (!conversationId) return;
    }

    const userMetadata = get().attachedImages.length > 0
      ? { images: get().attachedImages }
      : undefined;

    const userMessage: ChatMessage = {
      role: 'user',
      content: content.trim(),
      type: get().attachedImages.length > 0 ? 'vision' : 'text',
      metadata: userMetadata,
      createdAt: new Date().toISOString(),
    };

    // Optimistically add user message
    set((state) => ({ messages: [...state.messages, userMessage] }));

    // Save user message to DB
    try {
      const { message: saved } = await api.createMessage({
        conversationId: conversationId,
        role: 'user',
        content: content.trim(),
        type: userMessage.type,
        metadata: userMetadata,
      });
      // Update the message id
      set((state) => ({
        messages: state.messages.map((m, i) =>
          i === state.messages.length - 1 ? { ...m, id: saved.id } : m
        ),
      }));
    } catch (error) {
      console.error('Save user message error:', error);
    }

    // Clear inputs
    const attachedImages = [...get().attachedImages];
    get().clearAttachedImages();

    // Generate title if it's the first message
    const messageCount = get().messages.length;
    if (messageCount === 1) {
      api.generateTitle(conversationId).then(({ title }) => {
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === conversationId ? { ...c, title } : c
          ),
        }));
      });
    }

    // Determine response type
    const imageGenMode = get().imageGenMode;
    const hasImages = attachedImages.length > 0;
    const enableSearch = get().enableWebSearch;

    if (imageGenMode) {
      await handleImageGeneration(conversationId, content.trim(), set, get);
      return;
    }

    if (hasImages) {
      await handleVisionAnalysis(conversationId, content.trim(), attachedImages, set, get);
      return;
    }

    // Standard chat
    let searchResultsText: string | undefined;
    if (enableSearch) {
      // First do a web search
      try {
        const searchRes = await api.search(content.trim(), 6);
        searchResultsText = searchRes.results
          .map(
            (r) =>
              `**${r.title}** (${r.domain})\n${r.snippet}\nURL: ${r.url}`
          )
          .join('\n\n---\n\n');

        // Add a search results message
        const searchMessage: ChatMessage = {
          role: 'assistant',
          content: `🔍 Found ${searchRes.results.length} web results for "${content.trim()}"`,
          type: 'search',
          metadata: { searchResults: searchRes.results },
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ messages: [...state.messages, searchMessage] }));
        await api.createMessage({
          conversationId,
          role: 'assistant',
          content: searchMessage.content,
          type: 'search',
          metadata: { searchResults: searchRes.results },
        });
      } catch (error) {
        console.error('Web search error:', error);
      }
    }

    // Build message history for the LLM
    const historyMessages = get()
      .messages.filter((m) => m.type === 'text' || m.type === 'search')
      .slice(-(settings?.maxHistoryMessages || 20))
      .map((m) => ({ role: m.role, content: m.content }));

    // Add placeholder for assistant response
    const assistantMessageId = `streaming-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      type: 'text',
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, assistantMessage],
      isStreaming: true,
      streamingMessageId: assistantMessageId,
      streamingContent: '',
    }));

    let fullResponse = '';

    const abort = api.streamChat(
      {
        conversationId,
        messages: historyMessages,
        systemPrompt: settings?.systemPrompt,
        temperature: settings?.temperature,
        enableSearch,
        searchResults: searchResultsText,
      },
      {
        onStart: () => {},
        onDelta: (delta) => {
          fullResponse += delta;
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: fullResponse }
                : m
            ),
            streamingContent: fullResponse,
          }));
        },
        onDone: async (finalResponse) => {
          // Use locally accumulated fullResponse as fallback if API's finalResponse is empty
          const contentToSave = finalResponse || fullResponse;
          set({
            isStreaming: false,
            streamingMessageId: null,
            streamingContent: '',
          });
          // Ensure the final content is displayed
          if (contentToSave && contentToSave !== fullResponse) {
            set((state) => ({
              messages: state.messages.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: contentToSave }
                  : m
              ),
            }));
          }
          // Save to DB
          if (contentToSave) {
            try {
              await api.createMessage({
                conversationId,
                role: 'assistant',
                content: contentToSave,
                type: 'text',
              });
            } catch (error) {
              console.error('Save assistant message error:', error);
            }
          }
          // Update conversations list (for last message preview)
          get().loadConversations();
        },
        onError: (error) => {
          console.error('Stream error:', error);
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: fullResponse || `⚠️ Error: ${error}`,
                  }
                : m
            ),
            isStreaming: false,
            streamingMessageId: null,
            streamingContent: '',
          }));
        },
      }
    );

    set({ abortStream: abort });
  },

  stopStreaming: () => {
    const abort = get().abortStream;
    if (abort) abort();
    set({
      isStreaming: false,
      streamingMessageId: null,
      streamingContent: '',
      abortStream: null,
    });
  },

  regenerateLastMessage: async () => {
    const messages = get().messages;
    // Find last user message
    const lastUserIdx = [...messages].reverse().findIndex((m) => m.role === 'user');
    if (lastUserIdx === -1) return;

    const lastUserMessage = messages[messages.length - 1 - lastUserIdx];
    // Remove all messages after the last user message
    set({
      messages: messages.slice(0, messages.length - lastUserIdx),
    });
    // Resend
    await get().sendMessage(lastUserMessage.content);
  },

  editMessage: async (messageId, newContent) => {
    const messages = get().messages;
    const msgIdx = messages.findIndex((m) => m.id === messageId);
    if (msgIdx === -1) return;

    const msg = messages[msgIdx];
    if (msg.role !== 'user') return;

    // Update the message content locally
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, content: newContent } : m
      ),
    }));

    // Remove all messages after the edited message
    set((state) => ({
      messages: state.messages.slice(0, msgIdx + 1),
    }));

    // Resend (this will create a new user message, so we need to handle it differently)
    // Instead of calling sendMessage (which creates a new message), we directly trigger the chat
    const conversationId = get().currentConversationId;
    if (!conversationId) return;

    const settings = get().settings;

    // Build message history
    const historyMessages = get()
      .messages.filter((m) => m.type === 'text' || m.type === 'search')
      .slice(-(settings?.maxHistoryMessages || 20))
      .map((m) => ({ role: m.role, content: m.content }));

    // Add placeholder for assistant response
    const assistantMessageId = `streaming-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      type: 'text',
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, assistantMessage],
      isStreaming: true,
      streamingMessageId: assistantMessageId,
      streamingContent: '',
    }));

    let fullResponse = '';

    const abort = api.streamChat(
      {
        conversationId,
        messages: historyMessages,
        systemPrompt: settings?.systemPrompt,
        temperature: settings?.temperature,
      },
      {
        onStart: () => {},
        onDelta: (delta) => {
          fullResponse += delta;
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: fullResponse }
                : m
            ),
            streamingContent: fullResponse,
          }));
        },
        onDone: async (finalResponse) => {
          const contentToSave = finalResponse || fullResponse;
          set({
            isStreaming: false,
            streamingMessageId: null,
            streamingContent: '',
          });
          if (contentToSave) {
            try {
              await api.createMessage({
                conversationId,
                role: 'assistant',
                content: contentToSave,
                type: 'text',
              });
            } catch (error) {
              console.error('Save assistant message error:', error);
            }
          }
          get().loadConversations();
        },
        onError: (error) => {
          console.error('Stream error:', error);
          set((state) => ({
            messages: state.messages.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: fullResponse || `⚠️ Error: ${error}` }
                : m
            ),
            isStreaming: false,
            streamingMessageId: null,
            streamingContent: '',
          }));
        },
      }
    );

    set({ abortStream: abort });
  },

  setMessageReaction: async (messageId, reaction) => {
    // Optimistically update locally
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId
          ? { ...m, reaction: m.reaction === reaction ? null : reaction }
          : m
      ),
    }));

    // Persist to DB
    try {
      const current = get().messages.find((m) => m.id === messageId);
      await api.updateMessage({
        id: messageId,
        reaction: current?.reaction ?? null,
      });
    } catch (error) {
      console.error('Set reaction error:', error);
      // Revert on error
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, reaction: null } : m
        ),
      }));
    }
  },

  toggleBookmark: async (messageId) => {
    const msg = get().messages.find((m) => m.id === messageId);
    if (!msg) return;
    const newValue = !msg.bookmarked;

    // Optimistic update
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, bookmarked: newValue } : m
      ),
    }));

    // Persist to DB
    try {
      await api.updateMessage({
        id: messageId,
        bookmarked: newValue,
      });
    } catch (error) {
      console.error('Toggle bookmark error:', error);
      // Revert on error
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === messageId ? { ...m, bookmarked: !newValue } : m
        ),
      }));
    }
  },

  loadTemplates: async () => {
    set({ loadingTemplates: true });
    try {
      const { templates } = await api.listTemplates();
      set({ templates, loadingTemplates: false });
    } catch (error) {
      console.error('loadTemplates error:', error);
      set({ loadingTemplates: false });
    }
  },

  loadSettings: async () => {
    try {
      const { settings } = await api.getSettings();
      set({ settings });
    } catch (error) {
      console.error('loadSettings error:', error);
    }
  },

  updateSettings: async (data) => {
    try {
      const { settings } = await api.updateSettings(data);
      set({ settings });
    } catch (error) {
      console.error('updateSettings error:', error);
    }
  },

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setTemplatesOpen: (open) => set({ templatesOpen: open }),
  setShortcutsOpen: (open) => set({ shortcutsOpen: open }),
  setBookmarksOpen: (open) => set({ bookmarksOpen: open }),
  setSearchMessagesOpen: (open) => set({ searchMessagesOpen: open }),
  setReactionsOpen: (open) => set({ reactionsOpen: open }),
  setSystemPromptsOpen: (open) => set({ systemPromptsOpen: open }),
  setStatsOpen: (open) => set({ statsOpen: open }),
  setPrivacyOpen: (open) => set({ privacyOpen: open }),
  setLegalOpen: (open) => set({ legalOpen: open }),

  addAttachedImage: (img) =>
    set((state) => ({ attachedImages: [...state.attachedImages, img] })),
  removeAttachedImage: (index) =>
    set((state) => ({
      attachedImages: state.attachedImages.filter((_, i) => i !== index),
    })),
  clearAttachedImages: () => set({ attachedImages: [] }),
  setEnableWebSearch: (enabled) => set({ enableWebSearch: enabled }),
  setImageGenMode: (enabled) => set({ imageGenMode: enabled }),

  clearMessages: () => set({ messages: [] }),
}));

// Helper: handle image generation flow
async function handleImageGeneration(
  conversationId: string,
  prompt: string,
  set: (fn: (state: ChatState) => Partial<ChatState>) => void,
  get: () => ChatState
) {
  const placeholderId = `img-gen-${Date.now()}`;
  const placeholderMessage: ChatMessage = {
    id: placeholderId,
    role: 'assistant',
    content: `🎨 Generating image: "${prompt}"...`,
    type: 'image-gen',
    createdAt: new Date().toISOString(),
  };
  set((state) => ({ messages: [...state.messages, placeholderMessage], isStreaming: true }));

  try {
    const result = await api.generateImage({
      prompt,
      size: '1024x1024',
      conversationId,
    });

    const finalMessage: ChatMessage = {
      id: placeholderId,
      role: 'assistant',
      content: `🎨 Generated image for: "${prompt}"`,
      type: 'image-gen',
      metadata: {
        generatedImage: {
          url: result.imageUrl,
          prompt: result.prompt,
          size: result.size,
        },
      },
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === placeholderId ? finalMessage : m
      ),
      isStreaming: false,
    }));

    // Save to DB
    await api.createMessage({
      conversationId,
      role: 'assistant',
      content: finalMessage.content,
      type: 'image-gen',
      metadata: finalMessage.metadata,
    });

    // Reset image gen mode
    get().setImageGenMode(false);
    get().loadConversations();
  } catch (error) {
    console.error('Image generation error:', error);
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === placeholderId
          ? {
              ...m,
              content: `⚠️ Image generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }
          : m
      ),
      isStreaming: false,
    }));
    get().setImageGenMode(false);
  }
}

// Helper: handle vision analysis flow
async function handleVisionAnalysis(
  conversationId: string,
  prompt: string,
  images: Array<{ url: string; name?: string }>,
  set: (fn: (state: ChatState) => Partial<ChatState>) => void,
  get: () => ChatState
) {
  const placeholderId = `vision-${Date.now()}`;
  const placeholderMessage: ChatMessage = {
    id: placeholderId,
    role: 'assistant',
    content: '👁️ Analyzing image(s)...',
    type: 'vision',
    createdAt: new Date().toISOString(),
  };
  set((state) => ({ messages: [...state.messages, placeholderMessage], isStreaming: true }));

  try {
    // Build conversation history (text only)
    const history = get()
      .messages.filter((m) => m.type === 'text' && m.id !== placeholderId)
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }));

    const result = await api.analyzeImage({
      prompt: prompt || 'Describe this image in detail.',
      images,
      conversationHistory: history,
    });

    const finalMessage: ChatMessage = {
      id: placeholderId,
      role: 'assistant',
      content: result.analysis,
      type: 'vision',
      metadata: { images },
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === placeholderId ? finalMessage : m
      ),
      isStreaming: false,
    }));

    await api.createMessage({
      conversationId,
      role: 'assistant',
      content: result.analysis,
      type: 'vision',
      metadata: { images },
    });

    get().loadConversations();
  } catch (error) {
    console.error('Vision analysis error:', error);
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === placeholderId
          ? {
              ...m,
              content: `⚠️ Vision analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            }
          : m
      ),
      isStreaming: false,
    }));
  }
}
