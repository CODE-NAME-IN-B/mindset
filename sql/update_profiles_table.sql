-- تحديث جدول profiles لإضافة عمود avatar_url إذا لم يكن موجوداً
DO $$
BEGIN
  -- التحقق من وجود عمود avatar_url
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'avatar_url'
  ) THEN
    -- إضافة عمود avatar_url
    ALTER TABLE public.profiles
    ADD COLUMN avatar_url TEXT;
    
    RAISE NOTICE 'تم إضافة عمود avatar_url إلى جدول profiles بنجاح';
  ELSE
    RAISE NOTICE 'عمود avatar_url موجود بالفعل في جدول profiles';
  END IF;
END
$$; 