import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { loginApi, logoutApi, getMeApi } from '../api/auth.api';

const useAuthStore = create(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        login: async (email, password) => {
          set({ isLoading: true, error: null });
          try {
            const { data } = await loginApi({ email, password });
            set({
              user: data.user,
              token: data.token,
              isAuthenticated: true,
              isLoading: false,
            });
            return { success: true, user: data.user };
          } catch (err) {
            const message = err.response?.data?.message || 'Login failed';
            set({ isLoading: false, error: message });
            return { success: false, message };
          }
        },

        logout: async () => {
          try {
            await logoutApi();
          } finally {
            set({ user: null, token: null, isAuthenticated: false, error: null });
          }
        },

        fetchMe: async () => {
          if (!get().token) return;
          set({ isLoading: true });
          try {
            const { data } = await getMeApi();
            set({ user: data.user, isLoading: false });
          } catch {
            set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          }
        },

        clearError: () => set({ error: null }),

        hasPermission: (permission) => {
          const { user } = get();
          return user?.permissions?.includes(permission) ?? false;
        },

        hasMinRole: (minRole) => {
          const hierarchy = { super_admin: 3, admin: 2, tech_rep: 1 };
          const { user } = get();
          if (!user) return false;
          return (hierarchy[user.role] ?? 0) >= (hierarchy[minRole] ?? 0);
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          user: state.user,
          token: state.token,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: 'AuthStore' }
  )
);

export default useAuthStore;
