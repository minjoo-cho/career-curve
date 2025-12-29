-- Update handle_new_user function to save name_ko and name_en from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, name_ko, name_en)
  VALUES (
    new.id, 
    COALESCE(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'name_ko',
      new.raw_user_meta_data ->> 'name_en',
      new.email,
      new.phone,
      '사용자'
    ),
    new.raw_user_meta_data ->> 'name_ko',
    new.raw_user_meta_data ->> 'name_en'
  );
  RETURN new;
END;
$$;