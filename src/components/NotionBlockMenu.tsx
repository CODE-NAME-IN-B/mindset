import React, { useState, useRef, useEffect } from 'react';
import { 
  Text, Type, Heading1, Heading2, Heading3, 
  CheckSquare, Image, File, Quote, List, 
  ListOrdered, Table, Code, ChevronDown, Plus 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface NotionBlockMenuProps {
  position: { x: number; y: number };
  onSelect: (blockType: string) => void;
  onClose: () => void;
}

const NotionBlockMenu: React.FC<NotionBlockMenuProps> = ({ position, onSelect, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';

  const blockTypes = [
    { id: 'text', icon: <Text size={16} />, label: t('blocks.text'), description: t('blocks.text.desc') },
    { id: 'heading1', icon: <Heading1 size={16} />, label: t('blocks.heading1'), description: t('blocks.heading1.desc') },
    { id: 'heading2', icon: <Heading2 size={16} />, label: t('blocks.heading2'), description: t('blocks.heading2.desc') },
    { id: 'heading3', icon: <Heading3 size={16} />, label: t('blocks.heading3'), description: t('blocks.heading3.desc') },
    { id: 'todo', icon: <CheckSquare size={16} />, label: t('blocks.todo'), description: t('blocks.todo.desc') },
    { id: 'bulleted-list', icon: <List size={16} />, label: t('blocks.bullet'), description: t('blocks.bullet.desc') },
    { id: 'numbered-list', icon: <ListOrdered size={16} />, label: t('blocks.number'), description: t('blocks.number.desc') },
    { id: 'toggle', icon: <ChevronDown size={16} />, label: t('blocks.toggle'), description: t('blocks.toggle.desc') },
    { id: 'quote', icon: <Quote size={16} />, label: t('blocks.quote'), description: t('blocks.quote.desc') },
    { id: 'divider', icon: <Type size={16} />, label: t('blocks.divider'), description: t('blocks.divider.desc') },
    { id: 'image', icon: <Image size={16} />, label: t('blocks.image'), description: t('blocks.image.desc') },
    { id: 'file', icon: <File size={16} />, label: t('blocks.file'), description: t('blocks.file.desc') },
    { id: 'code', icon: <Code size={16} />, label: t('blocks.code'), description: t('blocks.code.desc') },
    { id: 'table', icon: <Table size={16} />, label: t('blocks.table'), description: t('blocks.table.desc') },
  ];

  // تصفية أنواع البلوكات بناءً على مصطلح البحث
  const filteredBlockTypes = blockTypes.filter(
    blockType => 
      blockType.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      blockType.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // استمع لأحداث النقر خارج القائمة لإغلاقها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // استمع لضغطات المفاتيح للتنقل وإغلاق القائمة
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div 
      className="notion-template-menu" 
      style={{ 
        top: position.y, 
        left: position.x 
      }}
      ref={menuRef}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className="px-2 py-1">
        <input
          type="text"
          className="w-full px-2 py-1 bg-transparent border border-gray-200 dark:border-gray-700 rounded text-sm focus:outline-none focus:border-blue-500"
          placeholder={t('blocks.search')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          autoFocus
        />
      </div>
      <div className="max-h-64 overflow-y-auto">
        {filteredBlockTypes.map((blockType) => (
          <div
            key={blockType.id}
            className="notion-template-menu-item"
            onClick={() => onSelect(blockType.id)}
          >
            <div className="notion-template-menu-item-icon">
              {blockType.icon}
            </div>
            <div>
              <div>{blockType.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {blockType.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotionBlockMenu; 