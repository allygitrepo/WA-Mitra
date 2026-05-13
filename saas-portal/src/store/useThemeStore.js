import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create()(
  persist(
    (set) => ({
      theme: 'system', // 'light', 'dark', 'system'
      
      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },
      
      initTheme: () => {
        const storedTheme = useThemeStore.getState().theme;
        applyTheme(storedTheme);
      }
    }),
    {
      name: 'wa-mitra-theme',
    }
  )
);

const applyTheme = (theme) => {
  const root = window.document.documentElement;
  
  let actualTheme = theme;
  if (theme === 'system') {
    actualTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  
  root.setAttribute('data-theme', actualTheme);
};

export default useThemeStore;
