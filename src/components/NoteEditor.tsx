import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Note, Folder, Tag, Attachment } from '../types';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, Link, Image, Tag as TagIcon, FolderPlus, Hash, Trash2, FolderOpen, X, Plus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import MDEditor from '@uiw/react-md-editor';
import rehypeSanitize from "rehype-sanitize";

interface NoteEditorProps {
  noteId: string | null;
  onBack: () => void;
  onSave: () => void;
}

const NoteEditor: React.FC<NoteEditorProps> = ({ noteId, onBack, onSave }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  const { language, t } = useLanguage();
  const isRTL = language === 'ar';

  useEffect(() => {
    fetchFolders();
    
    if (noteId) {
      fetchNote();
    } else {
      setTitle(language === 'ar' ? 'ملاحظة جديدة' : 'New Note');
      setContent('');
      setTags([]);
      setSelectedFolder(null);
      setAttachments([]);
    }
  }, [noteId, language]);

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
        console.error('Error fetching folders:', error);
        return;
      }

      if (data) {
        setFolders(data);
      }
    } catch (error) {
      console.error('Error in fetchFolders:', error);
    }
  }

  async function fetchNote() {
    if (!noteId) return;
    
    try {
      setLoading(true);
      // First try to fetch the note without attachments
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', noteId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setTitle(data.title);
        setContent(data.content);
        setTags(data.tags || []);
        setSelectedFolder(data.folder_id);
        
        // Then try to fetch attachments separately if they exist
        try {
          const { data: attachmentsData, error: attachmentsError } = await supabase
            .from('attachments')
            .select('*')
            .eq('note_id', noteId);
            
          if (!attachmentsError && attachmentsData) {
            setAttachments(attachmentsData);
          } else {
            // If there's an error fetching attachments, just set empty array
            setAttachments([]);
          }
        } catch (attachmentError) {
          console.warn('Could not fetch attachments, table might not exist:', attachmentError);
          setAttachments([]);
        }
      }
    } catch (error: any) {
      console.error('Error fetching note:', error.message);
      toast.error(t('error.note.fetch'));
    } finally {
      setLoading(false);
    }
  }

  async function saveNote() {
    try {
      setSaving(true);
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error(t('error.auth.required'));
      }

      // Find linked notes from content
      const linkedNotes = findLinkedNotes(content);
      const hasCheckboxes = content.includes('- [ ]') || content.includes('- [x]');

      const noteData = {
        title,
        content,
        updated_at: new Date().toISOString(),
        tags,
        folder_id: selectedFolder,
        has_checkboxes: hasCheckboxes,
        linked_notes: linkedNotes
      };

      let newNoteId = noteId;
      let error;

      if (noteId) {
        // Update existing note
        const { error: updateError } = await supabase
          .from('notes')
          .update(noteData)
          .eq('id', noteId)
          .eq('user_id', userData.user.id);
        
        error = updateError;
      } else {
        // Create new note
        const { data: noteResult, error: insertError } = await supabase
          .from('notes')
          .insert([{
            ...noteData,
            user_id: userData.user.id,
            created_at: new Date().toISOString(),
          }])
          .select();
        
        if (noteResult && noteResult.length > 0) {
          newNoteId = noteResult[0].id;
        }
        
        error = insertError;
      }

      if (error) {
        throw error;
      }

      // Handle attachments - only if we have a valid note ID and attachments to save
      if (newNoteId && attachments.length > 0) {
        try {
          // For existing attachments without an ID (new ones), insert them
          const newAttachments = attachments.filter(a => !a.id);
          if (newAttachments.length > 0) {
            const { error: attachError } = await supabase
              .from('attachments')
              .insert(
                newAttachments.map(a => ({
                  name: a.name,
                  url: a.url,
                  type: a.type,
                  note_id: newNoteId,
                  created_at: new Date().toISOString()
                }))
              );
              
            if (attachError) {
              console.warn('Error saving attachments:', attachError);
              // Don't fail the entire save operation for attachments error
            }
          }
        } catch (attachErr) {
          console.warn('Failed to save attachments:', attachErr);
          // The note is already saved, so we just log this error
        }
      }

      toast.success(t('success.note.save'));
      onSave();
    } catch (error: any) {
      console.error('Error saving note:', error.message);
      toast.error(t('error.note.save'));
    } finally {
      setSaving(false);
    }
  }

  // وظيفة للبحث عن الروابط بين الملاحظات [[note-title]]
  function findLinkedNotes(text: string): string[] {
    const regex = /\[\[(.*?)\]\]/g;
    const matches = [];
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      matches.push(match[1].trim());
    }
    
    return [...new Set(matches)]; // إزالة التكرارات
  }

  async function handleAddTag() {
    if (!newTag.trim()) return;
    
    if (!tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
    }
    
    setNewTag('');
  }

  function handleRemoveTag(tagToRemove: string) {
    setTags(tags.filter(tag => tag !== tagToRemove));
  }

  async function handleCreateFolder() {
    const folderName = prompt(t('folder.create.prompt'));
    if (!folderName) return;
    
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        throw new Error(t('error.auth.required'));
      }
      
      const { data, error } = await supabase
        .from('folders')
        .insert([{
          name: folderName,
          user_id: userData.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select();
      
      if (error) {
        throw error;
      }
      
      if (data && data.length > 0) {
        setFolders([...folders, data[0]]);
        setSelectedFolder(data[0].id);
        toast.success(t('success.folder.create'));
      }
    } catch (error: any) {
      console.error('Error creating folder:', error.message);
      toast.error(t('error.folder.create'));
    }
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    try {
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${noteId || 'new'}/${fileName}`;
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error(t('error.auth.required'));
      }
      
      // رفع الملف إلى Supabase Storage
      const { data, error } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);
      
      if (error) {
        throw error;
      }
      
      // الحصول على رابط عام للملف
      const { data: urlData } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);
      
      if (urlData) {
        // إضافة صورة إلى المحتوى
        const imageMarkdown = `![${file.name}](${urlData.publicUrl})`;
        setContent(prevContent => prevContent + '\n\n' + imageMarkdown);
        
        toast.success(t('success.image.upload'));
      }
    } catch (error: any) {
      console.error('Error uploading image:', error.message);
      toast.error(t('error.image.upload'));
    } finally {
      // إعادة تعيين حقل الملف
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleDeleteAttachment(attachmentId: string, attachmentUrl: string) {
    try {
      // استخراج مسار الملف من URL
      const storageUrl = new URL(attachmentUrl);
      const pathName = storageUrl.pathname;
      const filePath = pathName.split('/public/')[1];
      
      if (!filePath) {
        throw new Error('Invalid file path');
      }
      
      // حذف الملف من التخزين
      try {
        const { error: storageError } = await supabase.storage
          .from('attachments')
          .remove([filePath]);
        
        if (storageError) {
          console.warn('Error deleting file from storage:', storageError);
          // لا نوقف العملية إذا فشل حذف الملف من التخزين
        }
      } catch (storageErr) {
        console.warn('Storage delete operation failed:', storageErr);
      }
      
      // حذف المرفق من قاعدة البيانات
      if (attachmentId) {
        const { error: dbError } = await supabase
          .from('attachments')
          .delete()
          .eq('id', attachmentId);
        
        if (dbError) {
          throw dbError;
        }
      }
      
      // إزالة المرفق من القائمة المحلية
      setAttachments(attachments.filter(a => a.id !== attachmentId));
      
      // إزالة صورة المرفق من المحتوى، إذا كانت موجودة
      const imgMarkdownPattern = new RegExp(`!\\[[^\\]]*\\]\\(${attachmentUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
      const updatedContent = content.replace(imgMarkdownPattern, '');
      setContent(updatedContent);
      
      toast.success(t('success.attachment.delete'));
    } catch (error: any) {
      console.error('Error deleting attachment:', error.message);
      toast.error(t('error.attachment.delete'));
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="notion-editor">
      {isMobile && (
        <button
          onClick={onBack}
          className="mobile-back-button"
          aria-label={t('back')}
        >
          <ArrowLeft size={20} />
        </button>
      )}
      
      <div className="notion-editor-topbar">
        <div className="flex items-center">
          {!isMobile && (
            <button
              onClick={onBack}
              className="mr-4 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label={t('back')}
            >
              <ArrowLeft size={20} />
            </button>
          )}
          
          <div className="flex items-center space-x-2">
            {selectedFolder && (
              <span className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <FolderOpen size={16} className="mr-1" />
                {folders.find(f => f.id === selectedFolder)?.name}
              </span>
            )}
            
            <button
              onClick={() => {
                // Implement folder selection logic
              }}
              className="flex items-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <FolderPlus size={16} className="mr-1" />
              {t('add_to_folder')}
            </button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={saveNote}
            disabled={saving}
            className={`px-3 py-1.5 rounded-md text-sm font-medium ${
              saving 
                ? 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 dark:hover:bg-blue-800'
            }`}
          >
            {saving ? t('saving') : t('save')}
          </button>
        </div>
      </div>
      
      <div className="p-4">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('note_title')}
          className="notion-editor-title w-full outline-none"
        />
        
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map(tag => (
            <div key={tag} className="notion-tag">
              <span>{tag}</span>
              <button
                onClick={() => handleRemoveTag(tag)}
                className="ml-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          
          <button
            onClick={() => {
              // Implement tag addition logic
            }}
            className="flex items-center px-2 py-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 rounded"
          >
            <Plus size={14} className="mr-1" />
            {t('add_tag')}
          </button>
        </div>

        <div className="notion-editor-content">
          <MDEditor
            value={content}
            onChange={(value) => setContent(value || '')}
            preview="live"
            previewOptions={{
              rehypePlugins: [[rehypeSanitize]],
              components: {
                img: ({ src, alt }) => (
                  <div className="notion-image-container">
                    <img 
                      src={src} 
                      alt={alt || 'Image'} 
                      className="notion-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://placehold.co/600x400?text=Image+Not+Found';
                      }}
                    />
                  </div>
                )
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default NoteEditor; 