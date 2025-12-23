import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { Experience, KeyCompetency } from '@/types/job';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FitEvaluationButtonProps {
  keyCompetencies: KeyCompetency[];
  experiences: Experience[];
  onEvaluated: (competencies: KeyCompetency[]) => void;
}

export function FitEvaluationButton({ keyCompetencies, experiences, onEvaluated }: FitEvaluationButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleEvaluate = async () => {
    if (!keyCompetencies.length || !experiences.length) {
      toast.error('핵심 역량과 등록된 경험이 모두 필요합니다');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('evaluate-fit', {
        body: {
          keyCompetencies,
          experiences,
        }
      });

      if (error) throw error;

      if (data?.evaluatedCompetencies) {
        onEvaluated(data.evaluatedCompetencies);
        toast.success('AI 적합도 평가가 완료되었습니다');
      }
    } catch (error) {
      console.error('Fit evaluation error:', error);
      toast.error('평가 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      onClick={handleEvaluate}
      disabled={isLoading || !experiences.length}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Sparkles className="w-4 h-4 mr-2" />
      )}
      AI로 내 적합도 평가하기
    </Button>
  );
}
