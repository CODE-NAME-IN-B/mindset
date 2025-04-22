import React, { useState, useEffect } from 'react';
import { FileType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Plus, Settings, Menu, X, ChevronLeft, ChevronRight, 
  Sun, Moon, FolderTree, FileText, Home, Search,
  BookOpen, Tag, Star, Archive, FolderOpen, LogOut,
  Filter, SortAsc, SortDesc
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onFileSelect: (file: FileType) => void;
  onCreateNote: () => void;
  onSettingsClick: () => void;
  onNavigate: (route: string) => void;
  activeRoute: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

interface NavItem {
  id: string;
  icon: React.ReactNode;
  label: string;
  labelAr: string;
  action: () => void;
  badge?: number;
}

interface Folder {
  id: string;
  name: string;
  count: number;
}

const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onToggle,
  onFileSelect,
  onCreateNote,
  onSettingsClick,
  onNavigate,
  activeRoute,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const { t, language, toggleLanguage } = useLanguage();
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [noteCounts, setNoteCounts] = useState({
    all: 0,
    favorites: 0,
    archived: 0,
    tags: 0
  });
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showFilters, setShowFilters] = useState(false);
  const isRTL = language === 'ar';

  // Fetch note counts
  const fetchNoteCounts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: allNotes, error: notesError } = await supabase
        .from('notes')
        .select('id, is_favorite, is_archived, tags')
        .eq('user_id', user.id);

      if (notesError) throw notesError;

      setNoteCounts({
        all: allNotes?.length || 0,
        favorites: allNotes?.filter(note => note.is_favorite)?.length || 0,
        archived: allNotes?.filter(note => note.is_archived)?.length || 0,
        tags: Array.from(new Set(allNotes?.flatMap(note => note.tags || []))).length
      });
    } catch (error) {
      console.error('Error fetching note counts:', error);
    }
  };

  // Fetch folders
  const fetchFolders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: foldersData, error: foldersError } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: sortOrder === 'asc' });

      if (foldersError) throw foldersError;

      // Get note counts for each folder
      const foldersWithCounts = await Promise.all(
        (foldersData || []).map(async (folder) => {
          const { count } = await supabase
            .from('notes')
            .select('*', { count: 'exact' })
            .eq('folder_id', folder.id);

          return {
            id: folder.id,
            name: folder.name,
            count: count || 0
          };
        })
      );

      setFolders(foldersWithCounts);
    } catch (error) {
      console.error('Error fetching folders:', error);
    }
  };

  // Initialize data
  useEffect(() => {
    fetchNoteCounts();
    fetchFolders();
  }, []);

  // Handle screen size changes
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Trigger search functionality
    if (query.length >= 2) {
      onNavigate(`search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleCreateFolder = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const folderName = prompt(t('enter_folder_name'));
      if (!folderName) return;

      const { data, error } = await supabase
        .from('folders')
        .insert([
          { name: folderName, user_id: user.id }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success(t('folder_created'));
      fetchFolders();
    } catch (error: any) {
      console.error('Error creating folder:', error);
      toast.error(t('error_creating_folder'));
    }
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm(t('confirm_delete_folder'))) return;

    try {
      const { error } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);

      if (error) throw error;

      toast.success(t('folder_deleted'));
      fetchFolders();
    } catch (error) {
      console.error('Error deleting folder:', error);
      toast.error(t('error_deleting_folder'));
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success(t('signed_out'));
      // Redirect to login page or handle sign out in parent component
    } catch (error: any) {
      console.error('Error signing out:', error.message);
      toast.error(t('error_signing_out'));
    }
  };

  const navigationItems: NavItem[] = [
    {
      id: 'home',
      icon: <Home size={18} />,
      label: 'Home',
      labelAr: 'الرئيسية',
      action: () => onNavigate('home')
    },
    {
      id: 'all_notes',
      icon: <BookOpen size={18} />,
      label: 'All Notes',
      labelAr: 'جميع الملاحظات',
      action: () => onNavigate('notes'),
      badge: noteCounts.all
    },
    {
      id: 'favorites',
      icon: <Star size={18} />,
      label: 'Favorites',
      labelAr: 'المفضلة',
      action: () => onNavigate('favorites'),
      badge: noteCounts.favorites
    },
    {
      id: 'tags',
      icon: <Tag size={18} />,
      label: 'Tags',
      labelAr: 'الوسوم',
      action: () => onNavigate('tags'),
      badge: noteCounts.tags
    },
    {
      id: 'archive',
      icon: <Archive size={18} />,
      label: 'Archive',
      labelAr: 'الأرشيف',
      action: () => onNavigate('archive'),
      badge: noteCounts.archived
    }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isMobile && (
        <div 
          className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-30
            ${mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'}`}
          onClick={() => setMobileOpen(false)}
        />
      )}
      
      {/* Mobile toggle button */}
      {isMobile && (
        <button
          className="fixed bottom-20 right-4 z-50 p-3 bg-gradient-to-r from-blue-600 to-indigo-600 
            text-white rounded-full shadow-lg hover:from-blue-700 hover:to-indigo-700 
            transition-all duration-200 backdrop-blur-sm"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? t('close_sidebar') : t('open_sidebar')}
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Sidebar */}
      <aside 
        className={`
          fixed top-0 bottom-0 z-40
          w-72 bg-white/80 dark:bg-gray-900/90
          transition-all duration-300 ease-in-out
          border-r border-gray-200/50 dark:border-gray-700/50
          backdrop-blur-md
          ${isRTL ? 'right-0' : 'left-0'}
          ${isMobile 
            ? mobileOpen 
              ? 'translate-x-0' 
              : isRTL 
                ? 'translate-x-full' 
                : '-translate-x-full'
            : 'translate-x-0'
          }
        `}
      >
        {/* Sidebar header */}
        <div className="flex flex-col space-y-4 p-4 pt-16">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text">
              {t('app.title')}
            </h1>
            {!isMobile && (
              <button
                onClick={onToggleCollapse}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50"
              >
                {isRTL 
                  ? (isCollapsed ? <ChevronLeft size={20} /> : <ChevronRight size={20} />)
                  : (isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />)
                }
              </button>
            )}
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder={t('search')}
              className={`
                w-full px-4 py-2 rounded-lg
                bg-gray-100/50 dark:bg-gray-800/50 
                border border-gray-200/50 dark:border-gray-700/50
                focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50
                placeholder-gray-500 dark:placeholder-gray-400
                ${isSearchFocused ? 'ring-2 ring-blue-500/50' : ''}
              `}
            />
            <Search className="absolute right-3 top-2.5 text-gray-400 dark:text-gray-500" size={18} />
          </div>

          {/* Filter button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`
              flex items-center justify-center p-2 rounded-lg
              text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50
              ${showFilters ? 'bg-gray-100 dark:bg-gray-800/50' : ''}
            `}
          >
            <Filter size={18} className="mr-2" />
            <span>{t('filters')}</span>
          </button>

          {/* Filters panel */}
          {showFilters && (
            <div className="p-3 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg space-y-2">
              {/* Add your filter options here */}
            </div>
          )}
      </div>
      
        {/* Sidebar content */}
        <div className="px-3 py-2 space-y-6 h-[calc(100vh-180px)] overflow-y-auto">
          {/* Quick Actions */}
          <div className="space-y-1">
            <button 
              onClick={onCreateNote}
              className="flex items-center w-full p-2 rounded-lg text-white
                bg-gradient-to-r from-blue-600 to-indigo-600 
                hover:from-blue-700 hover:to-indigo-700
                transition-all duration-200"
            >
              <Plus size={18} className="mr-2" />
              <span>{t('sidebar.new.note')}</span>
            </button>
          </div>

          {/* Navigation */}
          <div className="space-y-1">
            {navigationItems.map((item) => (
                    <button
                key={item.id}
                onClick={item.action}
                className={`
                  flex items-center justify-between w-full p-2 rounded-lg
                  transition-all duration-200
                  ${activeRoute === item.id
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  }
                `}
              >
                <div className="flex items-center">
                  <span className="mr-3">{item.icon}</span>
                  <span>{isRTL ? item.labelAr : item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-1 text-xs rounded-full bg-indigo-500/20 text-indigo-400">
                    {item.badge}
                  </span>
                )}
                    </button>
            ))}
          </div>

          {/* Folders */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {language === 'ar' ? 'المجلدات' : 'Folders'}
              </span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                >
                  {sortOrder === 'asc' ? <SortAsc size={16} /> : <SortDesc size={16} />}
                  </button>
                <button
                  onClick={handleCreateFolder}
                  className="p-1 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                >
                  <Plus size={16} />
                  </button>
        </div>
      </div>
      
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => onNavigate(`folder/${folder.id}`)}
                className="flex items-center justify-between w-full p-2 rounded-lg
                  text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50
                  transition-all duration-200"
              >
                <div className="flex items-center">
                  <FolderTree size={18} className="mr-3" />
                  <span>{folder.name}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {folder.count}
                </span>
              </button>
            ))}
          </div>
        </div>
        
        {/* Bottom actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t 
          border-gray-200/50 dark:border-gray-700/50 
          bg-white/80 dark:bg-gray-900/90 backdrop-blur-md"
        >
        <div className="flex items-center justify-between">
          <button 
            onClick={toggleTheme}
              className="flex items-center p-2 rounded-lg
                hover:bg-gray-100 dark:hover:bg-gray-800/50
                text-gray-700 dark:text-gray-300"
              title={theme === 'dark' ? t('light_mode') : t('dark_mode')}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            
            <button
              onClick={toggleLanguage}
              className="flex items-center p-2 rounded-lg
                hover:bg-gray-100 dark:hover:bg-gray-800/50
                text-gray-700 dark:text-gray-300"
              title={language === 'ar' ? 'English' : 'العربية'}
            >
              <span className="text-sm font-medium">
                {language === 'ar' ? 'EN' : 'ع'}
              </span>
          </button>
          
            <button
              onClick={handleSignOut}
              className="flex items-center p-2 rounded-lg
                hover:bg-gray-100 dark:hover:bg-gray-800/50
                text-red-500 hover:text-red-600"
              title={t('sign_out')}
            >
              <LogOut size={18} />
            </button>
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;