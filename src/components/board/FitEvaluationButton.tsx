import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { Experience, KeyCompetency, MinimumRequirementsCheck } from '@/types/job';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FitEvaluationButtonProps {
  keyCompetencies: KeyCompetency[];
  experiences: Experience[];
  minExperience?: string;
  onEvaluated: (competencies: KeyCompetency[], minimumRequirements?: MinimumRequirementsCheck) => void;
}

export function FitEvaluationButton({ keyCompetencies, experiences, minExperience, onEvaluated }: FitEvaluationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const hasCompetencies = keyCompetencies && keyCompetencies.length > 0;
  const hasExperiences = experiences && experiences.length > 0;
  const canEvaluate = hasCompetencies && hasExperiences;

  const handleEvaluate = async () => {
    if (!canEvaluate) {
      if (!hasExperiences) {
        toast.error('경력 탭에서 경험을 먼저 등록해주세요');
      } else if (!hasCompetencies) {
        toast.error('공고에서 추출된 핵심 역량이 필요합니다');
      }
      return;
    }

    setIsLoading(true);
    try {
      // Filter out experiences with empty titles
      const validExperiences = experiences.filter(exp => exp.title && exp.title.trim().length > 0);
      
      if (validExperiences.length === 0) {
        toast.error('유효한 경험이 없습니다. 경력 탭에서 경험을 추가해주세요.');
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('evaluate-fit', {
        body: {
          keyCompetencies,
          experiences: validExperiences,
          minExperience,
        }
      });

      if (error) throw error;

      if (!data?.success && data?.error) {
        throw new Error(data.error);
      }

      if (data?.evaluatedCompetencies) {
        onEvaluated(data.evaluatedCompetencies, data.minimumRequirements);
        toast.success('AI 적합도 평가가 완료되었습니다');
      }
    } catch (error) {
      console.error('Fit evaluation error:', error);
      toast.error('평가 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const disabledReason = !hasExperiences 
    ? '경력 탭에서 경험을 먼저 등록하세요' 
    : !hasCompetencies 
    ? '공고에서 핵심 역량이 추출되어야 합니다' 
    : '';

  const isDisabled = isLoading || !canEvaluate;

  return (
    <div className="w-full">
      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={handleEvaluate}
        disabled={isDisabled}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4 mr-2" />
        )}
        AI로 내 적합도 평가하기
      </Button>
      {isDisabled && disabledReason && (
        <p className="text-xs text-muted-foreground text-center mt-1">{disabledReason}</p>
      )}
    </div>
  );
}
