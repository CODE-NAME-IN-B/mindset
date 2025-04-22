export interface FileType {
  id: string;
  name: string;
  type: 'document' | 'folder' | 'image';
  content?: string;
  created?: Date;
  modified?: Date;
  tags?: string[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Link {
  id: string;
  sourceId: string;
  targetId: string;
  context?: string;
}

export interface EncryptedData {
  iv: number[];
  data: number[];
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  content: string;
  timestamp: number;
  author?: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_favorite?: boolean;
  tags?: string[];
  folder_id?: string | null;
  has_checkboxes?: boolean;
  linked_notes?: string[];
  attachments?: Attachment[];
}

export interface Folder {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  parent_id?: string | null;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: 'image' | 'file';
  note_id: string;
  created_at: string;
}

export interface NoteLink {
  id: string;
  source_note_id: string;
  target_note_id: string;
  created_at: string;
}