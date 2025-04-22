-- التحديثات لجدول الملاحظات (notes) لدعم مزايا Obsidian/Notion
ALTER TABLE public.notes 
  ADD COLUMN IF NOT EXISTS folder_id UUID REFERENCES public.folders(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS has_checkboxes BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS linked_notes TEXT[] DEFAULT '{}'::TEXT[],
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'::TEXT[];

-- إنشاء جدول المجلدات
CREATE TABLE IF NOT EXISTS public.folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- إنشاء فهارس (indexes)
CREATE INDEX IF NOT EXISTS folders_user_id_idx ON public.folders (user_id);
CREATE INDEX IF NOT EXISTS notes_folder_id_idx ON public.notes (folder_id);
CREATE INDEX IF NOT EXISTS notes_tags_idx ON public.notes USING GIN (tags);

-- الأمان على جدول المجلدات
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمجلدات
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own folders') THEN
    CREATE POLICY "Users can view their own folders" 
      ON public.folders 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can create their own folders') THEN
    CREATE POLICY "Users can create their own folders" 
      ON public.folders
      FOR INSERT 
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can update their own folders') THEN
    CREATE POLICY "Users can update their own folders" 
      ON public.folders 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete their own folders') THEN
    CREATE POLICY "Users can delete their own folders" 
      ON public.folders 
      FOR DELETE 
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- جدول مرفقات الملاحظات
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL, -- 'image', 'file', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- فهرس على مرفقات الملاحظات
CREATE INDEX IF NOT EXISTS attachments_note_id_idx ON public.attachments (note_id);

-- الأمان على جدول المرفقات
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للمرفقات
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view their own attachments') THEN
    CREATE POLICY "Users can view their own attachments" 
      ON public.attachments 
      FOR SELECT 
      USING (
        auth.uid() IN (
          SELECT notes.user_id 
          FROM public.notes 
          WHERE notes.id = note_id
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can insert attachments to their notes') THEN
    CREATE POLICY "Users can insert attachments to their notes" 
      ON public.attachments
      FOR INSERT 
      WITH CHECK (
        auth.uid() IN (
          SELECT notes.user_id 
          FROM public.notes 
          WHERE notes.id = note_id
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete attachments from their notes') THEN
    CREATE POLICY "Users can delete attachments from their notes" 
      ON public.attachments 
      FOR DELETE 
      USING (
        auth.uid() IN (
          SELECT notes.user_id 
          FROM public.notes 
          WHERE notes.id = note_id
        )
      );
  END IF;
END
$$;

-- جدول الروابط بين الملاحظات
CREATE TABLE IF NOT EXISTS public.note_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  target_note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(source_note_id, target_note_id)
);

-- فهرس على روابط الملاحظات
CREATE INDEX IF NOT EXISTS note_links_source_note_id_idx ON public.note_links (source_note_id);
CREATE INDEX IF NOT EXISTS note_links_target_note_id_idx ON public.note_links (target_note_id);

-- الأمان على جدول الروابط
ALTER TABLE public.note_links ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للروابط
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can view links to their notes') THEN
    CREATE POLICY "Users can view links to their notes" 
      ON public.note_links 
      FOR SELECT 
      USING (
        auth.uid() IN (
          SELECT notes.user_id 
          FROM public.notes 
          WHERE notes.id = source_note_id OR notes.id = target_note_id
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can create links between their notes') THEN
    CREATE POLICY "Users can create links between their notes" 
      ON public.note_links
      FOR INSERT 
      WITH CHECK (
        auth.uid() IN (
          SELECT notes.user_id 
          FROM public.notes 
          WHERE notes.id = source_note_id
        ) AND 
        auth.uid() IN (
          SELECT notes.user_id 
          FROM public.notes 
          WHERE notes.id = target_note_id
        )
      );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Users can delete links between their notes') THEN
    CREATE POLICY "Users can delete links between their notes" 
      ON public.note_links 
      FOR DELETE 
      USING (
        auth.uid() IN (
          SELECT notes.user_id 
          FROM public.notes 
          WHERE notes.id = source_note_id
        )
      );
  END IF;
END
$$;

-- إنشاء تخزين (bucket) للمرفقات إذا لم يكن موجودًا
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'attachments'
  ) INTO bucket_exists;
  
  IF NOT bucket_exists THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('attachments', 'attachments', true);
  END IF;
END
$$;

-- تطبيق سياسات الأمان على مخزن المرفقات
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Users can view attachments' 
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can view attachments"
      ON storage.objects FOR SELECT
      USING ( bucket_id = 'attachments' );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Users can upload attachments' 
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can upload attachments"
      ON storage.objects FOR INSERT
      WITH CHECK ( bucket_id = 'attachments' AND auth.role() = 'authenticated' );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Users can update their attachments' 
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can update their attachments"
      ON storage.objects FOR UPDATE
      USING ( bucket_id = 'attachments' AND auth.uid() = owner );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policy
    WHERE polname = 'Users can delete their attachments' 
    AND tablename = 'objects'
    AND schemaname = 'storage'
  ) THEN
    CREATE POLICY "Users can delete their attachments"
      ON storage.objects FOR DELETE
      USING ( bucket_id = 'attachments' AND auth.uid() = owner );
  END IF;
END
$$;

-- إنشاء دالة محفزة (trigger) لتحديث حقل updated_at في جدول المجلدات
CREATE OR REPLACE FUNCTION public.update_folder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء المحفز (trigger) على جدول المجلدات
DROP TRIGGER IF EXISTS folders_updated_at ON public.folders;
CREATE TRIGGER folders_updated_at
  BEFORE UPDATE ON public.folders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_folder_updated_at(); 