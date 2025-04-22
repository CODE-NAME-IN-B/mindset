import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Languages } from 'lucide-react';

const LanguageSwitch: React.FC = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center px-2 py-1 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
      title={language === 'ar' ? 'Switch to English' : 'تغيير إلى العربية'}
    >
      <Languages size={18} className="mr-1.5" />
      <span>{language === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  );
};

export default LanguageSwitch; 