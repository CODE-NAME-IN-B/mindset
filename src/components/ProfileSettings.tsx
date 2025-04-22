import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Save, X, Moon, Sun, Languages, Upload, Trash2, User, Mail, Settings as SettingsIcon } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfileSettingsProps {
  onClose: () => void;
}

interface Profile {
  id: string;
  email: string;
  display_name?: string;
  language?: string;
  dark_mode?: boolean;
  avatar_url?: string;
}

const ProfileSettings: React.FC<ProfileSettingsProps> = ({ onClose }) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'security'>('profile');
  const { language, toggleLanguage, t, setLanguage } = useLanguage();
  const { isDarkMode, toggleTheme } = useTheme();
  const isRTL = language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
      } else if (data) {
        setProfile(data);
        setDisplayName(data.display_name || '');
        setAvatarUrl(data.avatar_url || null);
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      
      if (!profile) {
        toast.error(t('error.profile.picture.update'));
        return;
      }
      
      setUploading(true);
      
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-avatar.${fileExt}`;
      const filePath = `avatars/${fileName}`;
      
      // Upload file to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) {
        throw uploadError;
      }
      
      // Get public URL of the image
      const { data: urlData } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath);
      
      if (urlData) {
        // Update profile with the new avatar URL
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ avatar_url: urlData.publicUrl })
          .eq('id', profile.id);
        
        if (updateError) {
          throw updateError;
        }
        
        setAvatarUrl(urlData.publicUrl);
        toast.success(t('success.profile.picture.update'));
      }
    } catch (error: any) {
      console.error('Error uploading avatar:', error.message);
      toast.error(t('error.profile.picture.update'));
    } finally {
      setUploading(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      if (!profile) {
        toast.error(t('error.profile.picture.update'));
        return;
      }
      
      setUploading(true);
      
      if (avatarUrl) {
        // Extract filename from URL
        const fileName = avatarUrl.split('/').pop();
        if (fileName) {
          try {
            // Delete file from storage
            await supabase.storage
              .from('profiles')
              .remove([`avatars/${fileName}`]);
          } catch (storageError) {
            console.warn('Failed to remove avatar file:', storageError);
            // Continue even if file deletion fails
          }
        }
      }
      
      // Update profile to remove avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', profile.id);
      
      if (updateError) {
        throw updateError;
      }
      
      setAvatarUrl(null);
      toast.success(t('success.profile.picture.update'));
    } catch (error: any) {
      console.error('Error removing avatar:', error.message);
      toast.error(t('error.profile.picture.update'));
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          language: language,
          dark_mode: isDarkMode,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id);

      if (error) throw error;
      
      toast.success(t('profile.updated'));
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
          <div className="flex justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-indigo-500 rounded-full border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" dir={isRTL ? "rtl" : "ltr"}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 transform"
        style={{ opacity: 1, transform: 'scale(1)' }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
            <SettingsIcon size={20} className="mr-2" />
            {t('profile.settings')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label="Close"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'profile'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('profile')}
          >
            <span className="flex items-center">
              <User size={16} className={isRTL ? "ml-1.5" : "mr-1.5"} />
              {t('profile.title') || 'Profile'}
            </span>
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm transition-colors duration-200 ${
              activeTab === 'appearance'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('appearance')}
          >
            <span className="flex items-center">
              {isDarkMode ? 
                <Moon size={16} className={isRTL ? "ml-1.5" : "mr-1.5"} /> : 
                <Sun size={16} className={isRTL ? "ml-1.5" : "mr-1.5"} />
              }
              {t('profile.appearance')}
            </span>
          </button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex flex-col items-center sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 border-2 border-white dark:border-gray-600 shadow-md">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt={displayName || t('profile.avatar') || "Profile"} 
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-indigo-100 dark:bg-indigo-900">
                          <User size={40} className="text-indigo-500 dark:text-indigo-300" />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 p-1.5 rounded-full text-white shadow-md transition-colors duration-200"
                      aria-label={t('profile.picture.upload')}
                    >
                      <Upload size={14} />
                    </button>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUploadAvatar}
                    className="hidden"
                    accept="image/*"
                  />
                  {avatarUrl && (
                    <button
                      onClick={handleRemoveAvatar}
                      disabled={uploading}
                      className="mt-2 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 flex items-center"
                    >
                      <Trash2 size={12} className={isRTL ? "ml-1" : "mr-1"} />
                      {t('profile.picture.remove')}
                    </button>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('profile.displayName')}
                    </label>
                    <input
                      type="text"
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {t('profile.email')}
                    </label>
                    <div className="mt-1 flex items-center">
                      <Mail size={16} className="text-gray-400 mr-2" />
                      <span className="text-gray-600 dark:text-gray-400">{profile?.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'appearance' && (
            <div className="space-y-6">
              <div className="flex flex-col space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('theme.title') || 'Theme'}</h3>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    {isDarkMode ? 
                      <Moon className="h-6 w-6 text-gray-900 dark:text-white mr-2" /> : 
                      <Sun className="h-6 w-6 text-yellow-500 mr-2" />
                    }
                    <span className="text-gray-900 dark:text-white font-medium">
                      {isDarkMode ? t('theme.dark') : t('theme.light')}
                    </span>
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    style={{ backgroundColor: isDarkMode ? '#6366F1' : '#D1D5DB' }}
                  >
                    <span 
                      className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${
                        isDarkMode ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mt-4">{t('language.title') || 'Language'}</h3>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center">
                    <Languages className="h-6 w-6 text-gray-900 dark:text-white mr-2" />
                    <span className="text-gray-900 dark:text-white font-medium">
                      {language === 'ar' ? 'العربية' : 'English'}
                    </span>
                  </div>
                  <button
                    onClick={toggleLanguage}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
                  >
                    {language === 'ar' ? 'English' : 'العربية'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="flex justify-end space-x-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            {t('profile.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                {t('profile.saving')}
              </>
            ) : (
              <>
                <Save size={16} className={isRTL ? "ml-1.5" : "mr-1.5"} />
                {t('profile.save')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings; 