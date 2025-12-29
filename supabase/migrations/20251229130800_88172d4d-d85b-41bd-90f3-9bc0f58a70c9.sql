-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for role-based access control
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check user roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create plans table
CREATE TABLE public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    price INTEGER NOT NULL DEFAULT 0, -- in KRW
    job_limit INTEGER NOT NULL DEFAULT 3,
    ai_credits INTEGER NOT NULL DEFAULT 0,
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans"
ON public.plans
FOR SELECT
USING (is_active = true);

-- Insert default plans
INSERT INTO public.plans (name, display_name, price, job_limit, ai_credits, features) VALUES
('free', 'Free', 0, 3, 0, '["공고 3개", "AI 미리보기"]'::jsonb),
('starter', 'Starter', 19000, 999999, 100, '["AI 크레딧 100"]'::jsonb),
('pro', 'Pro', 39000, 999999, 300, '["AI 크레딧 300"]'::jsonb);

-- Create user_subscriptions table
CREATE TABLE public.user_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan_id UUID REFERENCES public.plans(id) NOT NULL,
    ai_credits_remaining INTEGER NOT NULL DEFAULT 0,
    ai_credits_used INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.user_subscriptions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create job_postings table
CREATE TABLE public.job_postings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    title TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'reviewing',
    priority INTEGER NOT NULL DEFAULT 0,
    position TEXT NOT NULL,
    min_experience TEXT,
    min_experience_evidence TEXT,
    work_type TEXT,
    work_type_evidence TEXT,
    location TEXT,
    location_evidence TEXT,
    visa_sponsorship BOOLEAN,
    visa_sponsorship_evidence TEXT,
    summary TEXT,
    company_score NUMERIC,
    fit_score NUMERIC,
    minimum_requirements_check JSONB,
    company_criteria_scores JSONB DEFAULT '[]'::jsonb,
    key_competencies JSONB DEFAULT '[]'::jsonb,
    source_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own job postings"
ON public.job_postings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own job postings"
ON public.job_postings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job postings"
ON public.job_postings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job postings"
ON public.job_postings FOR DELETE USING (auth.uid() = user_id);

-- Create experiences table
CREATE TABLE public.experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('work', 'project')),
    title TEXT NOT NULL,
    company TEXT,
    period TEXT,
    description TEXT NOT NULL,
    bullets JSONB DEFAULT '[]'::jsonb,
    used_in_postings JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own experiences"
ON public.experiences FOR ALL USING (auth.uid() = user_id);

-- Create resumes table
CREATE TABLE public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    parse_status TEXT NOT NULL DEFAULT 'pending',
    parse_error TEXT,
    extracted_text TEXT,
    ocr_text TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    parsed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own resumes"
ON public.resumes FOR ALL USING (auth.uid() = user_id);

-- Create tailored_resumes table
CREATE TABLE public.tailored_resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE CASCADE NOT NULL,
    company_name TEXT NOT NULL,
    job_title TEXT NOT NULL,
    content TEXT NOT NULL,
    ai_feedback TEXT,
    language TEXT NOT NULL CHECK (language IN ('ko', 'en')),
    format TEXT NOT NULL CHECK (format IN ('consulting', 'narrative')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.tailored_resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own tailored resumes"
ON public.tailored_resumes FOR ALL USING (auth.uid() = user_id);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    job_posting_id UUID REFERENCES public.job_postings(id) ON DELETE SET NULL,
    is_processing BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own chat messages"
ON public.chat_messages FOR ALL USING (auth.uid() = user_id);

-- Create career_goals table
CREATE TABLE public.career_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('immediate', 'short-term', 'long-term')),
    reason TEXT NOT NULL,
    career_path TEXT,
    result TEXT,
    search_period TEXT,
    company_eval_criteria JSONB DEFAULT '[]'::jsonb,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    end_date TIMESTAMP WITH TIME ZONE,
    is_archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.career_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own career goals"
ON public.career_goals FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at columns
CREATE TRIGGER update_job_postings_updated_at
BEFORE UPDATE ON public.job_postings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tailored_resumes_updated_at
BEFORE UPDATE ON public.tailored_resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_career_goals_updated_at
BEFORE UPDATE ON public.career_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at
BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize new user with free plan
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  free_plan_id UUID;
BEGIN
  -- Get the free plan ID
  SELECT id INTO free_plan_id FROM public.plans WHERE name = 'free' LIMIT 1;
  
  -- Create subscription with free plan
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (user_id, plan_id, ai_credits_remaining)
    VALUES (NEW.id, free_plan_id, 0);
  END IF;
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create subscription and role for new users
CREATE TRIGGER on_auth_user_created_subscription
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user_subscription();