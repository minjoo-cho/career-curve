-- Create custom_statuses table for user-defined board statuses
CREATE TABLE public.custom_statuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'muted',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.custom_statuses ENABLE ROW LEVEL SECURITY;

-- Create policy for user access
CREATE POLICY "Users can manage their own custom statuses"
ON public.custom_statuses
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add unique constraint per user for status name
CREATE UNIQUE INDEX idx_custom_statuses_user_name ON public.custom_statuses (user_id, name);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_custom_statuses_updated_at
BEFORE UPDATE ON public.custom_statuses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();