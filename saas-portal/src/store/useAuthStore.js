import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      
      setAuth: (user, token, refreshToken) => set((state) => ({ 
        user, 
        token, 
        refreshToken: refreshToken !== undefined ? refreshToken : state.refreshToken, 
        isAuthenticated: !!token 
      })),
      
      logout: () => set({ user: null, token: null, refreshToken: null, isAuthenticated: false }),
      
      updateUser: (userData) => set((state) => ({ 
        user: { ...state.user, ...userData } 
      })),
    }),
    {
      name: 'wa-mitra-auth',
    }
  )
);

export default useAuthStore;
