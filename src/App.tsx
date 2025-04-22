import React, { useEffect, useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Layout from './components/Layout';
import Sidebar from './components/Sidebar';
import NotesList from './components/NotesList';
import NoteEditor from './components/NoteEditor';
import Auth from './components/Auth';
import TestSupabase from './components/TestSupabase';
import ProfileSettings from './components/ProfileSettings';
import MindMap from './components/MindMap';
import { FileType } from './types';
import { supabase } from './lib/supabase';
import { Toaster } from 'react-hot-toast';
import { Session } from '@supabase/supabase-js';
import { Book, Home, Settings, Plus, Network, List, Grid, LogOut, Menu } from 'lucide-react';
import './App.css';
import './styles/notion-style.css';
import './styles/mobile.css';

// Default test credentials
const TEST_EMAIL = "m2do.nefo.55@gmail.com";

// View types
type ViewMode = 'list' | 'edit' | 'mindmap';

// Wrapper component to use language context
const AppContent = () => {
  const { t, language } = useLanguage();
  const [selectedFile, setSelectedFile] = useState<FileType | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [bypassAuth, setBypassAuth] = useState(true);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    // Browser detection and appropriate actions
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isAndroid = /android/i.test(navigator.userAgent);
    
    if (isFirefox) {
      document.documentElement.classList.add('firefox');
      console.log('Firefox browser detected - adding specialized styles');
    }
    
    if (isIOS) {
      document.documentElement.classList.add('ios');
    }
    
    if (isAndroid) {
      document.documentElement.classList.add('android');
    }
    
    // Screen size detection
    const checkScreenSize = () => {
      const isMobileSize = window.innerWidth <= 768;
      setIsMobile(isMobileSize);
      document.documentElement.classList.toggle('mobile', isMobileSize);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    // Mobile keyboard detection
    if (isMobile) {
      const visualViewport = window.visualViewport;
      if (visualViewport) {
        const handleResize = () => {
          // When keyboard is open, viewport height is much smaller than window height
          const keyboardOpen = visualViewport.height < window.innerHeight * 0.8;
          setIsKeyboardOpen(keyboardOpen);
          document.body.classList.toggle('has-keyboard', keyboardOpen);
        };
        
        visualViewport.addEventListener('resize', handleResize);
        return () => {
          visualViewport.removeEventListener('resize', handleResize);
          document.body.classList.remove('has-keyboard');
        };
      }
    }
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, [isMobile]);

  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth <= 768;
      setIsMobile(isMobileView);
      if (isMobileView) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleFileSelect = (file: FileType) => {
    setSelectedFile(file);
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const handleCreateNote = () => {
    setSelectedNoteId(null);
    setViewMode('edit');
  };

  const handleEditNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setViewMode('edit');
  };

  const handleBackToNotes = () => {
    setViewMode('list');
    setSelectedNoteId(null);
  };

  const handleNoteSaved = () => {
    setViewMode('list');
  };

  const handleOpenProfileSettings = () => {
    setShowProfileSettings(true);
  };

  const handleCloseProfileSettings = () => {
    setShowProfileSettings(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {!session && !bypassAuth ? (
        <>
          <Auth defaultEmail={TEST_EMAIL} />
          <Toaster />
        </>
      ) : (
      <Layout>
          <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-300`}>
            <div className={`flex h-screen overflow-hidden ${isMobile ? 'with-mobile-nav' : ''}`}>
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={toggleSidebar}
            onFileSelect={handleFileSelect}
                onCreateNote={handleCreateNote}
                onSettingsClick={handleOpenProfileSettings}
              />

              <main 
                className={`
                  flex-1 flex flex-col overflow-hidden transition-all duration-300
                  ${sidebarOpen && !isMobile ? 'ml-72' : 'ml-0'}
                  bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm
                  relative
                `}
              >
                {/* Sidebar Toggle Button */}
                {!isMobile && (
                  <button
                    onClick={toggleSidebar}
                    className={`
                      absolute top-4 ${sidebarOpen ? 'left-4' : 'left-6'}
                      z-50 p-2 rounded-lg
                      bg-white/80 dark:bg-gray-800/80
                      hover:bg-gray-100 dark:hover:bg-gray-700
                      text-gray-600 dark:text-gray-300
                      shadow-lg backdrop-blur-sm
                      transition-all duration-300 ease-in-out
                      border border-gray-200/50 dark:border-gray-700/50
                      group
                    `}
                    aria-label={sidebarOpen ? t('sidebar.collapse') : t('sidebar.expand')}
                  >
                    <Menu 
                      size={20} 
                      className={`transform transition-transform duration-300 ${
                        sidebarOpen ? 'rotate-0' : 'rotate-180'
                      }`}
                    />
                    <span className={`
                      absolute left-full ml-2 px-2 py-1 rounded-md
                      bg-gray-800 dark:bg-gray-700 text-white text-sm
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-200
                      whitespace-nowrap
                    `}>
                      {sidebarOpen ? t('sidebar.collapse') : t('sidebar.expand')}
                    </span>
                  </button>
                )}

            <TestSupabase />
                
                {/* Top navigation tabs */}
                {!viewMode.includes('edit') && (
                  <div className="flex items-center border-b border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-6 mt-16 pt-2">
                    <button
                      className={`
                        relative px-6 py-3 font-medium text-sm flex items-center transition-all duration-300 group
                        ${viewMode === 'list' 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}
                      `}
                      onClick={() => setViewMode('list')}
                    >
                      <List size={18} className={`mr-2 transition-transform duration-300 group-hover:scale-110 ${
                        viewMode === 'list' ? 'animate-pulse' : ''
                      }`} />
                      <span className="relative z-10">{language === 'ar' ? 'الملاحظات' : 'Notes'}</span>
                      {viewMode === 'list' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 
                          animate-[highlight_0.2s_ease-in-out]" />
                      )}
                      <div className={`
                        absolute inset-0 rounded-lg transition-opacity duration-300
                        bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10
                        opacity-0 group-hover:opacity-100 ${viewMode === 'list' ? 'opacity-100' : ''}
                      `} />
                    </button>

                    <button
                      className={`
                        relative px-6 py-3 font-medium text-sm flex items-center transition-all duration-300 group
                        ${viewMode === 'mindmap' 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}
                      `}
                      onClick={() => setViewMode('mindmap')}
                    >
                      <Network size={18} className={`mr-2 transition-transform duration-300 group-hover:scale-110 ${
                        viewMode === 'mindmap' ? 'animate-pulse' : ''
                      }`} />
                      <span className="relative z-10">{language === 'ar' ? 'خريطة ذهنية' : 'Mind Map'}</span>
                      {viewMode === 'mindmap' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 
                          animate-[highlight_0.2s_ease-in-out]" />
                      )}
                      <div className={`
                        absolute inset-0 rounded-lg transition-opacity duration-300
                        bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10
                        opacity-0 group-hover:opacity-100 ${viewMode === 'mindmap' ? 'opacity-100' : ''}
                      `} />
                    </button>
                    
                    <div className="ml-auto pr-2 flex items-center space-x-2">
                      <button
                        onClick={handleSignOut}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 
                          rounded-lg transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                        title={language === 'ar' ? 'تسجيل الخروج' : 'Sign Out'}
                      >
                        <LogOut size={18} className="transition-transform duration-300 hover:scale-110" />
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Main content area */}
                <div className="flex-1 overflow-y-auto">
                  {viewMode === 'edit' ? (
                    <NoteEditor 
                      noteId={selectedNoteId} 
                      onBack={handleBackToNotes} 
                      onSave={handleNoteSaved} 
                    />
                  ) : viewMode === 'mindmap' ? (
                    <div className="p-4">
                      <MindMap 
                        onNoteSelect={handleEditNote}
                        onCreateNote={handleCreateNote}
                      />
                    </div>
                  ) : (
                    <div className="p-4">
                      <NotesList 
                        onNoteClick={handleEditNote}
                        onCreateNote={handleCreateNote}
                      />
              </div>
            )}
                </div>
          </main>
              
              {isMobile && !isKeyboardOpen && (
                <div className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 ios-safe-area-bottom">
                  <div className="flex justify-around items-center p-2">
                    <button 
                      className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                        viewMode === 'list' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                      }`}
                      onClick={() => setViewMode('list')}
                      aria-label={t('tabs.notes')}
                    >
                      <List size={24} />
                      <span className="text-xs mt-1">{t('tabs.notes') || 'Notes'}</span>
                    </button>
                    
                    <button 
                      className="flex flex-col items-center p-2 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600"
                      onClick={handleCreateNote}
                      aria-label={t('new')}
                    >
                      <Plus size={24} />
                      <span className="text-xs mt-1">{t('new')}</span>
                    </button>
                    
                    <button 
                      className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                        viewMode === 'mindmap' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
                      }`}
                      onClick={() => setViewMode('mindmap')}
                      aria-label={t('tabs.mindmap')}
                    >
                      <Network size={24} />
                      <span className="text-xs mt-1">{t('tabs.mindmap') || 'Map'}</span>
                    </button>
                    
                    <button 
                      className="flex flex-col items-center p-2 rounded-lg text-gray-500 dark:text-gray-400"
                      onClick={handleOpenProfileSettings}
                      aria-label={t('nav.settings')}
                    >
                      <Settings size={24} />
                      <span className="text-xs mt-1">{t('nav.settings')}</span>
                    </button>
                  </div>
                </div>
              )}
              
              {showProfileSettings && (
                <ProfileSettings onClose={handleCloseProfileSettings} />
              )}
            </div>
        </div>
      </Layout>
      )}
    </>
  );
};

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#333',
              color: '#fff',
            },
          }}
        />
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;