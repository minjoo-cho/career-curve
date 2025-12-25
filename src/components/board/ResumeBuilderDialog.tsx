import { useState, useEffect } from 'react';
import { JobPosting, KeyCompetency, Experience } from '@/types/job';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { FileText, Download, CheckCircle2, Loader2, Copy, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useJobStore } from '@/stores/jobStore';

interface ResumeBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobPosting;
  keyCompetencies: KeyCompetency[];
  experiences: Experience[];
}

type ResumeFormat = 'standard' | 'creative' | 'minimal';

const RESUME_FORMATS: { id: ResumeFormat; name: string; description: string }[] = [
  { id: 'standard', name: '표준형', description: '전통적인 형식의 이력서' },
  { id: 'creative', name: '창의형', description: '디자인이 강조된 이력서' },
  { id: 'minimal', name: '간결형', description: '핵심만 담은 1페이지 이력서' },
];

// Detect if text contains mostly English
function detectLanguage(text: string): 'ko' | 'en' {
  const koreanChars = (text.match(/[가-힣]/g) || []).length;
  const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
  return koreanChars > englishChars ? 'ko' : 'en';
}

export function ResumeBuilderDialog({
  open,
  onOpenChange,
  job,
  keyCompetencies,
  experiences,
}: ResumeBuilderDialogProps) {
  const [step, setStep] = useState(1);
  const [selectedFormat, setSelectedFormat] = useState<ResumeFormat>('standard');
  const [selectedExperiences, setSelectedExperiences] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const { addExperience } = useJobStore();

  const workExperiences = experiences.filter(e => e.type === 'work');
  const projectExperiences = experiences.filter(e => e.type === 'project');

  // Auto-select all work experiences when dialog opens
  useEffect(() => {
    if (open) {
      const workIds = workExperiences.map(e => e.id);
      setSelectedExperiences(workIds);
      setStep(1);
      setGeneratedContent(null);
    }
  }, [open, workExperiences.length]);

  const toggleExperience = (id: string) => {
    setSelectedExperiences(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    if (selectedExperiences.length === 0) {
      toast.error('최소 1개의 경험을 선택해주세요');
      return;
    }

    setIsGenerating(true);
    setGeneratedContent(null);

    try {
      // Detect language from job title and summary
      const textToAnalyze = `${job.title} ${job.summary || ''}`;
      const language = detectLanguage(textToAnalyze);

      const selectedExps = experiences.filter(e => selectedExperiences.includes(e.id));

      const { data, error } = await supabase.functions.invoke('generate-resume', {
        body: {
          jobTitle: job.title,
          companyName: job.companyName,
          jobSummary: job.summary || '',
          keyCompetencies: keyCompetencies,
          experiences: selectedExps,
          language,
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to generate resume');
      }

      setGeneratedContent(data.content);
      setStep(3);
      toast.success('맞춤 이력서가 생성되었습니다');
    } catch (error) {
      console.error('Error generating resume:', error);
      toast.error(error instanceof Error ? error.message : '이력서 생성 실패');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (generatedContent) {
      await navigator.clipboard.writeText(generatedContent);
      toast.success('클립보드에 복사되었습니다');
    }
  };

  const handleSaveToCareer = () => {
    if (!generatedContent) return;

    // Save as a new experience in career tab
    const newExperience: Experience = {
      id: Date.now().toString(),
      type: 'project',
      title: `${job.companyName} 맞춤 이력서`,
      company: job.companyName,
      description: `${job.title} 포지션 맞춤 이력서`,
      bullets: generatedContent.split('\n').filter(line => line.trim().startsWith('•')).map(line => line.replace('•', '').trim()),
      usedInPostings: [job.id],
      createdAt: new Date(),
    };

    addExperience(newExperience);
    toast.success('경력 탭에 저장되었습니다');
    onOpenChange(false);
    setStep(1);
    setGeneratedContent(null);
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        공고에서 요구하는 핵심 역량에 맞는 이력서 형식을 선택하세요.
      </p>
      
      <div className="space-y-3">
        {RESUME_FORMATS.map((format) => (
          <div
            key={format.id}
            className={cn(
              'border rounded-lg p-4 cursor-pointer transition-colors',
              selectedFormat === format.id
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            )}
            onClick={() => setSelectedFormat(format.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{format.name}</p>
                <p className="text-sm text-muted-foreground">{format.description}</p>
              </div>
              {selectedFormat === format.id && (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              )}
            </div>
          </div>
        ))}
      </div>

      <Button className="w-full" onClick={() => setStep(2)}>
        다음: 경험 선택
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold">핵심 역량 기준</h4>
        <p className="text-xs text-muted-foreground">
          AI가 아래 역량에 맞게 경험을 최적화합니다.
        </p>
        <div className="flex flex-wrap gap-2">
          {keyCompetencies.map((comp, idx) => (
            <Badge key={idx} variant="secondary" className="text-xs">
              {comp.title}
            </Badge>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {workExperiences.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">경력 (자동 선택됨)</h4>
            {workExperiences.map((exp) => (
              <ExperienceCheckbox
                key={exp.id}
                experience={exp}
                checked={selectedExperiences.includes(exp.id)}
                onToggle={() => toggleExperience(exp.id)}
              />
            ))}
          </div>
        )}

        {projectExperiences.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">프로젝트 (AI가 관련 경험 추천)</h4>
            {projectExperiences.map((exp) => (
              <ExperienceCheckbox
                key={exp.id}
                experience={exp}
                checked={selectedExperiences.includes(exp.id)}
                onToggle={() => toggleExperience(exp.id)}
              />
            ))}
          </div>
        )}

        {experiences.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">
            경력 탭에서 경험을 먼저 추가해주세요.
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
          이전
        </Button>
        <Button 
          className="flex-1" 
          onClick={handleGenerate}
          disabled={isGenerating || selectedExperiences.length === 0}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              생성 중...
            </>
          ) : (
            <>
              맞춤 이력서 생성
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-success" />
          맞춤 이력서 생성 완료
        </h4>
        <p className="text-xs text-muted-foreground">
          {job.companyName} - {job.title} 포지션에 최적화된 이력서입니다.
        </p>
      </div>

      <div className="bg-secondary/30 rounded-lg p-4 max-h-[300px] overflow-y-auto">
        <pre className="text-sm whitespace-pre-wrap font-sans text-foreground">
          {generatedContent}
        </pre>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={handleCopyToClipboard}>
            <Copy className="w-4 h-4 mr-2" />
            복사
          </Button>
          <Button className="flex-1" onClick={handleSaveToCareer}>
            <Download className="w-4 h-4 mr-2" />
            경력탭에 저장
          </Button>
        </div>
        <Button 
          variant="ghost" 
          className="w-full text-muted-foreground"
          onClick={() => {
            setStep(2);
            setGeneratedContent(null);
          }}
        >
          다시 생성하기
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            맞춤 이력서 만들기
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 mb-4">
          <div className={cn('flex-1 h-1 rounded-full', step >= 1 ? 'bg-primary' : 'bg-muted')} />
          <div className={cn('flex-1 h-1 rounded-full', step >= 2 ? 'bg-primary' : 'bg-muted')} />
          <div className={cn('flex-1 h-1 rounded-full', step >= 3 ? 'bg-primary' : 'bg-muted')} />
        </div>

        <ScrollArea className="max-h-[60vh]">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function ExperienceCheckbox({
  experience,
  checked,
  onToggle,
}: {
  experience: Experience;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <div
      className={cn(
        'border rounded-lg p-3 cursor-pointer transition-colors',
        checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
      )}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3">
        <Checkbox checked={checked} className="mt-1" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{experience.title}</p>
          {experience.company && (
            <p className="text-xs text-muted-foreground">{experience.company}</p>
          )}
          <ul className="mt-1 space-y-0.5">
            {experience.bullets.slice(0, 2).map((bullet, i) => (
              <li key={i} className="text-xs text-muted-foreground truncate">
                • {bullet}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
