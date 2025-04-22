import React, { ReactNode } from 'react';
import { useTheme } from '../context/ThemeContext';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen transition-theme ${theme === 'dark' ? 'dark' : ''}`}>
      {children}
    </div>
  );
};

export default Layout;