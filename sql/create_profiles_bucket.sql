-- إنشاء تخزين (bucket) للصور الشخصية
DO $$
DECLARE
  bucket_exists BOOLEAN;
BEGIN
  -- التحقق من وجود المخزن
  SELECT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'profiles'
  ) INTO bucket_exists;
  
  -- إنشاء المخزن إذا لم يكن موجوداً
  IF NOT bucket_exists THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('profiles', 'profiles', true);
    
    RAISE NOTICE 'تم إنشاء مخزن الصور الشخصية بنجاح';
  ELSE
    RAISE NOTICE 'مخزن الصور الشخصية موجود بالفعل';
  END IF;
  
  -- إضافة سياسات الأمان على المخزن
  
  -- حذف السياسات القديمة إذا كانت موجودة
  DROP POLICY IF EXISTS "Users can view profile pictures" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their profile pictures" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their profile pictures" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their profile pictures" ON storage.objects;
  
  -- إنشاء سياسات جديدة
  CREATE POLICY "Users can view profile pictures"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'profiles');
  
  CREATE POLICY "Users can upload their profile pictures"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'profiles' AND auth.role() = 'authenticated');
  
  CREATE POLICY "Users can update their profile pictures"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'profiles' AND (auth.uid() = owner OR owner IS NULL));
  
  CREATE POLICY "Users can delete their profile pictures"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'profiles' AND (auth.uid() = owner OR owner IS NULL));
  
  RAISE NOTICE 'تم تطبيق سياسات الأمان على مخزن الصور الشخصية';
END
$$; 