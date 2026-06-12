import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  firebaseUser: null,
  loading: true,

  setUser: (user) => set({ user }),
  setFirebaseUser: (firebaseUser) => set({ firebaseUser }),
  setLoading: (loading) => set({ loading }),

  fetchMe: async (token) => {
    const res = await fetch("http://localhost:5000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (res.ok) {
      set({ user: data.user });
    }

    return data.user;
  },

  logoutStore: () =>
    set({
      user: null,
      firebaseUser: null,
      loading: false,
    }),
}));