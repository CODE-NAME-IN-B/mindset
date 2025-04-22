-- إنشاء سجلات الملفات التقنية
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- الحصول على معرف مستخدم المسؤول
  SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'No users found in the database';
  END IF;
  
  -- إنشاء جدول نماذج النظام إذا لم يكن موجودًا
  CREATE TABLE IF NOT EXISTS public.system_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    template_key TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
  );

  -- تمكين أمان على مستوى الصف
  ALTER TABLE public.system_templates ENABLE ROW LEVEL SECURITY;
  
  -- حذف السياسات القديمة إذا كانت موجودة (للتأكد من عدم وجود تضارب)
  DROP POLICY IF EXISTS "Administrators can manage system templates" ON public.system_templates;
  DROP POLICY IF EXISTS "All users can read system templates" ON public.system_templates;
  
  -- إنشاء سياسات جديدة
  CREATE POLICY "Administrators can manage system templates" 
    ON public.system_templates
    USING (auth.uid() IN (SELECT id FROM auth.users WHERE is_super_admin = true))
    WITH CHECK (auth.uid() IN (SELECT id FROM auth.users WHERE is_super_admin = true));
  
  CREATE POLICY "All users can read system templates" 
    ON public.system_templates
    FOR SELECT 
    USING (true);
  
  -- إدخال المواصفات التقنية
  INSERT INTO public.system_templates (title, content, template_key)
  VALUES (
    'المواصفات التقنية',
    '# المواصفات التقنية لتطبيق مايندست (Mindset)

## نظرة عامة
تطبيق مايندست هو تطبيق ويب للملاحظات وتنظيم الأفكار، يسمح للمستخدمين بإنشاء وتحرير وتنظيم الملاحظات مع مجموعة غنية من الميزات مثل دعم Markdown، التنظيم في مجلدات، العلامات، والروابط بين الملاحظات.

## المتطلبات الفنية

### الواجهة الأمامية (Frontend)
- **إطار العمل**: React 18+
- **لغة البرمجة**: TypeScript 5.0+
- **إدارة الحالة**: React Context API
- **التنسيق**: TailwindCSS 3.3+
- **واجهة المستخدم**: مكونات مخصصة مع تصميم متجاوب
- **محرر النصوص**: دعم Markdown باستخدام @uiw/react-md-editor',
    'technical_specs'
  ) ON CONFLICT (template_key) DO UPDATE 
    SET content = EXCLUDED.content, 
        title = EXCLUDED.title,
        updated_at = NOW();
  
  -- إدخال مخطط البنية
  INSERT INTO public.system_templates (title, content, template_key)
  VALUES (
    'مخطط البنية',
    '# مخطط البنية لتطبيق مايندست (Mindset)

## نظرة عامة على البنية

تطبيق مايندست مبني باستخدام هيكلية تطبيق الصفحة الواحدة (SPA) ويعتمد على React للواجهة الأمامية وSupabase للواجهة الخلفية. يتبع نمط تصميم قائم على المكونات مع فصل واضح للمسؤوليات.',
    'architecture_diagram'
  ) ON CONFLICT (template_key) DO UPDATE 
    SET content = EXCLUDED.content, 
        title = EXCLUDED.title,
        updated_at = NOW();
  
  -- إدخال نموذج الأمان
  INSERT INTO public.system_templates (title, content, template_key)
  VALUES (
    'نموذج الأمان',
    '# نموذج الأمان لتطبيق مايندست (Mindset)

## نظرة عامة على الأمان

يتبع تطبيق مايندست نموذج أمان شامل يغطي جوانب متعددة من حماية البيانات والخصوصية، مبني على مبادئ الأمان بالتصميم. يستفيد التطبيق من قدرات الأمان المتقدمة التي توفرها منصة Supabase مع تعزيزات إضافية على مستوى التطبيق.',
    'security_model'
  ) ON CONFLICT (template_key) DO UPDATE 
    SET content = EXCLUDED.content, 
        title = EXCLUDED.title,
        updated_at = NOW();
  
  -- إنشاء الملاحظات من القوالب
  INSERT INTO notes (
    title, 
    content, 
    user_id, 
    created_at, 
    updated_at
  )
  SELECT 
    t.title,
    t.content,
    admin_user_id,
    NOW(),
    NOW()
  FROM system_templates t
  WHERE t.template_key IN ('technical_specs', 'architecture_diagram', 'security_model')
  AND NOT EXISTS (
    SELECT 1 FROM notes n 
    WHERE n.title = t.title AND n.user_id = admin_user_id
  );
  
  RAISE NOTICE 'تم إنشاء الملفات التقنية بنجاح';
END $$; 