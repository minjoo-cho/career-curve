import { Check, Crown, Sparkles, ShieldCheck, Zap } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PricingSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PricingSheet({ open, onOpenChange }: PricingSheetProps) {
  const { subscription, plans } = useData();
  const { t, language } = useLanguage();

  // Plan feature descriptions
  const planFeatures = {
    free: [
      { label: t('pricing.aiFeatures'), value: language === 'en' ? '5x' : '5회' },
    ],
    starter: [
      { label: t('pricing.aiFeatures'), value: language === 'en' ? '25x' : '25회' },
    ],
    pro: [
      { label: t('pricing.aiFeatures'), value: language === 'en' ? '50x' : '50회' },
    ],
  };

  const planPrices = {
    free: { price: 0, label: t('pricing.free') },
    starter: { price: 9900, label: '₩9,900' },
    pro: { price: 14900, label: '₩14,900' },
  };

  const totalCredits = (subscription?.aiCreditsRemaining ?? 0) + (subscription?.aiCreditsUsed ?? 0);
  const usedCredits = subscription?.aiCreditsUsed ?? 0;
  const remainingCredits = subscription?.aiCreditsRemaining ?? 0;
  const usagePercentage = totalCredits > 0 ? (usedCredits / totalCredits) * 100 : 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-w-md mx-auto max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-primary" />
            {t('pricing.title')}
          </SheetTitle>
        </SheetHeader>

        {/* Current Usage Status - Lovable style */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-accent mb-6 border border-primary/20">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">{t('pricing.currentPlan')}</span>
            <Badge variant="secondary" className="font-medium">
              {subscription?.planDisplayName || 'Free'}
            </Badge>
          </div>
          
          {/* Credit usage bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Zap className="w-4 h-4 text-primary" />
                {t('settings.aiCredits')}
              </span>
              <span className="font-semibold text-foreground">
                {remainingCredits} / {totalCredits}
              </span>
            </div>
            <Progress value={100 - usagePercentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {language === 'en' 
                ? `${remainingCredits} credits remaining`
                : `${remainingCredits}개 크레딧 남음`
              }
            </p>
          </div>
        </div>

        {/* Plans */}
        <div className="space-y-4">
          {(['free', 'starter', 'pro'] as const).map((planKey) => {
            const plan = plans.find(p => p.name === planKey);
            const isCurrentPlan = subscription?.planName === planKey;
            const isPro = planKey === 'pro';
            const features = planFeatures[planKey];
            const priceInfo = planPrices[planKey];

            return (
              <div
                key={planKey}
                className={cn(
                  "relative p-4 rounded-xl border-2 transition-all",
                  isCurrentPlan 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50",
                  isPro && !isCurrentPlan && "ring-2 ring-primary/20"
                )}
              >
                {isPro && !isCurrentPlan && (
                  <div className="absolute -top-2.5 left-4">
                    <Badge className="bg-primary text-primary-foreground text-xs">
                      <Sparkles className="w-3 h-3 mr-1" />
                      {t('pricing.recommended')}
                    </Badge>
                  </div>
                )}
                
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold capitalize">{planKey}</h3>
                    <p className="text-2xl font-bold">
                      {priceInfo.label}
                      {priceInfo.price > 0 && <span className="text-sm font-normal text-muted-foreground">{t('pricing.monthly')}</span>}
                    </p>
                  </div>
                  {isCurrentPlan && (
                    <Badge variant="outline" className="text-primary border-primary">
                      {t('pricing.currentPlanBadge')}
                    </Badge>
                  )}
                </div>

                <ul className="space-y-2 mb-4">
                  {features.map((feature, idx) => (
                    <li key={idx} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        {feature.label}
                      </span>
                      <span className="font-medium text-muted-foreground">{feature.value}</span>
                    </li>
                  ))}
                  <li className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {t('pricing.chatAnalysis')}
                    </span>
                    <span className="font-medium text-muted-foreground">{t('pricing.unlimited')}</span>
                  </li>
                  {planKey !== 'free' && (
                    <li className="flex items-center gap-2 text-sm pt-1">
                      <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{t('pricing.phoneVerification')}</span>
                    </li>
                  )}
                </ul>

                {!isCurrentPlan && (
                  <Button 
                    className="w-full" 
                    variant={isPro ? "default" : "outline"}
                    disabled
                  >
                    {priceInfo.price > (planPrices[subscription?.planName as keyof typeof planPrices]?.price ?? 0)
                      ? t('pricing.upgrade')
                      : t('pricing.select')}
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 space-y-2">
          <p className="text-xs text-muted-foreground text-center">
            {t('pricing.paymentSoon')}
          </p>
          <p className="text-xs text-muted-foreground text-center">
            {t('pricing.phoneRequired')}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
