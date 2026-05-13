import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import useThemeStore from '../store/useThemeStore';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="theme-toggle-group">
      <button 
        className={`theme-btn ${theme === 'light' ? 'active' : ''}`} 
        onClick={() => setTheme('light')}
        title="Light Mode"
      >
        <Sun size={18} />
      </button>
      <button 
        className={`theme-btn ${theme === 'dark' ? 'active' : ''}`} 
        onClick={() => setTheme('dark')}
        title="Dark Mode"
      >
        <Moon size={18} />
      </button>
      <button 
        className={`theme-btn ${theme === 'system' ? 'active' : ''}`} 
        onClick={() => setTheme('system')}
        title="System Default"
      >
        <Monitor size={18} />
      </button>
    </div>
  );
};

export default ThemeToggle;
