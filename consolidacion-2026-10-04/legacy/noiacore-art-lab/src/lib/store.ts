// Noiacore — Store global con Zustand + persistencia local.
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ShaderId } from "./shaders";

export interface NoiaUser {
  id: string;
  handle: string;
  name: string;
  joinedAt: string;
}

export interface DraftObra {
  title: string;
  shader: ShaderId;
  hue: number;
  complexity: number;
  intensity: number;
  excerpt: string;
  tags: string[];
}

interface NoiaState {
  // auth
  user: NoiaUser | null;
  signIn: (handle: string, name: string) => void;
  signOut: () => void;
  // ui
  authOpen: boolean;
  setAuthOpen: (v: boolean) => void;
  viewerObraId: string | null;
  setViewerObraId: (id: string | null) => void;
  activeShader: ShaderId;
  setActiveShader: (s: ShaderId) => void;
  animationsEnabled: boolean;
  toggleAnimations: () => void;
  // collections
  liked: string[];
  collected: string[];
  toggleLike: (id: string) => void;
  toggleCollect: (id: string) => void;
  isLiked: (id: string) => boolean;
  isCollected: (id: string) => boolean;
  // draft for publish
  draft: DraftObra;
  setDraft: (p: Partial<DraftObra>) => void;
  publishedIds: string[];
  markPublished: (id: string) => void;
  // notifications
  notifications: NoiaNotification[];
  pushNotification: (n: Omit<NoiaNotification, "id" | "at">) => void;
  dismissNotification: (id: string) => void;
  // audio (Enjambre Sónico)
  audioEnabled: boolean;
  audioBands: { bass: number; mid: number; high: number; level: number };
  setAudioEnabled: (v: boolean) => void;
  setAudioBands: (b: { bass: number; mid: number; high: number; level: number }) => void;
  audioReactive: boolean;
  toggleAudioReactive: () => void;
  // comments
  commentsOpen: boolean;
  commentsObraId: string | null;
  setCommentsOpen: (v: boolean) => void;
  setCommentsObraId: (id: string | null) => void;
  openComments: (id: string) => void;
  // onboarding tour
  tourActive: boolean;
  tourStep: number;
  setTourActive: (v: boolean) => void;
  setTourStep: (n: number) => void;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: () => void;
  // presentation mode
  presentationMode: boolean;
  togglePresentationMode: () => void;
  // command palette
  paletteOpen: boolean;
  setPaletteOpen: (v: boolean) => void;
  // follow creators
  following: string[];
  toggleFollow: (handle: string) => void;
  isFollowing: (handle: string) => boolean;
  // activity log
  activity: ActivityEntry[];
  logActivity: (a: Omit<ActivityEntry, "id" | "at">) => void;
  clearActivity: () => void;
}

export interface ActivityEntry {
  id: string;
  at: string;
  kind: "like" | "collect" | "publish" | "follow" | "comment" | "remix";
  target: string;
}

export interface NoiaNotification {
  id: string;
  at: string;
  title: string;
  body: string;
  tone: "teal" | "magenta" | "amber" | "red";
}

const DEFAULT_DRAFT: DraftObra = {
  title: "",
  shader: "silk",
  hue: 0.5,
  complexity: 0.55,
  intensity: 0.4,
  excerpt: "",
  tags: [],
};

