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

-- Add trigger for updated_at timestamp
CREATE TRIGGER attachments_updated_at
  BEFORE UPDATE ON public.attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Add trigger to check access permission for attachments
CREATE OR REPLACE FUNCTION public.check_attachment_belongs_to_user()
RETURNS TRIGGER AS $$
BEGIN
  IF (
    EXISTS (
      SELECT 1 FROM notes n
      WHERE n.id = NEW.note_id
      AND n.user_id = auth.uid()
    )
  ) THEN
    RETURN NEW;
  ELSE
    RAISE EXCEPTION 'Access denied. This attachment does not belong to you.';
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_attachment_belongs_to_user
  BEFORE INSERT OR UPDATE ON public.attachments
  FOR EACH ROW
  EXECUTE FUNCTION public.check_attachment_belongs_to_user(); 