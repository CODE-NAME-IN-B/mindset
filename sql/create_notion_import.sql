-- إنشاء جدول لتخزين عمليات استيراد Notion
CREATE TABLE IF NOT EXISTS public.notion_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  import_date TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  source_data JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  notes_imported INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- إنشاء فهرس لتحسين أداء البحث
CREATE INDEX IF NOT EXISTS notion_imports_user_id_idx ON public.notion_imports (user_id);
CREATE INDEX IF NOT EXISTS notion_imports_status_idx ON public.notion_imports (status);

-- تمكين أمان على مستوى الصف
ALTER TABLE public.notion_imports ENABLE ROW LEVEL SECURITY;

-- إضافة سياسات الوصول
-- المستخدمون يمكنهم عرض عمليات الاستيراد الخاصة بهم فقط
CREATE POLICY "Users can view their own imports" 
  ON public.notion_imports 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- المستخدمون يمكنهم إنشاء عمليات استيراد خاصة بهم فقط
CREATE POLICY "Users can create their own imports" 
  ON public.notion_imports 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- المستخدمون يمكنهم تحديث عمليات الاستيراد الخاصة بهم فقط
CREATE POLICY "Users can update their own imports" 
  ON public.notion_imports 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- المستخدمون يمكنهم حذف عمليات الاستيراد الخاصة بهم فقط
CREATE POLICY "Users can delete their own imports" 
  ON public.notion_imports 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- إنشاء دالة تحديث timestamp الخاص بالتحديث
CREATE OR REPLACE FUNCTION public.handle_notion_import_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إنشاء trigger لتحديث timestamp عند تحديث السجل
CREATE TRIGGER notion_imports_updated_at
  BEFORE UPDATE ON public.notion_imports
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_notion_import_updated_at();

-- إضافة وظيفة لاستيراد بيانات من Notion
-- ملاحظة: هذه الوظيفة هي مجرد تمثيل، وسيتم تنفيذ المنطق الفعلي في التطبيق
CREATE OR REPLACE FUNCTION public.process_notion_import(import_id UUID)
RETURNS SETOF public.notion_imports AS $$
BEGIN
  -- تحديث حالة الاستيراد إلى "جاري المعالجة"
  UPDATE public.notion_imports 
  SET status = 'processing', updated_at = now()
  WHERE id = import_id;
  
  -- لاحقاً سيتم هنا إضافة المنطق الخاص بتحويل البيانات من Notion إلى ملاحظات
  -- هذا سيتم تنفيذه في التطبيق، وليس كدالة SQL
  
  -- تحديث حالة الاستيراد إلى "مكتمل"
  UPDATE public.notion_imports 
  SET status = 'completed', updated_at = now()
  WHERE id = import_id;
  
  RETURN QUERY SELECT * FROM public.notion_imports WHERE id = import_id;
END;
$$ LANGUAGE plpgsql; 