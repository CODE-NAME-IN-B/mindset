import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

type Language = 'ar' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

interface TranslationsType {
  [key: string]: {
    [key: string]: string;
  };
}

// الترجمات
const translations: TranslationsType = {
  // العامة
  'app.title': {
    ar: 'مايندست',
    en: 'Mindset',
  },
  'app.description': {
    ar: 'احفظ ملاحظاتك وأفكارك بسهولة',
    en: 'Store your notes and ideas easily',
  },
  
  // المصادقة
  'auth.signin': {
    ar: 'تسجيل الدخول لحسابك',
    en: 'Sign in to your account',
  },
  'auth.signup': {
    ar: 'إنشاء حساب جديد',
    en: 'Create a new account',
  },
  'auth.email': {
    ar: 'البريد الإلكتروني',
    en: 'Email address',
  },
  'auth.password': {
    ar: 'كلمة المرور',
    en: 'Password',
  },
  'auth.signin.button': {
    ar: 'تسجيل الدخول',
    en: 'Sign in',
  },
  'auth.signup.button': {
    ar: 'إنشاء حساب',
    en: 'Sign up',
  },
  'auth.loading': {
    ar: 'جاري التحميل...',
    en: 'Loading...',
  },
  'auth.have.account': {
    ar: 'لديك حساب بالفعل؟ تسجيل الدخول',
    en: 'Already have an account? Sign in',
  },
  'auth.no.account': {
    ar: 'ليس لديك حساب؟ إنشاء حساب جديد',
    en: 'Don\'t have an account? Sign up',
  },
  'auth.signin.success': {
    ar: 'تم تسجيل الدخول بنجاح',
    en: 'Successfully logged in',
  },
  'auth.signup.success': {
    ar: 'تم إرسال رابط التأكيد إلى بريدك الإلكتروني',
    en: 'Check your email for the confirmation link',
  },
  'auth.error': {
    ar: 'حدث خطأ أثناء تسجيل الدخول',
    en: 'An error occurred during authentication',
  },
  'auth.signOut': {
    ar: 'تسجيل الخروج',
    en: 'Sign out',
  },
  'auth.signedOut': {
    ar: 'تم تسجيل الخروج بنجاح',
    en: 'Successfully signed out',
  },
  
  // الشريط الجانبي
  'sidebar.title': {
    ar: 'مايندست',
    en: 'Mindset',
  },
  'sidebar.new.note': {
    ar: 'ملاحظة جديدة',
    en: 'New Note',
  },
  'sidebar.files': {
    ar: 'الملفات',
    en: 'Files',
  },
  'sidebar.quick.actions': {
    ar: 'الإجراءات السريعة',
    en: 'Quick Actions',
  },
  'sidebar.notes': {
    ar: 'الملاحظات',
    en: 'Notes',
  },
  'sidebar.dark.mode': {
    ar: 'الوضع الليلي',
    en: 'Dark Mode',
  },
  'sidebar.light.mode': {
    ar: 'الوضع النهاري',
    en: 'Light Mode',
  },
  'sidebar.settings': {
    ar: 'الإعدادات',
    en: 'Settings',
  },
  'sidebar.collapse': {
    ar: 'طي القائمة الجانبية',
    en: 'Collapse sidebar',
  },
  'sidebar.expand': {
    ar: 'توسيع القائمة الجانبية',
    en: 'Expand sidebar',
  },
  
  // قائمة الملاحظات
  'notes.title': {
    ar: 'ملاحظاتي',
    en: 'My Notes',
  },
  'notes.new': {
    ar: 'ملاحظة جديدة',
    en: 'New Note',
  },
  'notes.empty': {
    ar: 'لا توجد ملاحظات بعد.',
    en: 'No notes yet.',
  },
  'notes.empty.cta': {
    ar: 'انقر على زر "ملاحظة جديدة" لإنشاء ملاحظتك الأولى!',
    en: 'Click on "New Note" button to create your first note!',
  },
  'notes.updated': {
    ar: 'تم التحديث',
    en: 'Updated',
  },
  'notes.folders': {
    ar: 'المجلدات',
    en: 'Folders',
  },
  'notes.all': {
    ar: 'الكل',
    en: 'All',
  },
  'notes.uncategorized': {
    ar: 'غير مصنف',
    en: 'Uncategorized',
  },
  'notes.tags': {
    ar: 'العلامات',
    en: 'Tags',
  },
  'notes.view.grid': {
    ar: 'عرض الشبكة',
    en: 'Grid View',
  },
  'notes.view.list': {
    ar: 'عرض القائمة',
    en: 'List View',
  },
  'notes.show.favorites': {
    ar: 'عرض المفضلة فقط',
    en: 'Show Favorites Only',
  },
  'notes.show.all': {
    ar: 'عرض الكل',
    en: 'Show All',
  },
  'notes.delete.confirm': {
    ar: 'هل أنت متأكد من حذف هذه الملاحظة؟',
    en: 'Are you sure you want to delete this note?',
  },
  
  // محرر الملاحظات
  'editor.back': {
    ar: 'العودة',
    en: 'Back',
  },
  'editor.save': {
    ar: 'حفظ',
    en: 'Save',
  },
  'editor.saving': {
    ar: 'جاري الحفظ...',
    en: 'Saving...',
  },
  'editor.title.placeholder': {
    ar: 'عنوان الملاحظة',
    en: 'Note title',
  },
  'editor.content.placeholder': {
    ar: 'محتوى الملاحظة...',
    en: 'Note content...',
  },
  'editor.image.add': {
    ar: 'إضافة صورة',
    en: 'Add Image',
  },
  'editor.attachments.manage': {
    ar: 'إدارة المرفقات',
    en: 'Manage Attachments',
  },
  'editor.attachments.list': {
    ar: 'المرفقات',
    en: 'Attachments',
  },
  'editor.folder.create': {
    ar: 'إنشاء مجلد جديد',
    en: 'Create New Folder',
  },
  'editor.folder.none': {
    ar: 'بدون مجلد',
    en: 'No Folder',
  },
  'editor.tag.add': {
    ar: 'إضافة علامة...',
    en: 'Add tag...',
  },
  'folder.create.prompt': {
    ar: 'أدخل اسم المجلد الجديد:',
    en: 'Enter new folder name:',
  },
  
  // النجاح والأخطاء
  'success.note.save': {
    ar: 'تم حفظ الملاحظة بنجاح',
    en: 'Note saved successfully',
  },
  'success.note.delete': {
    ar: 'تم حذف الملاحظة بنجاح',
    en: 'Note deleted successfully',
  },
  'success.note.favorite.add': {
    ar: 'تمت إضافة الملاحظة إلى المفضلة',
    en: 'Note added to favorites',
  },
  'success.note.favorite.remove': {
    ar: 'تمت إزالة الملاحظة من المفضلة',
    en: 'Note removed from favorites',
  },
  'success.folder.create': {
    ar: 'تم إنشاء المجلد بنجاح',
    en: 'Folder created successfully',
  },
  'success.image.upload': {
    ar: 'تم رفع الصورة بنجاح',
    en: 'Image uploaded successfully',
  },
  'success.attachment.delete': {
    ar: 'تم حذف المرفق بنجاح',
    en: 'Attachment deleted successfully',
  },
  'error.attachment.delete': {
    ar: 'لم نتمكن من حذف المرفق',
    en: 'Could not delete attachment',
  },
  'error.notes.fetch': {
    ar: 'لم نتمكن من جلب الملاحظات الخاصة بك',
    en: 'Could not fetch your notes',
  },
  'error.folders.fetch': {
    ar: 'لم نتمكن من جلب المجلدات الخاصة بك',
    en: 'Could not fetch your folders',
  },
  'error.notes.create': {
    ar: 'لم نتمكن من إنشاء ملاحظة جديدة',
    en: 'Could not create a new note',
  },
  'error.note.fetch': {
    ar: 'لم نتمكن من جلب الملاحظة',
    en: 'Could not fetch the note',
  },
  'error.note.save': {
    ar: 'لم نتمكن من حفظ الملاحظة',
    en: 'Could not save the note',
  },
  'error.note.update': {
    ar: 'لم نتمكن من تحديث الملاحظة',
    en: 'Could not update the note',
  },
  'error.note.delete': {
    ar: 'لم نتمكن من حذف الملاحظة',
    en: 'Could not delete the note',
  },
  'error.folder.create': {
    ar: 'لم نتمكن من إنشاء المجلد',
    en: 'Could not create folder',
  },
  'error.image.upload': {
    ar: 'لم نتمكن من رفع الصورة',
    en: 'Could not upload image',
  },
  'error.auth.required': {
    ar: 'يجب تسجيل الدخول للوصول إلى الملاحظات',
    en: 'You must be logged in to access notes',
  },
  
  // Tema y apariencia
  'theme.dark': {
    ar: 'الوضع المظلم',
    en: 'Dark Mode',
  },
  'theme.light': {
    ar: 'الوضع الفاتح',
    en: 'Light Mode',
  },
  
  // Perfil de usuario
  'profile.settings': {
    ar: 'إعدادات الملف الشخصي',
    en: 'Profile Settings',
  },
  'profile.displayName': {
    ar: 'اسم العرض',
    en: 'Display Name',
  },
  'profile.email': {
    ar: 'البريد الإلكتروني',
    en: 'Email Address',
  },
  'profile.appearance': {
    ar: 'المظهر',
    en: 'Appearance',
  },
  'profile.save': {
    ar: 'حفظ التغييرات',
    en: 'Save Changes',
  },
  'profile.saving': {
    ar: 'جاري الحفظ...',
    en: 'Saving...',
  },
  'profile.cancel': {
    ar: 'إلغاء',
    en: 'Cancel',
  },
  'profile.updated': {
    ar: 'تم تحديث الملف الشخصي',
    en: 'Profile updated successfully',
  },
  'profile.picture': {
    ar: 'الصورة الشخصية',
    en: 'Profile Picture',
  },
  'profile.picture.upload': {
    ar: 'تحميل صورة',
    en: 'Upload Picture',
  },
  'profile.picture.change': {
    ar: 'تغيير الصورة',
    en: 'Change Picture',
  },
  'profile.picture.remove': {
    ar: 'إزالة الصورة',
    en: 'Remove Picture',
  },
  'success.profile.picture.update': {
    ar: 'تم تحديث الصورة الشخصية بنجاح',
    en: 'Profile picture updated successfully',
  },
  'error.profile.picture.update': {
    ar: 'فشل تحديث الصورة الشخصية',
    en: 'Failed to update profile picture',
  },
  
  // Configuraciones
  'settings.title': {
    ar: 'الإعدادات',
    en: 'Settings',
  },
  'settings.comingSoon': {
    ar: 'قريبًا... المزيد من الإعدادات',
    en: 'Coming soon... More settings',
  },
  
  // المواصفات التقنية
  'technical.specs': {
    ar: 'المواصفات التقنية',
    en: 'Technical Specifications',
  },
  'architecture.diagram': {
    ar: 'مخطط البنية',
    en: 'Architecture Diagram',
  },
  'security.model': {
    ar: 'نموذج الأمان',
    en: 'Security Model',
  },

  // شريط التنقل للجوال
  'home': {
    ar: 'الرئيسية',
    en: 'Home',
  },
  'new': {
    ar: 'جديد',
    en: 'New',
  },
  'nav.settings': {
    ar: 'الإعدادات',
    en: 'Settings',
  },

  // مفاتيح إضافية
  'search_notes': {
    ar: 'بحث الملاحظات',
    en: 'Search notes',
  },
  'filter': {
    ar: 'تصفية',
    en: 'Filter',
  },
  'close_sidebar': {
    ar: 'إغلاق الشريط الجانبي',
    en: 'Close Sidebar',
  },
  'open_sidebar': {
    ar: 'فتح الشريط الجانبي',
    en: 'Open Sidebar',
  },
  'untitled_note': {
    ar: 'ملاحظة بدون عنوان',
    en: 'Untitled Note',
  },

  // Mind Map
  'mindmap.title': {
    ar: 'خريطة الأفكار',
    en: 'Mind Map',
  },
  'mindmap.zoom_in': {
    ar: 'تكبير',
    en: 'Zoom In',
  },
  'mindmap.zoom_out': {
    ar: 'تصغير',
    en: 'Zoom Out',
  },
  'mindmap.reset_view': {
    ar: 'إعادة ضبط العرض',
    en: 'Reset View',
  },
  'mindmap.create_connection': {
    ar: 'إنشاء رابط',
    en: 'Create Connection',
  },
  'mindmap.cancel_connection': {
    ar: 'إلغاء الربط',
    en: 'Cancel Connection',
  },
  'mindmap.select_target': {
    ar: 'اختر الملاحظة الهدف',
    en: 'Select target note',
  },
  'success.connection.created': {
    ar: 'تم إنشاء الرابط بنجاح',
    en: 'Connection created successfully',
  },
  'success.connection.deleted': {
    ar: 'تم حذف الرابط بنجاح',
    en: 'Connection deleted successfully',
  },
  'error.connection.exists': {
    ar: 'الرابط موجود بالفعل',
    en: 'Connection already exists',
  },
  'error.connection.create': {
    ar: 'فشل إنشاء الرابط',
    en: 'Failed to create connection',
  },
  'error.connection.delete': {
    ar: 'فشل حذف الرابط',
    en: 'Failed to delete connection',
  },
  
  // Tabs
  'tabs.notes': {
    ar: 'الملاحظات',
    en: 'Notes',
  },
  'tabs.mindmap': {
    ar: 'خريطة الأفكار',
    en: 'Mind Map',
  },
  
  // Updated UI elements
  'theme.title': {
    ar: 'المظهر',
    en: 'Theme',
  },
  'language.title': {
    ar: 'اللغة',
    en: 'Language',
  },
  'profile.title': {
    ar: 'الملف الشخصي',
    en: 'Profile',
  },
  'profile.avatar': {
    ar: 'الصورة الشخصية',
    en: 'Profile Picture',
  },
  'auth.create_account_desc': {
    ar: 'أنشئ حسابًا جديدًا لبدء تدوين الملاحظات',
    en: 'Create a new account to start taking notes',
  },
  'auth.welcome_back': {
    ar: 'مرحبًا بعودتك! سجل الدخول للوصول إلى ملاحظاتك',
    en: 'Welcome back! Log in to access your notes',
  },
  'auth.create_password': {
    ar: 'إنشاء كلمة مرور',
    en: 'Create password',
  },
  'auth.enter_password': {
    ar: 'أدخل كلمة المرور',
    en: 'Enter password',
  },
  'auth.email_placeholder': {
    ar: 'البريد الإلكتروني',
    en: 'you@example.com',
  },
  'auth.already_have_account': {
    ar: 'هل لديك حساب بالفعل؟',
    en: 'Already have an account?',
  },
};

export const LanguageContext = createContext<LanguageContextType>({
  language: 'ar',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key: string) => key,
});

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('ar');
  const [loading, setLoading] = useState(true);

  // جلب اللغة المفضلة من Supabase عند تحميل التطبيق
  useEffect(() => {
    const fetchLanguagePreference = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('language')
            .eq('id', user.id)
            .single();
          
          if (data && data.language) {
            setLanguageState(data.language as Language);
          }
        }
      } catch (error) {
        console.error('Error fetching language preference:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLanguagePreference();
  }, []);

  // حفظ تفضيل اللغة في Supabase
  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await supabase
          .from('profiles')
          .update({ language: lang })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // تبديل اللغة
  const toggleLanguage = () => {
    const newLanguage = language === 'ar' ? 'en' : 'ar';
    setLanguage(newLanguage);
  };

  // وظيفة الترجمة
  const t = (key: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    
    // إرجاع المفتاح إذا لم يتم العثور على ترجمة
    return key;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}; 