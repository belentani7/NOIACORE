export type MessageRole = 'user' | 'assistant' | 'system';

export type MessageType =
  | 'text'
  | 'image'
  | 'audio'
  | 'search'
  | 'image-gen'
  | 'vision';

export interface ChatMessage {
  id?: string;
  conversationId?: string;
  role: MessageRole;
  content: string;
  type: MessageType;
  metadata?: MessageMetadata;
  reaction?: 'up' | 'down' | null;
  bookmarked?: boolean;
  createdAt?: string;
  tokens?: number;
}

export interface MessageMetadata {
  images?: Array<{ url: string; name?: string }>;
  audio?: { url: string; duration?: number };
  searchResults?: SearchResult[];
  generatedImage?: { url: string; prompt: string; size: string };
  voiceTranscript?: string;
}

export interface Conversation {
  id: string;
  title: string;
  systemPrompt: string | null;
  pinned: boolean;
  archived: boolean;
  model: string;
  temperature: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
  _count?: { messages: number };
}

export interface ConversationTag {
  name: string;
  color: string;
}

export interface SearchResult {
  url: string;
  title: string;
  snippet: string;
  domain: string;
  date: string;
}

export interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserSettings {
  id: string;
  theme: 'light' | 'dark' | 'system';
  defaultModel: string;
  temperature: number;
  systemPrompt: string;
  ttsVoice: string;
  ttsSpeed: number;
  ttsEnabled: boolean;
  streamingEnabled: boolean;
  maxHistoryMessages: number;
}

export interface ChatStreamEvent {
  type: 'start' | 'delta' | 'done' | 'error';
  content?: string;
  fullResponse?: string;
  error?: string;
  timestamp?: number;
}
