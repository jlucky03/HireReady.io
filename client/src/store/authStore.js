import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  firebaseUser: null,
  loading: true,

  setUser: (user) => set({ user }),
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setLoading: (loading) => set({ loading }),

  logoutStore: () =>
    set({
      user: null,
      firebaseUser: null,
      loading: false,
    }),
}));