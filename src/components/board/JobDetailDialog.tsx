import { useState } from 'react';
import { JobPosting, JobStatus, QuickInterest, STATUS_LABELS, STATUS_COLORS, INTEREST_LABELS } from '@/types/job';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useJobStore } from '@/stores/jobStore';
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
  ThumbsUp,
  ThumbsDown,
  Minus
} from 'lucide-react';

interface JobDetailDialogProps {
  job: JobPosting;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JobDetailDialog({ job, open, onOpenChange }: JobDetailDialogProps) {
  const { updateJobPosting, currentGoal } = useJobStore();
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  
  // Local state for scores
  const [companyScore, setCompanyScore] = useState(job.companyScore || 0);
  const [fitScore, setFitScore] = useState(job.fitScore || 0);

  const handleStatusChange = (status: JobStatus) => {
    updateJobPosting(job.id, { status });
  };

  const handleInterestChange = (interest: QuickInterest) => {
    updateJobPosting(job.id, { quickInterest: interest });
  };

  const handleScoreChange = (type: 'company' | 'fit', score: number) => {
    if (type === 'company') {
      setCompanyScore(score);
      updateJobPosting(job.id, { companyScore: score });
    } else {
      setFitScore(score);
      updateJobPosting(job.id, { fitScore: score });
    }
  };

  const handleFieldUpdate = (field: string, value: string | boolean) => {
    updateJobPosting(job.id, { [field]: value });
    setEditingField(null);
  };

  const renderStarRating = (value: number, onChange: (v: number) => void) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className="focus:outline-none"
        >
          <Star
            className={cn(
              'w-5 h-5 transition-colors',
              i <= value ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary/50'
            )}
          />
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] p-0 rounded-2xl overflow-hidden">
        <ScrollArea className="max-h-[85vh]">
          <div className="p-6 space-y-6">
            {/* Header */}
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
                    onClick={() => window.open(job.sourceUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
              
              {/* Status Dropdown */}
              <div className="pt-2">
                <Select value={job.status} onValueChange={(v) => handleStatusChange(v as JobStatus)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        <Badge className={cn('text-xs', STATUS_COLORS[key as JobStatus])}>
                          {label}
                        </Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </DialogHeader>

            {/* Priority Section */}
            <div className="bg-secondary/50 rounded-xl p-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">우선순위 평가</h3>
              
              {/* Quick Interest */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">빠른 평가</Label>
                <div className="flex gap-2">
                  {(['high', 'medium', 'low'] as QuickInterest[]).map((interest) => (
                    <Button
                      key={interest}
                      variant={job.quickInterest === interest ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'flex-1',
                        job.quickInterest === interest && interest === 'high' && 'bg-success hover:bg-success/90',
                        job.quickInterest === interest && interest === 'low' && 'bg-destructive hover:bg-destructive/90'
                      )}
                      onClick={() => handleInterestChange(interest)}
                    >
                      {interest === 'high' && <ThumbsUp className="w-4 h-4 mr-1" />}
                      {interest === 'medium' && <Minus className="w-4 h-4 mr-1" />}
                      {interest === 'low' && <ThumbsDown className="w-4 h-4 mr-1" />}
                      {INTEREST_LABELS[interest]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Company Score */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">회사 매력도</Label>
                {renderStarRating(companyScore, (v) => handleScoreChange('company', v))}
              </div>

              {/* Fit Score */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">내 적합도</Label>
                {renderStarRating(fitScore, (v) => handleScoreChange('fit', v))}
              </div>

              {/* Priority Badge */}
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <span className="text-sm font-medium">우선순위</span>
                <Badge variant="outline" className="text-primary border-primary">
                  #{job.priority}
                </Badge>
              </div>
            </div>

            {/* AI Summary */}
            {job.summary && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">AI 요약</h3>
                <p className="text-sm text-muted-foreground leading-relaxed bg-accent/50 rounded-lg p-3">
                  {job.summary}
                </p>
              </div>
            )}

            {/* Auto-extracted Fields */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">공고 정보</h3>
              <div className="grid gap-3">
                <InfoRow
                  icon={<Briefcase className="w-4 h-4" />}
                  label="포지션"
                  value={job.position}
                  field="position"
                  editingField={editingField}
                  setEditingField={setEditingField}
                  onSave={(v) => handleFieldUpdate('position', v)}
                />
                <InfoRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="최소 경력"
                  value={job.minExperience}
                  field="minExperience"
                  editingField={editingField}
                  setEditingField={setEditingField}
                  onSave={(v) => handleFieldUpdate('minExperience', v)}
                />
                <InfoRow
                  icon={<Building2 className="w-4 h-4" />}
                  label="근무 형태"
                  value={job.workType}
                  field="workType"
                  editingField={editingField}
                  setEditingField={setEditingField}
                  onSave={(v) => handleFieldUpdate('workType', v)}
                />
                <InfoRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="위치"
                  value={job.location}
                  field="location"
                  editingField={editingField}
                  setEditingField={setEditingField}
                  onSave={(v) => handleFieldUpdate('location', v)}
                />
                <InfoRow
                  icon={<Globe className="w-4 h-4" />}
                  label="비자 지원"
                  value={job.visaSponsorship === undefined ? '미확인' : job.visaSponsorship ? '가능' : '불가'}
                  field="visaSponsorship"
                  editingField={editingField}
                  setEditingField={setEditingField}
                  onSave={(v) => handleFieldUpdate('visaSponsorship', v === '가능')}
                  isUnconfirmed={job.visaSponsorship === undefined}
                />
              </div>
            </div>

            {/* Detailed Scoring (Collapsible) */}
            <Collapsible open={isDetailOpen} onOpenChange={setIsDetailOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between px-0">
                  <span className="font-semibold">자세히 보기 (10개 항목)</span>
                  <ChevronDown className={cn('w-4 h-4 transition-transform', isDetailOpen && 'rotate-180')} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-4 pt-4">
                {/* Company Criteria */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">회사 평가 기준</h4>
                  {currentGoal?.companyEvalCriteria.map((criteria, index) => (
                    <CriteriaRow key={index} name={criteria.name} weight={criteria.weight} />
                  ))}
                </div>

                {/* Fit Criteria */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-foreground">적합도 평가 기준</h4>
                  {currentGoal?.fitEvalCriteria.map((criteria, index) => (
                    <CriteriaRow key={index} name={criteria.name} weight={criteria.weight} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* CTA Button */}
            <Button className="w-full" size="lg">
              이 공고 맞춤 이력서 만들기
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  field: string;
  editingField: string | null;
  setEditingField: (field: string | null) => void;
  onSave: (value: string) => void;
  isUnconfirmed?: boolean;
}

function InfoRow({ icon, label, value, field, editingField, setEditingField, onSave, isUnconfirmed }: InfoRowProps) {
  const [localValue, setLocalValue] = useState(value || '');
  const isEditing = editingField === field;

  const handleSave = () => {
    onSave(localValue);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-2">
        <div className="text-muted-foreground">{icon}</div>
        <Input
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          className="h-8 flex-1"
          autoFocus
          onBlur={handleSave}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-3 bg-secondary/30 rounded-lg p-3 cursor-pointer hover:bg-secondary/50 transition-colors"
      onClick={() => setEditingField(field)}
    >
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn(
          'text-sm font-medium truncate',
          isUnconfirmed ? 'text-warning' : 'text-foreground'
        )}>
          {value || '미확인'}
        </p>
      </div>
    </div>
  );
}

interface CriteriaRowProps {
  name: string;
  weight: number;
}

function CriteriaRow({ name, weight }: CriteriaRowProps) {
  const [score, setScore] = useState(0);
  const [rationale, setRationale] = useState('');

  return (
    <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{name}</span>
        <Badge variant="outline" className="text-xs">가중치 {weight}</Badge>
      </div>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} onClick={() => setScore(i)} className="focus:outline-none">
            <Star
              className={cn(
                'w-4 h-4 transition-colors',
                i <= score ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-primary/50'
              )}
            />
          </button>
        ))}
      </div>
      <Input
        placeholder="근거를 입력하세요..."
        value={rationale}
        onChange={(e) => setRationale(e.target.value)}
        className="h-8 text-sm"
      />
    </div>
  );
}
