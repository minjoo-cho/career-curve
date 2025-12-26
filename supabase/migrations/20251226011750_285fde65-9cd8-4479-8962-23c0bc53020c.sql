-- Fix handle_new_user function to handle phone sign-ups (no email, no name)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, name)
  VALUES (
    new.id, 
    COALESCE(
      new.raw_user_meta_data ->> 'name',
      new.email,
      new.phone,
      '사용자'
    )
  );
  RETURN new;
END;
$function$;