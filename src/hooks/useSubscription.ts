import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Plan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  jobLimit: number;
  aiCredits: number; // AI 분석 크레딧 (analyze-job, evaluate-fit)
  resumeCredits: number; // 맞춤 이력서 생성 크레딧
  features: string[];
}

export interface Subscription {
  id: string;
  planId: string;
  planName: string;
  planDisplayName: string;
  aiCreditsRemaining: number; // AI 분석 크레딧 잔여
  aiCreditsUsed: number;
  resumeCreditsRemaining: number; // 이력서 생성 크레딧 잔여
  resumeCreditsUsed: number;
  jobLimit: number;
  phoneVerified: boolean;
  phoneVerifiedAt?: Date;
  startedAt: Date;
  expiresAt?: Date;
}

export function useSubscription() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);

  // SECURITY: Reset subscription data immediately when user changes or logs out
  useEffect(() => {
    if (!user) {
      setSubscription(null);
      setPlans([]);
      setIsLoading(false);
    }
  }, [user]);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch all plans
      const { data: plansData, error: plansError } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (plansError) throw plansError;

      setPlans((plansData || []).map(p => ({
        id: p.id,
        name: p.name,
        displayName: p.display_name,
        price: p.price,
        jobLimit: p.job_limit,
        aiCredits: p.ai_credits,
        resumeCredits: (p as any).resume_credits || 0,
        features: (p.features as string[]) || [],
      })));

      // Fetch user subscription
      const { data: subData, error: subError } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plans (
            name,
            display_name,
            job_limit,
            ai_credits,
            resume_credits
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      if (subError) throw subError;

      if (subData && subData.plans) {
        const plan = subData.plans as any;
        setSubscription({
          id: subData.id,
          planId: subData.plan_id,
          planName: plan.name,
          planDisplayName: plan.display_name,
          aiCreditsRemaining: subData.ai_credits_remaining,
          aiCreditsUsed: subData.ai_credits_used,
          resumeCreditsRemaining: (subData as any).resume_credits_remaining || 0,
          resumeCreditsUsed: (subData as any).resume_credits_used || 0,
          jobLimit: plan.job_limit,
          phoneVerified: (subData as any).phone_verified || false,
          phoneVerifiedAt: (subData as any).phone_verified_at ? new Date((subData as any).phone_verified_at) : undefined,
          startedAt: new Date(subData.started_at),
          expiresAt: subData.expires_at ? new Date(subData.expires_at) : undefined,
        });
      } else {
        // No subscription found, this shouldn't happen as trigger should create one
        setSubscription(null);
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Check if user can add more jobs - no job limit enforced
  const canAddJob = useCallback((currentJobCount: number) => {
    return true; // No job limit
  }, []);

  // Check if user has AI credits
  const hasAiCredits = useCallback(() => {
    if (!subscription) return false;
    return subscription.aiCreditsRemaining > 0;
  }, [subscription]);

  // Check if user has resume generation credits (uses same credits as AI now)
  const hasResumeCredits = useCallback(() => {
    if (!subscription) return false;
    return subscription.aiCreditsRemaining > 0;
  }, [subscription]);

  // Use AI credit - deduct locally (actual deduction in edge function)
  const useAiCredit = useCallback(async (amount: number = 1) => {
    if (!subscription || !user) return false;
    if (subscription.aiCreditsRemaining < amount) return false;
    
    try {
      const { error } = await supabase
        .from('user_subscriptions')
        .update({
          ai_credits_remaining: subscription.aiCreditsRemaining - amount,
          ai_credits_used: subscription.aiCreditsUsed + amount,
        })
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      // Update local state
      setSubscription(prev => prev ? {
        ...prev,
        aiCreditsRemaining: prev.aiCreditsRemaining - amount,
        aiCreditsUsed: prev.aiCreditsUsed + amount,
      } : null);
      
      return true;
    } catch (error) {
      console.error('Failed to use AI credit:', error);
      return false;
    }
  }, [subscription, user]);

  // Use resume credit - now uses same AI credits pool
  const useResumeCredit = useCallback(async (amount: number = 1) => {
    return useAiCredit(amount);
  }, [useAiCredit]);

  return {
    isLoading,
    subscription,
    plans,
    canAddJob,
    hasAiCredits,
    hasResumeCredits,
    useAiCredit,
    useResumeCredit,
    refetch: fetchSubscription,
  };
}