export const useNoiaStore = create<NoiaState>()(
  persist(
    (set, get) => ({
      user: null,
      signIn: (handle, name) =>
        set({
          user: {
            id: "u_" + Math.random().toString(36).slice(2, 10),
            handle,
            name,
            joinedAt: new Date().toISOString(),
          },
          authOpen: false,
        }),
      signOut: () => set({ user: null, liked: [], collected: [] }),
      authOpen: false,
      setAuthOpen: (v) => set({ authOpen: v }),
      viewerObraId: null,
      setViewerObraId: (id) => set({ viewerObraId: id }),
      activeShader: "silk",
      setActiveShader: (s) => set({ activeShader: s }),
      animationsEnabled: true,
      toggleAnimations: () =>
        set((st) => ({ animationsEnabled: !st.animationsEnabled })),
      liked: [],
      collected: [],
      toggleLike: (id) =>
        set((st) => ({
          liked: st.liked.includes(id)
            ? st.liked.filter((x) => x !== id)
            : [...st.liked, id],
        })),
      toggleCollect: (id) =>
        set((st) => ({
          collected: st.collected.includes(id)
            ? st.collected.filter((x) => x !== id)
            : [...st.collected, id],
        })),
      isLiked: (id) => get().liked.includes(id),
      isCollected: (id) => get().collected.includes(id),
      draft: { ...DEFAULT_DRAFT },
      setDraft: (p) => set((st) => ({ draft: { ...st.draft, ...p } })),
      publishedIds: [],
      markPublished: (id) =>
        set((st) =>
          st.publishedIds.includes(id)
            ? st
            : { publishedIds: [...st.publishedIds, id] }
        ),
      notifications: [],
      pushNotification: (n) =>
        set((st) => ({
          notifications: [
            {
              ...n,
              id: "n_" + Math.random().toString(36).slice(2, 9),
              at: new Date().toISOString(),
            },
            ...st.notifications,
          ].slice(0, 8),
        })),
      dismissNotification: (id) =>
        set((st) => ({
          notifications: st.notifications.filter((n) => n.id !== id),
        })),
      audioEnabled: false,
      audioBands: { bass: 0, mid: 0, high: 0, level: 0 },
      setAudioEnabled: (v) => set({ audioEnabled: v }),
      setAudioBands: (b) => set({ audioBands: b }),
      audioReactive: false,
      toggleAudioReactive: () =>
        set((st) => ({ audioReactive: !st.audioReactive })),
      commentsOpen: false,
      commentsObraId: null,
      setCommentsOpen: (v) => set({ commentsOpen: v }),
      setCommentsObraId: (id) => set({ commentsObraId: id }),
      openComments: (id) =>
        set({ commentsObraId: id, commentsOpen: true }),
      tourActive: false,
      tourStep: 0,
      setTourActive: (v) => set({ tourActive: v }),
      setTourStep: (n) => set({ tourStep: n }),
      startTour: () => set({ tourActive: true, tourStep: 0 }),
      nextTourStep: () => set((st) => ({ tourStep: st.tourStep + 1 })),
      prevTourStep: () => set((st) => ({ tourStep: Math.max(0, st.tourStep - 1) })),
      endTour: () => set({ tourActive: false, tourStep: 0 }),
      presentationMode: false,
      togglePresentationMode: () =>
        set((st) => ({ presentationMode: !st.presentationMode })),
      paletteOpen: false,
      setPaletteOpen: (v) => set({ paletteOpen: v }),
      following: [],
      toggleFollow: (handle) =>
        set((st) => {
          const wasFollowing = st.following.includes(handle);
          return {
            following: wasFollowing
              ? st.following.filter((h) => h !== handle)
              : [...st.following, handle],
            activity: wasFollowing
              ? st.activity
              : [
                  {
                    id: "a_" + Math.random().toString(36).slice(2, 9),
                    at: new Date().toISOString(),
                    kind: "follow" as const,
                    target: handle,
                  },
                  ...st.activity,
                ].slice(0, 30),
          };
        }),
      isFollowing: (handle) => get().following.includes(handle),
      activity: [],
      logActivity: (a) =>
        set((st) => ({
          activity: [
            {
              ...a,
              id: "a_" + Math.random().toString(36).slice(2, 9),
              at: new Date().toISOString(),
            },
            ...st.activity,
          ].slice(0, 30),
        })),
      clearActivity: () => set({ activity: [] }),
    }),
    {
      name: "noiacore-store",
      partialize: (s) => ({
        user: s.user,
        liked: s.liked,
        collected: s.collected,
        publishedIds: s.publishedIds,
        draft: s.draft,
        animationsEnabled: s.animationsEnabled,
        following: s.following,
        activity: s.activity,
      }),
    }
  )
);
