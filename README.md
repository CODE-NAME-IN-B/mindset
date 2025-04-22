# تطبيق المذكرات الذكي (Mindset)

تطبيق المذكرات الذكي هو تطبيق ويب مبني باستخدام React و TypeScript و Supabase. يمكن للمستخدمين تسجيل الدخول وإنشاء وتعديل وعرض ملاحظاتهم الخاصة، مع وجود مزايا متقدمة مشابهة لتطبيقي Obsidian وNotion.

## المميزات

- واجهة مستخدم متعددة اللغات (العربية والإنجليزية)
- نظام مصادقة آمن (تسجيل دخول / إنشاء حساب)
- إنشاء وتحرير وحذف الملاحظات
- دعم تنسيق Markdown للملاحظات
- تنظيم الملاحظات في مجلدات
- إضافة علامات (tags) للملاحظات
- إمكانية ربط الملاحظات ببعضها البعض
- رفع وإدراج الصور في الملاحظات
- إضافة ملاحظات للمفضلة
- وضع مظلم / نهاري
- تخزين البيانات بأمان في Supabase
- عرض قائمة أو شبكي للملاحظات
- تصميم متوافق مع الأجهزة المحمولة

## متطلبات التثبيت

- Node.js (v16 أو أحدث)
- حساب Supabase (مجاني)

## خطوات الإعداد

### 1. إعداد Supabase

1. قم بإنشاء حساب وproject جديد في [Supabase](https://supabase.com/)
2. انسخ مفاتيح API من صفحة Settings > API في لوحة التحكم
3. قم بتشغيل ملفات الترحيل SQL في محرر SQL في لوحة تحكم Supabase:

يمكنك تشغيل ملفات الترحيل بإحدى الطريقتين:

#### أ. باستخدام واجهة Supabase

1. انتقل إلى محرر SQL في لوحة تحكم Supabase
2. انتقل إلى مجلد `supabase/migrations` في المشروع
3. قم بتشغيل الملفات بالترتيب التالي:
   - `20242507_create_profiles_table.sql` (إنشاء جدول الملفات الشخصية)
   - `20250501000000_setup_notes_folders.sql` (إنشاء جداول الملاحظات والمجلدات)

#### ب. باستخدام Supabase CLI (للمتقدمين)

إذا كان لديك Supabase CLI مثبتاً ومهيئاً، يمكنك تشغيل الأمر:

```bash
supabase db push
```

### 2. إعداد المشروع المحلي

1. قم بنسخ ملف `.env` وتحديث المتغيرات البيئية:

```
VITE_SUPABASE_URL=<رابط_مشروع_Supabase_الخاص_بك>
VITE_SUPABASE_ANON_KEY=<مفتاح_API_الخاص_بك>
```

2. قم بتثبيت التبعيات:

```bash
npm install
```

3. قم بتشغيل التطبيق:

```bash
npm run dev
```

4. افتح المتصفح على العنوان `http://localhost:5173`

## الاستخدام

1. قم بإنشاء حساب أو تسجيل الدخول
2. استخدم زر تغيير اللغة للتبديل بين العربية والإنجليزية
3. استخدم زر "ملاحظة جديدة" لإنشاء ملاحظات جديدة
4. أضف علامات للملاحظة عبر حقل إضافة العلامات
5. اختر مجلدًا للملاحظة أو أنشئ مجلدًا جديدًا
6. استخدم تنسيق Markdown في كتابة محتوى الملاحظة
7. يمكنك إضافة صور للملاحظة باستخدام زر إضافة الصورة
8. يمكنك ربط الملاحظات ببعضها عبر استخدام الصيغة `[[اسم الملاحظة]]`
9. استخدم زر العرض لتبديل طريقة عرض الملاحظات (قائمة أو شبكة)
10. استخدم زر النجمة لإضافة الملاحظة للمفضلة أو استخدم زر تصفية المفضلة لعرضها فقط
11. استخدم زر تبديل الوضع المظلم/الفاتح لتغيير مظهر التطبيق

## استكشاف الأخطاء وإصلاحها

### خطأ "relation 'public.profiles' does not exist" أو "relation 'public.folders' does not exist"

إذا ظهرت هذه الرسالة، فهذا يعني أن جداول قاعدة البيانات غير موجودة:

1. انتقل إلى لوحة تحكم Supabase الخاصة بك
2. افتح SQL Editor من القائمة اليسرى
3. انتقل إلى مجلد `supabase/migrations` في المشروع
4. قم بتشغيل ملف `20250501000000_setup_notes_folders.sql` في محرر SQL
5. عد إلى التطبيق وقم بتحديث الصفحة

### استخدام ميزات Markdown

يدعم التطبيق ميزات Markdown الأساسية مثل:
- العناوين `# عنوان كبير` و `## عنوان فرعي`
- النص الغامق **نص غامق** باستخدام `**نص غامق**`
- النص المائل *نص مائل* باستخدام `*نص مائل*`
- القوائم النقطية باستخدام `- عنصر في القائمة`
- قوائم المهام باستخدام `- [ ] مهمة غير مكتملة` و `- [x] مهمة مكتملة`
- الروابط باستخدام `[نص الرابط](https://example.com)`
- الصور باستخدام `![وصف الصورة](رابط الصورة)`
- روابط الملاحظات باستخدام `[[اسم الملاحظة]]`

## المساهمة

نرحب بمساهماتكم! يرجى إرسال Pull Requests أو فتح Issues للمناقشة.

## ترخيص

MIT 

## Database Setup

You need to create the following tables in your Supabase project:

1. **Profiles Table** - Stores user profile information
2. **Notes Table** - Stores user notes
3. **Folders Table** - Stores note folders
4. **Attachments Table** - Stores note attachments like images and files

### Setting up the Profiles Table

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  language TEXT DEFAULT 'ar',
  dark_mode BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read only their own profile
CREATE POLICY "Users can view their own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Create policy to allow users to create their own profile
CREATE POLICY "Users can create their own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Create policy to allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id);
```

### Setting up the Attachments Table

In the SQL Editor in your Supabase dashboard, execute the following SQL to create the attachments table:

```sql
-- Create attachments table
CREATE TABLE IF NOT EXISTS public.attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'file')),
  note_id UUID NOT NULL REFERENCES public.notes(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up Row Level Security
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view their own attachments
CREATE POLICY "Users can view their own attachments" 
  ON public.attachments 
  FOR SELECT 
  USING (
    auth.uid() IN (
      SELECT user_id FROM notes WHERE id = note_id
    )
  );

-- Create policy to allow users to insert their own attachments
CREATE POLICY "Users can insert their own attachments" 
  ON public.attachments 
  FOR INSERT 
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM notes WHERE id = note_id
    )
  );

-- Create policy to allow users to update their own attachments
CREATE POLICY "Users can update their own attachments" 
  ON public.attachments 
  FOR UPDATE 
  USING (
    auth.uid() IN (
      SELECT user_id FROM notes WHERE id = note_id
    )
  );

-- Create policy to allow users to delete their own attachments
CREATE POLICY "Users can delete their own attachments" 
  ON public.attachments 
  FOR DELETE 
  USING (
    auth.uid() IN (
      SELECT user_id FROM notes WHERE id = note_id
    )
  );
```

### Create the updated_at trigger function

If you haven't already, create the function to handle updating the updated_at timestamp:

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to all tables that have updated_at column
CREATE TRIGGER attachments_updated_at
  BEFORE UPDATE ON public.attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at(); 