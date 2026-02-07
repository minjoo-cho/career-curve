import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { JobPosting, JobStatus, STATUS_LABELS, STATUS_LABELS_EN, BuiltInJobStatus, KeyCompetency, CompanyCriteriaScore, MinimumRequirementsCheck, getStatusLabel, getStatusColor } from '@/types/job';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useData } from '@/contexts/DataContext';
import { useCustomStatuses } from '@/hooks/useCustomStatuses';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { 
  ExternalLink, 
  Star, 
  ChevronDown, 
  Building2, 
  MapPin, 
  Briefcase, 
  Calendar,
  Globe,
  FileText,
  Quote,
  AlertCircle,
  Edit2,
  Check,
  X,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  Lock,
} from 'lucide-react';
import { ResumeBuilderDialog } from './ResumeBuilderDialog';
import { FitEvaluationButton } from './FitEvaluationButton';
import { Textarea } from '@/components/ui/textarea';

interface JobDetailDialogProps {
  job: JobPosting;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigateToCareer?: (tailoredResumeId?: string) => void;
}

export function JobDetailDialog({ job, open, onOpenChange, onNavigateToCareer }: JobDetailDialogProps) {
  const { updateJobPosting, currentGoals, experiences, jobPostings } = useData();
  const { customStatuses } = useCustomStatuses();
  const { t, language } = useLanguage();
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [isStep1Open, setIsStep1Open] = useState(false);
  const [isStep2Open, setIsStep2Open] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [isResumeBuilderOpen, setIsResumeBuilderOpen] = useState(false);
  
  const statusLabels = language === 'en' ? STATUS_LABELS_EN : STATUS_LABELS;
  const [editingEvaluation, setEditingEvaluation] = useState<number | null>(null);
  const [editEvalText, setEditEvalText] = useState('');
  
  // Initialize company criteria scores from goals or job
  const [companyCriteriaScores, setCompanyCriteriaScores] = useState<CompanyCriteriaScore[]>(() => {
    if (job.companyCriteriaScores?.length) {
      return job.companyCriteriaScores;
    }
    const activeGoals = currentGoals.filter((g) => !g.endDate);
    if (activeGoals.length === 0) return [];
    const criteriaMap = new Map<string, { name: string; weight: number; description?: string }>();
    activeGoals.forEach((goal) => {
      goal.companyEvalCriteria.forEach((c) => {
        if (!criteriaMap.has(c.name)) {
          criteriaMap.set(c.name, c);
        }
      });
    });
    return Array.from(criteriaMap.values()).map((c) => ({ ...c, score: undefined }));
  });

  // Key competency scores (for fit score)
  const [keyCompetencyScores, setKeyCompetencyScores] = useState<KeyCompetency[]>(
    job.keyCompetencies || []
  );

  // Minimum requirements check state
  const [minimumRequirementsCheck, setMinimumRequirementsCheck] = useState<MinimumRequirementsCheck | undefined>(
    job.minimumRequirementsCheck
  );

  // Calculate average scores
  const companyAvg = companyCriteriaScores.filter(c => c.score).length > 0
    ? Math.round(companyCriteriaScores.reduce((sum, c) => sum + (c.score || 0), 0) / companyCriteriaScores.filter(c => c.score).length)
    : 0;
  
  const fitAvg = keyCompetencyScores.filter(c => c.score).length > 0
    ? Math.round(keyCompetencyScores.reduce((sum, c) => sum + (c.score || 0), 0) / keyCompetencyScores.filter(c => c.score).length)
    : 0;

  // Step completion checks
  const isStep1Complete = fitAvg > 0;
  const isStep2Complete = companyAvg > 0;
  const isStep3Enabled = isStep1Complete && isStep2Complete && keyCompetencyScores.length > 0;

  // Calculate relative priority based on all job postings
  const calculateRelativePriority = (compScore: number, fitScoreVal: number): number => {
    const allScores = jobPostings
      .filter(j => (j.companyScore && j.companyScore > 0) || (j.fitScore && j.fitScore > 0))
      .map(j => {
        const comp = j.companyScore || 0;
        const fit = j.fitScore || 0;
        const count = (comp > 0 ? 1 : 0) + (fit > 0 ? 1 : 0);
        return count > 0 ? (comp + fit) / count : 0;
      })
      .filter(s => s > 0);

    const count = (compScore > 0 ? 1 : 0) + (fitScoreVal > 0 ? 1 : 0);
    const thisScore = count > 0 ? (compScore + fitScoreVal) / count : 0;
    
    if (thisScore === 0 || allScores.length === 0) return 3;

    const allWithThis = [...allScores.filter(s => s !== thisScore), thisScore].sort((a, b) => b - a);
    
    if (allWithThis.length === 1) {
      if (thisScore >= 4) return 1;
      if (thisScore >= 3) return 2;
      if (thisScore >= 2) return 3;
      if (thisScore >= 1) return 4;
      return 5;
    }

    const rank = allWithThis.indexOf(thisScore);
    const totalJobs = allWithThis.length;
    const percentile = rank / totalJobs;
    
    if (percentile < 0.2) return 1;
    if (percentile < 0.4) return 2;
    if (percentile < 0.6) return 3;
    if (percentile < 0.8) return 4;
    return 5;
  };

  const handleStatusChange = (status: JobStatus) => {
    updateJobPosting(job.id, { status });
  };

  const handlePriorityChange = (priority: number) => {
    updateJobPosting(job.id, { priority });
  };

  const handleCompanyCriteriaScoreChange = (index: number, score: number) => {
    const updated = [...companyCriteriaScores];
    updated[index] = { ...updated[index], score };
    setCompanyCriteriaScores(updated);
    
    const avg = Math.round(updated.reduce((sum, c) => sum + (c.score || 0), 0) / updated.filter(c => c.score).length) || 0;
    updateJobPosting(job.id, { 
      companyCriteriaScores: updated, 
      companyScore: avg 
    });
    updatePriorityRelative(avg, fitAvg);
  };

  const handleKeyCompetencyScoreChange = (index: number, score: number) => {
    const updated = [...keyCompetencyScores];
    updated[index] = { ...updated[index], score };
    setKeyCompetencyScores(updated);
    
    const avg = Math.round(updated.reduce((sum, c) => sum + (c.score || 0), 0) / updated.filter(c => c.score).length) || 0;
    updateJobPosting(job.id, { 
      keyCompetencies: updated, 
      fitScore: avg 
    });
    updatePriorityRelative(companyAvg, avg);
  };

  const handleEvaluationUpdate = (index: number, evaluation: string) => {
    const updated = [...keyCompetencyScores];
    updated[index] = { ...updated[index], evaluation };
    setKeyCompetencyScores(updated);
    updateJobPosting(job.id, { keyCompetencies: updated });
    setEditingEvaluation(null);
    setEditEvalText('');
  };

  const handleAIEvaluated = (evaluatedCompetencies: KeyCompetency[], minReqs?: MinimumRequirementsCheck) => {
    setKeyCompetencyScores(evaluatedCompetencies);
    setMinimumRequirementsCheck(minReqs);
    
    const avg = Math.round(evaluatedCompetencies.reduce((sum, c) => sum + (c.score || 0), 0) / evaluatedCompetencies.filter(c => c.score).length) || 0;
    updateJobPosting(job.id, { 
      keyCompetencies: evaluatedCompetencies, 
      fitScore: avg,
      minimumRequirementsCheck: minReqs 
    });
    updatePriorityRelative(companyAvg, avg);
  };

  const updatePriorityRelative = (compScore: number, fitScoreVal: number) => {
    if (compScore === 0 && fitScoreVal === 0) return;
    const newPriority = calculateRelativePriority(compScore, fitScoreVal);
    updateJobPosting(job.id, { priority: newPriority });
  };

  const handleFieldUpdate = (field: string, value: string | boolean) => {
    updateJobPosting(job.id, { [field]: value });
    setEditingField(null);
  };

  const renderStarRating = (value: number, onChange: (v: number) => void, size: 'sm' | 'md' = 'md', allowZero: boolean = false) => (
    <div className="flex items-center gap-1 group">
      <div className="flex gap-0.5 p-1 -m-1 rounded-lg transition-colors group-hover:bg-primary/10">
        {[1, 2, 3, 4, 5].map((i) => (
          <button 
            key={i} 
            onClick={() => {
              if (allowZero && value === i) {
                onChange(0);
              } else {
                onChange(i);
              }
            }} 
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star className={cn(
              'transition-colors', 
              size === 'sm' ? 'w-4 h-4' : 'w-5 h-5',
              i <= value ? 'fill-primary text-primary' : 'text-muted-foreground/40 hover:text-primary/70 hover:fill-primary/30'
            )} />
          </button>
        ))}
      </div>
      <Edit2 className="w-3 h-3 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity ml-1" />
    </div>
  );

  const getDisplayValue = (value: string | boolean | null | undefined, defaultText: string = '확인 불가') => {
    if (value === undefined || value === null || value === '') return defaultText;
    if (typeof value === 'boolean') return value ? '가능' : '불가';
    return value;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[85vh] p-0 rounded-2xl overflow-hidden">
          <ScrollArea className="max-h-[85vh]">
            <div className="p-6 space-y-5">
              {/* Header: Company & Title */}
              <DialogHeader className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground font-medium">{job.companyName}</p>
                    <DialogTitle className="text-xl font-bold mt-1">{job.title}</DialogTitle>
                  </div>
                  {job.sourceUrl && (
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="shrink-0" 
                      onClick={() => {
                        const isLinkedIn = job.sourceUrl?.toLowerCase().includes('linkedin.com');
                        if (isLinkedIn) {
                          navigator.clipboard.writeText(job.sourceUrl!);
                          toast.info('LinkedIn은 바로 이동이 어렵습니다. 링크가 복사되었으니, 브라우저에 붙여넣어 이동하세요.');
                          return;
                        }
                        const link = document.createElement('a');
                        link.href = job.sourceUrl!;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        link.click();
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </DialogHeader>

              {/* 지원 상태 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{t('jobDetail.applicationStatus')}</span>
                </div>
                <Select value={job.status} onValueChange={(v) => handleStatusChange(v as JobStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['reviewing', 'applied', 'interview', 'offer', 'rejected-docs', 'rejected-interview', 'accepted', 'closed'] as BuiltInJobStatus[]).map((key) => (
                      <SelectItem key={key} value={key}>
                        <Badge className={cn('text-xs', getStatusColor(key, customStatuses))}>{statusLabels[key]}</Badge>
                      </SelectItem>
                    ))}
                    {/* Custom statuses */}
                    {customStatuses.length > 0 && (
                      <>
                        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">
                          {t('status.custom')}
                        </div>
                        {customStatuses.map((cs) => (
                          <SelectItem key={cs.id} value={`custom:${cs.id}`}>
                            <Badge className={cn('text-xs', getStatusColor(`custom:${cs.id}`, customStatuses))}>{cs.name}</Badge>
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 공고 요약 - Collapsible */}
              <Collapsible open={isSummaryOpen} onOpenChange={setIsSummaryOpen}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-0 h-auto py-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold">{t('jobDetail.jobSummary')}</span>
                    </div>
                    <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', isSummaryOpen && 'rotate-180')} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  {/* AI Summary */}
                  {job.summary && (
                    <div className="bg-accent/50 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere]">{job.summary}</p>
                    </div>
                  )}

                  {/* Minimum Requirements Check */}
                  {minimumRequirementsCheck && (
                    <div className={cn(
                      "rounded-lg p-3 flex items-start gap-3 border",
                      minimumRequirementsCheck.experienceMet === '충족' 
                        ? "bg-success/10 border-success/20" 
                        : minimumRequirementsCheck.experienceMet === '미충족'
                        ? "bg-destructive/10 border-destructive/20"
                        : "bg-warning/10 border-warning/20"
                    )}>
                      {minimumRequirementsCheck.experienceMet === '충족' ? (
                        <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                      ) : minimumRequirementsCheck.experienceMet === '미충족' ? (
                        <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      ) : (
                        <HelpCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className={cn(
                          "text-xs font-semibold",
                          minimumRequirementsCheck.experienceMet === '충족' ? "text-success" :
                          minimumRequirementsCheck.experienceMet === '미충족' ? "text-destructive" : "text-warning"
                        )}>
                          최소 경력 조건: {minimumRequirementsCheck.experienceMet}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">{minimumRequirementsCheck.reason}</p>
                      </div>
                    </div>
                  )}

                  {/* Job Info Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <InfoRowCompact 
                      icon={<Briefcase className="w-3 h-3" />} 
                      label="포지션" 
                      value={job.position} 
                      field="position"
                      editingField={editingField}
                      setEditingField={setEditingField}
                      onSave={(v) => handleFieldUpdate('position', v)}
                    />
                    <InfoRowCompact 
                      icon={<Calendar className="w-3 h-3" />} 
                      label="최소 경력" 
                      value={getDisplayValue(job.minExperience)} 
                      field="minExperience"
                      editingField={editingField}
                      setEditingField={setEditingField}
                      onSave={(v) => handleFieldUpdate('minExperience', v)}
                      isUnconfirmed={!job.minExperience}
                    />
                    <InfoRowCompact 
                      icon={<Building2 className="w-3 h-3" />} 
                      label="근무 형태" 
                      value={getDisplayValue(job.workType)} 
                      field="workType"
                      editingField={editingField}
                      setEditingField={setEditingField}
                      onSave={(v) => handleFieldUpdate('workType', v)}
                      isUnconfirmed={!job.workType}
                    />
                    <InfoRowCompact 
                      icon={<MapPin className="w-3 h-3" />} 
                      label="위치" 
                      value={getDisplayValue(job.location)} 
                      field="location"
                      editingField={editingField}
                      setEditingField={setEditingField}
                      onSave={(v) => handleFieldUpdate('location', v)}
                      isUnconfirmed={!job.location}
                    />
                    <InfoRowCompact 
                      icon={<Globe className="w-3 h-3" />} 
                      label="비자 지원" 
                      value={job.visaSponsorship === undefined || job.visaSponsorship === null ? '확인 불가' : job.visaSponsorship ? '가능' : '불가'} 
                      field="visaSponsorship"
                      editingField={editingField}
                      setEditingField={setEditingField}
                      onSave={(v) => handleFieldUpdate('visaSponsorship', v === '가능')}
                      isUnconfirmed={job.visaSponsorship === undefined || job.visaSponsorship === null}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              {/* 우선순위 */}
              <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">우선순위</span>
                    <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 h-5">
                      <Sparkles className="w-3 h-3" />
                      AI 자동
                    </Badge>
                  </div>
                  <Badge variant="outline" className="text-sm font-bold">#{job.priority}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">아래 평가 결과에 따라 자동 계산됩니다. 직접 조정도 가능합니다.</p>
                
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((p) => (
                    <Button
                      key={p}
                      variant={job.priority === p ? 'default' : 'outline'}
                      size="sm"
                      className="flex-1"
                      onClick={() => handlePriorityChange(p)}
                    >
                      #{p}
                    </Button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">핵심 역량 적합도</span>
                    <div className="flex items-center gap-2">
                      {fitAvg > 0 && <span className="text-lg font-bold text-primary">{fitAvg}</span>}
                      {fitAvg === 0 && <span className="text-lg font-bold text-muted-foreground">-</span>}
                      <span className="text-xs text-muted-foreground">/ 5</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">회사 매력도</span>
                    <div className="flex items-center gap-2">
                      {companyAvg > 0 && <span className="text-lg font-bold text-primary">{companyAvg}</span>}
                      {companyAvg === 0 && <span className="text-lg font-bold text-muted-foreground">-</span>}
                      <span className="text-xs text-muted-foreground">/ 5</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 1: 핵심 역량 적합도 평가 */}
              <Collapsible open={isStep1Open} onOpenChange={setIsStep1Open}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between px-0 h-auto py-2">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                        isStep1Complete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                      )}>
                        {isStep1Complete ? <Check className="w-2.5 h-2.5" /> : "1"}
                      </div>
                      <span className="text-sm font-semibold">Step 1. 핵심 역량 적합도</span>
                      <Badge variant="outline" className="text-[10px] gap-1 px-1.5 py-0 h-5">
                        <Sparkles className="w-3 h-3" />
                        AI 자동
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {fitAvg > 0 && (
                        <span className="text-sm font-bold text-primary">{fitAvg}/5</span>
                      )}
                      <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', isStep1Open && 'rotate-180')} />
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  {keyCompetencyScores.length > 0 ? (
                    <div className="space-y-3 pl-8">
                      {/* 종합 피드백 */}
                      {fitAvg > 0 && (
                        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                          <h4 className="text-xs font-semibold text-primary mb-1">종합 피드백</h4>
                          <p className="text-xs text-foreground leading-relaxed">
                            {fitAvg >= 4 ? (
                              <>적합한 경험을 보유하고 있습니다. 핵심 역량과 잘 맞는 경험을 강조하여 지원하세요.</>
                            ) : fitAvg >= 3 ? (
                              <>일부 역량에서 적합한 경험이 있습니다. 부족한 역량은 관련 경험으로 보완하세요.</>
                            ) : (
                              <>핵심 역량과의 매칭이 다소 부족합니다. 전이 가능한 기술을 강조해 보세요.</>
                            )}
                          </p>
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">AI가 추출한 핵심 역량입니다. 버튼으로 자동 평가하거나 별점을 클릭해 직접 수정하세요.</p>
                      
                      <FitEvaluationButton
                        keyCompetencies={keyCompetencyScores}
                        experiences={experiences}
                        minExperience={job.minExperience}
                        onEvaluated={handleAIEvaluated}
                      />

                      {keyCompetencyScores.map((comp, idx) => (
                        <Collapsible key={idx}>
                          <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <p className="text-sm font-medium break-words [overflow-wrap:anywhere]">{comp.title}</p>
                                <p className="text-xs text-muted-foreground break-words [overflow-wrap:anywhere]">{comp.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">나의 역량:</span>
                              {renderStarRating(comp.score || 0, (v) => handleKeyCompetencyScoreChange(idx, v), 'sm')}
                            </div>
                            {comp.evaluation && (
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="w-full justify-between text-xs text-muted-foreground h-7 px-2">
                                  <span>AI 평가 보기</span>
                                  <ChevronDown className="w-3 h-3" />
                                </Button>
                              </CollapsibleTrigger>
                            )}
                            <CollapsibleContent>
                              {comp.evaluation && editingEvaluation !== idx && (
                                <div className="bg-background/50 rounded p-2 mt-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-xs text-muted-foreground italic flex-1 break-words [overflow-wrap:anywhere]">{comp.evaluation}</p>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="w-6 h-6 shrink-0"
                                      onClick={() => {
                                        setEditingEvaluation(idx);
                                        setEditEvalText(comp.evaluation || '');
                                      }}
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                              {editingEvaluation === idx && (
                                <div className="mt-2 space-y-2">
                                  <Textarea
                                    value={editEvalText}
                                    onChange={(e) => setEditEvalText(e.target.value)}
                                    className="text-xs min-h-[60px]"
                                    placeholder="평가 의견을 수정하세요..."
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setEditingEvaluation(null);
                                        setEditEvalText('');
                                      }}
                                    >
                                      <X className="w-3 h-3 mr-1" />
                                      취소
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => handleEvaluationUpdate(idx, editEvalText)}
                                    >
                                      <Check className="w-3 h-3 mr-1" />
                                      저장
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </CollapsibleContent>
                          </div>
                        </Collapsible>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 flex items-start gap-2 ml-8">
                      <AlertCircle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning">핵심 역량 분석 필요</p>
                        <p className="text-xs text-muted-foreground">새 공고를 등록하면 AI가 자동으로 핵심 역량을 추출합니다.</p>
                      </div>
                    </div>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Step 2: 회사 매력도 평가 */}
              <Collapsible open={isStep2Open} onOpenChange={isStep1Complete ? setIsStep2Open : undefined}>
                <CollapsibleTrigger asChild disabled={!isStep1Complete}>
                  <Button 
                    variant="ghost" 
                    className={cn(
                      "w-full justify-between px-0 h-auto py-2",
                      !isStep1Complete && "opacity-60 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                        isStep2Complete ? "bg-primary text-primary-foreground" : 
                        isStep1Complete ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                      )}>
                        {isStep2Complete ? <Check className="w-2.5 h-2.5" /> : "2"}
                      </div>
                      <span className="text-sm font-semibold">Step 2. 회사 매력도</span>
                      {!isStep1Complete && <Lock className="w-3 h-3 text-muted-foreground" />}
                    </div>
                    <div className="flex items-center gap-2">
                      {companyAvg > 0 && (
                        <span className="text-sm font-bold text-primary">{companyAvg}/5</span>
                      )}
                      <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', isStep2Open && 'rotate-180')} />
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-2">
                  {isStep1Complete ? (
                    <div className="space-y-3 pl-8">
                      {companyCriteriaScores.length === 0 ? (
                        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 text-center">
                          <p className="text-sm font-medium text-warning">회사 평가 기준 없음</p>
                          <p className="text-xs text-muted-foreground mt-1">목표 탭에서 평가 기준을 먼저 설정해주세요.</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-xs text-muted-foreground">목표 탭에서 설정한 기준으로 회사를 평가하세요. 별점을 클릭해 수정하고, 같은 별을 다시 누르면 0점으로 초기화됩니다.</p>
                          {companyCriteriaScores.map((criteria, index) => (
                            <div key={index} className="bg-secondary/30 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">{criteria.name}</span>
                                <Badge variant="outline" className="text-xs">가중치 {criteria.weight}</Badge>
                              </div>
                              {criteria.description && (
                                <p className="text-xs text-muted-foreground">{criteria.description}</p>
                              )}
                              {renderStarRating(criteria.score || 0, (v) => handleCompanyCriteriaScoreChange(index, v), 'sm', true)}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground pl-8">Step 1을 완료하면 활성화됩니다.</p>
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Step 3: 맞춤 이력서 만들기 */}
              <div className={cn("space-y-3", !isStep3Enabled && "opacity-60")}>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                    isStep3Enabled ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    3
                  </div>
                  <span className="text-sm font-semibold">Step 3. 맞춤 이력서 만들기</span>
                  {!isStep3Enabled && <Lock className="w-3 h-3 text-muted-foreground" />}
                </div>

                <div className="pl-8">
                  {isStep3Enabled ? (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => setIsResumeBuilderOpen(true)}
                    >
                      <FileText className="w-4 h-4 mr-2" />
                      이 공고 맞춤 이력서 만들기
                    </Button>
                  ) : (
                    <>
                      <p className="text-xs text-muted-foreground mb-3">Step 1, 2를 모두 완료하면 활성화됩니다.</p>
                      <Button 
                        className="w-full" 
                        size="lg"
                        disabled
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        이 공고 맞춤 이력서 만들기
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <ResumeBuilderDialog
        open={isResumeBuilderOpen}
        onOpenChange={setIsResumeBuilderOpen}
        job={job}
        keyCompetencies={keyCompetencyScores}
        experiences={experiences}
        onNavigateToCareer={(tailoredResumeId) => {
          onOpenChange(false);
          onNavigateToCareer?.(tailoredResumeId);
        }}
      />
    </>
  );
}

// Compact info row for grid layout
interface InfoRowCompactProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  field: string;
  editingField: string | null;
  setEditingField: (field: string | null) => void;
  onSave: (value: string) => void;
  isUnconfirmed?: boolean;
}

function InfoRowCompact({ icon, label, value, field, editingField, setEditingField, onSave, isUnconfirmed }: InfoRowCompactProps) {
  const [localValue, setLocalValue] = useState(value || '');
  const isEditing = editingField === field;

  if (isEditing) {
    return (
      <div className="bg-secondary/50 rounded-lg p-2">
        <Input 
          value={localValue} 
          onChange={(e) => setLocalValue(e.target.value)} 
          className="h-7 text-xs" 
          autoFocus 
          onBlur={() => onSave(localValue)} 
          onKeyDown={(e) => e.key === 'Enter' && onSave(localValue)} 
        />
      </div>
    );
  }

  return (
    <div 
      className="bg-secondary/30 rounded-lg p-2 cursor-pointer hover:bg-secondary/50 transition-colors" 
      onClick={() => setEditingField(field)}
    >
      <div className="flex items-center gap-1.5">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className={cn('text-xs font-medium truncate mt-0.5', isUnconfirmed ? 'text-warning' : 'text-foreground')}>
        {value || '확인 불가'}
      </p>
    </div>
  );
}
