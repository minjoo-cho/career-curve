import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ChevronRight, FileText, Shield, Globe, ListChecks } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AccountSheet } from '@/components/settings/AccountSheet';
import { PageHeader } from '@/components/layout/PageHeader';
import { CustomStatusManager } from '@/components/settings/CustomStatusManager';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
export function SettingsTab() {
  const navigate = useNavigate();
  const { jobPostings, currentGoals } = useData();
  const { language, setLanguage, t } = useLanguage();
  const [accountOpen, setAccountOpen] = useState(false);
  const currentGoal = currentGoals[0] ?? null;

  const interviewCount = jobPostings.filter(j => j.status === 'interview').length;
  const appliedCount = jobPostings.filter(j => j.status !== 'reviewing').length;
  const start = currentGoal?.startDate ? new Date(currentGoal.startDate) : null;
  const daysSinceGoal = start 
    ? Math.floor((Date.now() - start.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="flex flex-col h-full">
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        logoSize="lg"
        className="pb-5"
        titleClassName="text-2xl"
      />

      <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4 scrollbar-hide">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-primary/10 to-accent rounded-2xl p-5 border border-primary/10">
          <p className="text-2xl font-bold text-foreground mb-1">
            {daysSinceGoal}{language === 'ko' ? '일째' : ' days'}
          </p>
          <p className="text-sm text-muted-foreground mb-4">{t('settings.daysSince')}</p>
          <div className="flex gap-6">
            <div>
              <p className="text-xl font-bold text-primary">{appliedCount}</p>
              <p className="text-xs text-muted-foreground">{t('settings.applied')}</p>
            </div>
            <div>
              <p className="text-xl font-bold text-primary">{interviewCount}</p>
              <p className="text-xs text-muted-foreground">{t('settings.interview')}</p>
            </div>
          </div>
        </div>

        {/* Language Setting */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">{t('settings.language')}</span>
            </div>
            <Select value={language} onValueChange={(v) => setLanguage(v as 'ko' | 'en')}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ko">{t('settings.languageKo')}</SelectItem>
                <SelectItem value="en">{t('settings.languageEn')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom Status Setting */}
        <Collapsible>
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-secondary/50 transition-colors">
              <div className="flex items-center gap-3">
                <ListChecks className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{t('settings.customStatus')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-4 pb-4 pt-2 border-t border-border">
                <CustomStatusManager />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Menu Items */}
        <div className="bg-card rounded-xl border border-border overflow-hidden divide-y divide-border">
          <MenuItem icon={User} label={t('settings.account')} onClick={() => setAccountOpen(true)} />
          <MenuItem icon={FileText} label={t('settings.terms')} onClick={() => navigate('/terms')} />
          <MenuItem icon={Shield} label={t('settings.privacy')} onClick={() => navigate('/privacy')} />
        </div>
        <p className="text-center text-xs text-muted-foreground pt-4">
          {t('settings.version')} v1.0.0
        </p>
      </div>

      <AccountSheet open={accountOpen} onOpenChange={setAccountOpen} />
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: typeof User; label: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full px-4 py-3.5 hover:bg-secondary/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </button>
  );
}

