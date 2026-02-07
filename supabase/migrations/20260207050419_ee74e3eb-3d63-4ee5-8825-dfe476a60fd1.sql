-- Update plans with new pricing structure
-- Free: 5 AI credits (공고 분석, 적합도 분석, 맞춤 이력서 생성 모두 포함)
-- Starter: 9,900원, 25 AI credits  
-- Pro: 14,900원, 50 AI credits

UPDATE plans 
SET 
  ai_credits = 5,
  resume_credits = 5,
  display_name = 'Free',
  job_limit = 999999
WHERE name = 'free';

UPDATE plans 
SET 
  price = 9900,
  ai_credits = 25,
  resume_credits = 25,
  display_name = 'Starter',
  job_limit = 999999
WHERE name = 'starter';

UPDATE plans 
SET 
  price = 14900,
  ai_credits = 50,
  resume_credits = 50,
  display_name = 'Pro',
  job_limit = 999999
WHERE name = 'pro';