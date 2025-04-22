import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check for saved theme preference or system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      return savedTheme as Theme;
    }
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  // Detectar cambios en las preferencias del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Solo cambiar automáticamente si el usuario no ha establecido una preferencia
      if (!localStorage.getItem('theme')) {
        setThemeState(e.matches ? 'dark' : 'light');
      }
    };
    
    // Adjuntar el listener para Firefox y otros navegadores
    try {
      mediaQuery.addEventListener('change', handleChange);
    } catch (err1) {
      try {
        // Método antiguo para compatibilidad con Safari
        mediaQuery.addListener(handleChange);
      } catch (err2) {
        console.error('No se pudo agregar un listener para cambios de tema del sistema', err2);
      }
    }
    
    return () => {
      try {
        mediaQuery.removeEventListener('change', handleChange);
      } catch (err1) {
        try {
          mediaQuery.removeListener(handleChange);
        } catch (err2) {
          console.error('No se pudo eliminar el listener de cambios de tema del sistema', err2);
        }
      }
    };
  }, []);

  useEffect(() => {
    // Save theme preference to localStorage
    localStorage.setItem('theme', theme);
    
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.style.colorScheme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.colorScheme = 'light';
    }

    // Actualizar el perfil del usuario en Supabase si está autenticado
    updateUserProfile(theme);
  }, [theme]);

  const updateUserProfile = async (currentTheme: Theme) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('profiles')
          .update({ 
            dark_mode: currentTheme === 'dark',
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id);
      }
    } catch (error) {
      // Silenciar errores para no interrumpir la experiencia del usuario
      console.warn('Error actualizando tema en perfil:', error);
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      isDarkMode: theme === 'dark',
      toggleTheme, 
      setTheme 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};