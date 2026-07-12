'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * UI preference store (Zustand + localStorage). Holds OR touchscreen mode and
 * the default monitoring sampling interval. Auth/session lives in Supabase;
 * server data lives in React Query — this store is only for UI state.
 */
interface UiState {
  touchMode: boolean;
  samplingIntervalMin: 1 | 3 | 5 | 10 | 15;
  toggleTouchMode: () => void;
  setSamplingInterval: (m: UiState['samplingIntervalMin']) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      touchMode: false,
      samplingIntervalMin: 5,
      toggleTouchMode: () => set((s) => ({ touchMode: !s.touchMode })),
      setSamplingInterval: (m) => set({ samplingIntervalMin: m }),
    }),
    { name: 'perfusio-ui' },
  ),
);
