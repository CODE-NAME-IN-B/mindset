import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Note, Folder } from '../types';
import { Plus, Star, StarOff, Edit, Trash2, FolderOpen, FolderIcon, Hash, CheckSquare, Search, Filter, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { format } from 'date-fns';
import { arSA, enUS } from 'date-fns/locale';

interface NotesListProps {
  onNoteClick: (noteId: string) => void;
  onCreateNote: () => void;
}

const NotesList: React.FC<NotesListProps> = ({ onNoteClick, onCreateNote }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const { language, t } = useLanguage();
  
  const isRTL = language === 'ar';

  useEffect(() => {
    fetchFolders();
    fetchNotes();
  }, [selectedFolder, selectedTags, showOnlyFavorites]);

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

  async function fetchFolders() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error(t('error.auth.required'));
      }

      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('name');

      if (error) {
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          console.warn("Folders table doesn't exist, continuing with empty folders list");
          setFolders([]);
          return;
        }
        throw error;
      }

      if (data) {
        setFolders(data);
      }
    } catch (error: any) {
      console.error('Error fetching folders:', error.message);
      toast.error(t('error.folders.fetch'));
      setFolders([]);
    }
  }

  async function fetchNotes() {
    try {
      setLoading(true);
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error(t('error.auth.required'));
      }

      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', userData.user.id);
      
      if (selectedFolder) {
        query = query.eq('folder_id', selectedFolder);
      }
      
      if (showOnlyFavorites) {
        query = query.eq('is_favorite', true);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        if (error.message.includes("relation") && error.message.includes("does not exist")) {
          console.warn("Notes table doesn't exist, continuing with empty notes list");
          setNotes([]);
          setAllTags([]);
          setLoading(false);
          return;
        }
        throw error;
      }

      if (data) {
        let filteredNotes = data;
        if (selectedTags.length > 0) {
          filteredNotes = data.filter(note => {
            const noteTags = note.tags || [];
            return selectedTags.some(tag => noteTags.includes(tag));
          });
        }
        
        setNotes(filteredNotes);
        
        const tags = new Set<string>();
        data.forEach(note => {
          if (note.tags) {
            note.tags.forEach((tag: string) => tags.add(tag));
          }
        });
        setAllTags(Array.from(tags));
      }
    } catch (error: any) {
      console.error('Error fetching notes:', error.message);
      toast.error(t('error.notes.fetch'));
      setNotes([]);
      setAllTags([]);
    } finally {
      setLoading(false);
    }
  }

  function handleTagClick(tag: string) {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  }

  function handleFolderClick(folderId: string | null) {
    setSelectedFolder(folderId);
  }

  function getFolderName(folderId: string | null): string {
    if (!folderId) return t('notes.uncategorized');
    const folder = folders.find(f => f.id === folderId);
    return folder ? folder.name : t('notes.uncategorized');
  }

  function getSummary(content: string): string {
    return content
      .replace(/!\[.*?\]\(.*?\)/g, '[image]')
      .replace(/\[.*?\]\(.*?\)/g, (match) => match.match(/\[(.*?)\]/)?.[1] || '')
      .replace(/```[\s\S]*?```/g, '[code]')
      .replace(/`.*?`/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/(?:\r\n|\r|\n)/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 150) + (content.length > 150 ? '...' : '');
  }

  async function toggleFavorite(note: Note) {
    try {
      const updatedNote = { ...note, is_favorite: !note.is_favorite };
      
      const { error } = await supabase
        .from('notes')
        .update({ is_favorite: !note.is_favorite })
        .eq('id', note.id);

      if (error) {
        throw error;
      }

      setNotes(notes.map(n => n.id === note.id ? updatedNote : n));
      toast.success(updatedNote.is_favorite ? t('success.note.favorite.add') : t('success.note.favorite.remove'));
    } catch (error: any) {
      console.error('Error updating note:', error.message);
      toast.error(t('error.note.update'));
    }
  }

  async function deleteNote(id: string) {
    const confirmDelete = window.confirm(t('notes.delete.confirm'));
    if (!confirmDelete) return;
    
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setNotes(notes.filter(n => n.id !== id));
      toast.success(t('success.note.delete'));
    } catch (error: any) {
      console.error('Error deleting note:', error.message);
      toast.error(t('error.note.delete'));
    }
  }

  const toggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const toggleFavoritesOnly = () => {
    setShowOnlyFavorites(!showOnlyFavorites);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const filteredNotes = notes.filter(note => {
    const matchesSearch = searchTerm === '' || 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      note.content.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesTag = !activeTag || (note.tags && note.tags.includes(activeTag));
    
    return matchesSearch && matchesTag;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'PPp', { locale: language === 'ar' ? arSA : enUS });
  };

  const createExcerpt = (content: string, maxLength = 100) => {
    if (!content) return '';
    
    const plainText = content
      .replace(/#+\s/g, '')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/~~(.*?)~~/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/```([\s\S]*?)```/g, '')
      .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '')
      .replace(/>/g, '')
      .replace(/- /g, '')
      .replace(/\d+\. /g, '')
      .trim();
      
    return plainText.length > maxLength 
      ? plainText.substring(0, maxLength) + '...' 
      : plainText;
  };

  return (
    <div className="h-full flex flex-col bg-[#0f1117]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          {t('notes.title')}
        </h1>
        
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFilters}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              showFilters 
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'text-gray-400 hover:bg-gray-800'
            }`}
            aria-label={t('filter')}
          >
            <Filter size={18} />
          </button>
          
          <button
            onClick={onCreateNote}
            className="flex items-center px-4 py-2 rounded-lg
              bg-gradient-to-r from-indigo-500 to-purple-500
              text-white transition-all duration-300
              hover:from-indigo-600 hover:to-purple-600
              shadow-lg hover:shadow-indigo-500/25"
          >
            <Plus size={18} className="mr-2" />
            <span className={isMobile ? 'hidden' : ''}>{t('notes.new')}</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 space-y-4 border-b border-gray-800">
        <div className="relative">
          <input
            type="text"
            placeholder={t('search_notes')}
            className="w-full px-4 py-2.5 pl-10 rounded-xl
              bg-gray-900/50 border border-gray-800
              text-gray-300 placeholder-gray-500
              focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50
              transition-all duration-200"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Search size={16} className="absolute left-3 top-3 text-gray-500" />
          {searchTerm && (
            <button 
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-300
                transition-colors duration-200"
              onClick={() => setSearchTerm('')}
            >
              <X size={16} />
            </button>
          )}
        </div>

        {showFilters && (
          <div className="space-y-4 animate-fadeIn">
            {/* Folders */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">{t('notes.folders')}</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`flex items-center px-3 py-1.5 rounded-lg text-sm
                    transition-all duration-200 ${
                    activeFolder === null 
                      ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveFolder(null)}
                >
                  {t('notes.all')}
                </button>
                
                {folders.map(folder => (
                  <button
                    key={folder.id}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-sm
                      transition-all duration-200 ${
                      activeFolder === folder.id 
                        ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                    onClick={() => setActiveFolder(folder.id)}
                  >
                    <FolderIcon size={14} className="mr-1.5" />
                    {folder.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-2">{t('notes.tags')}</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`flex items-center px-3 py-1.5 rounded-lg text-sm
                    transition-all duration-200 ${
                    activeTag === null 
                      ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50' 
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                  onClick={() => setActiveTag(null)}
                >
                  {t('notes.all')}
                </button>
                
                {allTags.map(tag => (
                  <button
                    key={tag}
                    className={`flex items-center px-3 py-1.5 rounded-lg text-sm
                      transition-all duration-200 ${
                      activeTag === tag 
                        ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50' 
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                    onClick={() => setActiveTag(tag)}
                  >
                    <Hash size={14} className="mr-1.5" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-indigo-500/30 rounded-full" />
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-full p-4 text-center">
            <div className="w-16 h-16 mb-4 text-gray-600">
              {/* Empty state icon */}
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-gray-400 mb-4">{t('notes.empty')}</p>
            <button
              onClick={onCreateNote}
              className="px-4 py-2 rounded-lg
                bg-gradient-to-r from-indigo-500 to-purple-500
                text-white transition-all duration-300
                hover:from-indigo-600 hover:to-purple-600
                shadow-lg hover:shadow-indigo-500/25"
            >
              {t('notes.new')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map(note => (
              <div 
                key={note.id}
                onClick={() => onNoteClick(note.id)}
                className="group relative p-4 rounded-xl
                  bg-gray-900/50 border border-gray-800
                  hover:border-indigo-500/50 hover:bg-gray-800/50
                  transition-all duration-300 cursor-pointer
                  backdrop-blur-sm"
              >
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-200 group-hover:text-white truncate">
                    {note.title || t('untitled_note')}
                  </h3>
                  
                  <p className="text-sm text-gray-400 line-clamp-2">
                    {createExcerpt(note.content)}
                  </p>

                  <div className="flex items-center justify-between pt-2 text-xs text-gray-500">
                    <div>{formatDate(note.updated_at)}</div>
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        {note.tags.slice(0, 2).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 rounded-full
                              bg-indigo-500/10 text-indigo-400
                              border border-indigo-500/20"
                          >
                            {tag}
                          </span>
                        ))}
                        {note.tags.length > 2 && (
                          <span className="text-indigo-400">
                            +{note.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Hover Actions */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(note);
                    }}
                    className="p-1.5 rounded-lg bg-gray-800 text-gray-400
                      hover:bg-indigo-500/20 hover:text-indigo-400
                      transition-colors duration-200"
                  >
                    {note.is_favorite ? <Star size={16} className="fill-current" /> : <StarOff size={16} />}
                  </button>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNote(note.id);
                    }}
                    className="p-1.5 rounded-lg bg-gray-800 text-gray-400
                      hover:bg-red-500/20 hover:text-red-400
                      transition-colors duration-200"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesList; 