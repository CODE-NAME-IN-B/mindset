-- إنشاء المستندات التقنية مباشرة كملاحظات
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- الحصول على معرف أول مستخدم في النظام
  SELECT id INTO admin_user_id FROM auth.users LIMIT 1;
  
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'لا يوجد مستخدمين في النظام';
  END IF;
  
  RAISE NOTICE 'تم العثور على معرف المستخدم: %', admin_user_id;
  
  -- إنشاء المواصفات التقنية
  INSERT INTO notes (
    title, 
    content, 
    user_id, 
    created_at, 
    updated_at
  )
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
- **محرر النصوص**: دعم Markdown باستخدام @uiw/react-md-editor
- **مكتبات إضافية**:
  - react-hot-toast لإشعارات النظام
  - lucide-react للرموز والأيقونات
  - rehype-sanitize لتطهير HTML',
    admin_user_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- إنشاء مخطط البنية
  INSERT INTO notes (
    title, 
    content, 
    user_id, 
    created_at, 
    updated_at
  )
  VALUES (
    'مخطط البنية',
    '# مخطط البنية لتطبيق مايندست (Mindset)

## نظرة عامة على البنية

تطبيق مايندست مبني باستخدام هيكلية تطبيق الصفحة الواحدة (SPA) ويعتمد على React للواجهة الأمامية وSupabase للواجهة الخلفية. يتبع نمط تصميم قائم على المكونات مع فصل واضح للمسؤوليات.',
    admin_user_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  -- إنشاء نموذج الأمان
  INSERT INTO notes (
    title, 
    content, 
    user_id, 
    created_at, 
    updated_at
  )
  VALUES (
    'نموذج الأمان',
    '# نموذج الأمان لتطبيق مايندست (Mindset)

## نظرة عامة على الأمان

يتبع تطبيق مايندست نموذج أمان شامل يغطي جوانب متعددة من حماية البيانات والخصوصية، مبني على مبادئ الأمان بالتصميم. يستفيد التطبيق من قدرات الأمان المتقدمة التي توفرها منصة Supabase مع تعزيزات إضافية على مستوى التطبيق.',
    admin_user_id,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RAISE NOTICE 'تم إنشاء الملفات التقنية بنجاح كملاحظات للمستخدم';
END $$; 