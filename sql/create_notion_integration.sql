-- إنشاء جدول لتخزين تكاملات Notion الخاصة بالمستخدمين
CREATE TABLE IF NOT EXISTS public.notion_integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  workspace_name TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, workspace_id)
);

-- إنشاء فهرس لتحسين أداء البحث
CREATE INDEX IF NOT EXISTS notion_integrations_user_id_idx ON public.notion_integrations (user_id);

-- تمكين أمان على مستوى الصف
ALTER TABLE public.notion_integrations ENABLE ROW LEVEL SECURITY;

-- إضافة سياسات الوصول
-- المستخدمون يمكنهم عرض تكاملات Notion الخاصة بهم فقط
CREATE POLICY "Users can view their own Notion integrations" 
  ON public.notion_integrations 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إنشاء تكاملات Notion خاصة بهم فقط
CREATE POLICY "Users can create their own Notion integrations" 
  ON public.notion_integrations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- المستخدمون يمكنهم تحديث تكاملات Notion الخاصة بهم فقط
CREATE POLICY "Users can update their own Notion integrations" 
  ON public.notion_integrations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- المستخدمون يمكنهم حذف تكاملات Notion الخاصة بهم فقط
CREATE POLICY "Users can delete their own Notion integrations" 
  ON public.notion_integrations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- إنشاء دالة تحديث timestamp الخاص بالتحديث
CREATE OR REPLACE FUNCTION public.handle_notion_integration_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث timestamp عند تحديث السجل
CREATE TRIGGER notion_integrations_updated_at
  BEFORE UPDATE ON public.notion_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_notion_integration_updated_at();

-- إنشاء جدول لتخزين خريطة تحويل صفحات Notion إلى ملاحظات
CREATE TABLE IF NOT EXISTS public.notion_page_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notion_page_id TEXT NOT NULL,
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
  last_sync TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE (user_id, notion_page_id)
);

-- إنشاء فهرس لتحسين أداء البحث
CREATE INDEX IF NOT EXISTS notion_page_mappings_user_id_idx ON public.notion_page_mappings (user_id);
CREATE INDEX IF NOT EXISTS notion_page_mappings_note_id_idx ON public.notion_page_mappings (note_id);

-- تمكين أمان على مستوى الصف
ALTER TABLE public.notion_page_mappings ENABLE ROW LEVEL SECURITY;

-- إضافة سياسات الوصول
-- المستخدمون يمكنهم عرض خرائط تحويل صفحات Notion الخاصة بهم فقط
CREATE POLICY "Users can view their own Notion page mappings" 
  ON public.notion_page_mappings 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إنشاء خرائط تحويل صفحات Notion خاصة بهم فقط
CREATE POLICY "Users can create their own Notion page mappings" 
  ON public.notion_page_mappings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- المستخدمون يمكنهم تحديث خرائط تحويل صفحات Notion الخاصة بهم فقط
CREATE POLICY "Users can update their own Notion page mappings" 
  ON public.notion_page_mappings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- المستخدمون يمكنهم حذف خرائط تحويل صفحات Notion الخاصة بهم فقط
CREATE POLICY "Users can delete their own Notion page mappings" 
  ON public.notion_page_mappings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- إنشاء دالة تحديث timestamp الخاص بالتحديث
CREATE OR REPLACE FUNCTION public.handle_notion_page_mapping_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث timestamp عند تحديث السجل
CREATE TRIGGER notion_page_mappings_updated_at
  BEFORE UPDATE ON public.notion_page_mappings
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_notion_page_mapping_updated_at(); 