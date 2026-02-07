-- 신규 가입 시 플랜 크레딧을 5로 정확히 설정하도록 트리거 수정
CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  free_plan_id UUID;
  plan_ai_credits INTEGER;
  plan_resume_credits INTEGER;
BEGIN
  -- Get the free plan ID and credits
  SELECT id, ai_credits, resume_credits 
  INTO free_plan_id, plan_ai_credits, plan_resume_credits 
  FROM public.plans 
  WHERE name = 'free' 
  LIMIT 1;
  
  -- Create subscription with free plan and proper credits (default 5 if null)
  IF free_plan_id IS NOT NULL THEN
    INSERT INTO public.user_subscriptions (
      user_id, 
      plan_id, 
      ai_credits_remaining,
      ai_credits_used,
      resume_credits_remaining,
      resume_credits_used
    )
    VALUES (
      NEW.id, 
      free_plan_id, 
      COALESCE(plan_ai_credits, 5),
      0,
      COALESCE(plan_resume_credits, 5),
      0
    );
  END IF;
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;