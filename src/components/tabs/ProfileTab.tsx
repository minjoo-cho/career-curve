import { useState } from 'react';
import { Plus, FileText, Target, GripVertical, Trash2, Edit2, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useJobStore } from '@/stores/jobStore';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function ProfileTab() {
  const { experiences, currentGoal, setGoal, addExperience, updateExperience, removeExperience } = useJobStore();
  const [goalsOpen, setGoalsOpen] = useState(true);
  const [experienceOpen, setExperienceOpen] = useState(true);
  const [isEditingGoals, setIsEditingGoals] = useState(false);
  const [isAddingExperience, setIsAddingExperience] = useState(false);
  const [editingExperience, setEditingExperience] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-full">
      <header className="px-4 pt-safe-top pb-4 bg-background safe-top">
        <h1 className="text-xl font-bold text-foreground">프로필</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          목표와 경험을 정리하세요
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-4 pb-20 space-y-4 scrollbar-hide">
        {/* Goals Section */}
        <Collapsible open={goalsOpen} onOpenChange={setGoalsOpen}>
          <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">이직 목표</h2>
              </div>
              {goalsOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-4">
                {currentGoal && (
                  <>
                    {/* Reason */}
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">이직 이유</p>
                      <p className="text-sm text-foreground">{currentGoal.reason}</p>
                      {currentGoal.careerPath && (
                        <p className="text-xs text-primary">{currentGoal.careerPath}</p>
                      )}
                    </div>

                    {/* Company Eval Criteria - Priority Order */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">회사 평가 기준 (우선순위)</p>
                      <div className="space-y-1.5">
                        {[...currentGoal.companyEvalCriteria]
                          .sort((a, b) => b.weight - a.weight)
                          .map((c, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                                {i + 1}
                              </span>
                              <span className="flex-1 text-foreground">{c.name}</span>
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(n => (
                                  <div key={n} className={cn('w-2 h-2 rounded-full', n <= c.weight ? 'bg-primary' : 'bg-muted')} />
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Fit Eval Criteria - Priority Order */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">적합도 기준 (우선순위)</p>
                      <div className="space-y-1.5">
                        {[...currentGoal.fitEvalCriteria]
                          .sort((a, b) => b.weight - a.weight)
                          .map((c, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm">
                              <span className="w-5 h-5 rounded-full bg-accent text-foreground text-xs font-semibold flex items-center justify-center">
                                {i + 1}
                              </span>
                              <span className="flex-1 text-foreground">{c.name}</span>
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(n => (
                                  <div key={n} className={cn('w-2 h-2 rounded-full', n <= c.weight ? 'bg-primary' : 'bg-muted')} />
                                ))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => setIsEditingGoals(true)}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      목표 수정
                    </Button>
                  </>
                )}
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        {/* Experiences Section */}
        <Collapsible open={experienceOpen} onOpenChange={setExperienceOpen}>
          <div className="bg-card rounded-xl border border-border card-shadow overflow-hidden">
            <CollapsibleTrigger className="w-full flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">경험</h2>
                <Badge variant="secondary" className="text-xs">{experiences.length}</Badge>
              </div>
              {experienceOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="px-4 pb-4 space-y-3">
                {/* Upload Resume Button */}
                <Button 
                  variant="outline" 
                  className="w-full border-dashed"
                  onClick={() => {
                    // TODO: Implement resume upload with AI parsing
                    alert('이력서 업로드 기능은 Cloud 연동 후 사용 가능합니다.');
                  }}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  이력서 업로드 (PDF)
                </Button>

                {/* Experience Cards */}
                {experiences.map((exp) => (
                  <div key={exp.id} className="bg-secondary/30 rounded-lg p-3 group">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm text-foreground">{exp.title}</h3>
                        {exp.company && <p className="text-xs text-muted-foreground">{exp.company}</p>}
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-7 h-7"
                          onClick={() => setEditingExperience(exp.id)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="w-7 h-7 text-destructive hover:text-destructive"
                          onClick={() => removeExperience(exp.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {exp.bullets.slice(0, 3).map((bullet, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="text-primary">•</span>
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                    {exp.usedInPostings.length > 0 && (
                      <Badge variant="secondary" className="text-xs mt-2">
                        {exp.usedInPostings.length}개 공고에 사용됨
                      </Badge>
                    )}
                  </div>
                ))}

                {/* Add Experience Button */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full"
                  onClick={() => setIsAddingExperience(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  경험 추가
                </Button>
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>
      </div>

      {/* Goals Edit Dialog */}
      {currentGoal && (
        <GoalsEditDialog 
          open={isEditingGoals} 
          onOpenChange={setIsEditingGoals}
          goal={currentGoal}
          onSave={setGoal}
        />
      )}

      {/* Experience Add/Edit Dialog */}
      <ExperienceDialog
        open={isAddingExperience || !!editingExperience}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddingExperience(false);
            setEditingExperience(null);
          }
        }}
        experience={editingExperience ? experiences.find(e => e.id === editingExperience) : undefined}
        onSave={(exp) => {
          if (editingExperience) {
            updateExperience(editingExperience, exp);
          } else {
            addExperience({ 
              id: Date.now().toString(), 
              title: exp.title,
              company: exp.company,
              description: exp.description,
              bullets: exp.bullets,
              usedInPostings: exp.usedInPostings,
              createdAt: new Date() 
            });
          }
          setIsAddingExperience(false);
          setEditingExperience(null);
        }}
      />
    </div>
  );
}

import { CareerGoal, Experience } from '@/types/job';

interface GoalsEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: CareerGoal;
  onSave: (goal: CareerGoal) => void;
}

function GoalsEditDialog({ open, onOpenChange, goal, onSave }: GoalsEditDialogProps) {
  const [formData, setFormData] = useState({
    reason: goal.reason,
    careerPath: goal.careerPath || '',
    companyEvalCriteria: [...goal.companyEvalCriteria],
    fitEvalCriteria: [...goal.fitEvalCriteria],
  });

  const updateCriteriaWeight = (type: 'company' | 'fit', index: number, weight: number) => {
    if (type === 'company') {
      const updated = [...formData.companyEvalCriteria];
      updated[index] = { ...updated[index], weight };
      setFormData({ ...formData, companyEvalCriteria: updated });
    } else {
      const updated = [...formData.fitEvalCriteria];
      updated[index] = { ...updated[index], weight };
      setFormData({ ...formData, fitEvalCriteria: updated });
    }
  };

  const updateCriteriaName = (type: 'company' | 'fit', index: number, name: string) => {
    if (type === 'company') {
      const updated = [...formData.companyEvalCriteria];
      updated[index] = { ...updated[index], name };
      setFormData({ ...formData, companyEvalCriteria: updated });
    } else {
      const updated = [...formData.fitEvalCriteria];
      updated[index] = { ...updated[index], name };
      setFormData({ ...formData, fitEvalCriteria: updated });
    }
  };

  const handleSave = () => {
    onSave({
      ...goal,
      reason: formData.reason,
      careerPath: formData.careerPath || undefined,
      companyEvalCriteria: formData.companyEvalCriteria,
      fitEvalCriteria: formData.fitEvalCriteria,
      updatedAt: new Date(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] max-h-[80vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>이직 목표 수정</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="reason">이직 이유</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="careerPath">커리어 패스</Label>
            <Input
              id="careerPath"
              value={formData.careerPath}
              onChange={(e) => setFormData({ ...formData, careerPath: e.target.value })}
              placeholder="예: 시니어 엔지니어 → 테크 리드"
            />
          </div>

          {/* Company Eval Criteria */}
          <div className="space-y-3">
            <Label>회사 평가 기준 (가중치 클릭으로 조절)</Label>
            {formData.companyEvalCriteria.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={c.name}
                  onChange={(e) => updateCriteriaName('company', i, e.target.value)}
                  className="flex-1 h-9"
                />
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => updateCriteriaWeight('company', i, n)}
                      className={cn(
                        'w-6 h-6 rounded-full transition-colors',
                        n <= c.weight ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/20'
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Fit Eval Criteria */}
          <div className="space-y-3">
            <Label>적합도 기준 (가중치 클릭으로 조절)</Label>
            {formData.fitEvalCriteria.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={c.name}
                  onChange={(e) => updateCriteriaName('fit', i, e.target.value)}
                  className="flex-1 h-9"
                />
                <div className="flex gap-1">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => updateCriteriaWeight('fit', i, n)}
                      className={cn(
                        'w-6 h-6 rounded-full transition-colors',
                        n <= c.weight ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground/20'
                      )}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface ExperienceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  experience?: Experience;
  onSave: (exp: Omit<Experience, 'id' | 'createdAt'>) => void;
}

function ExperienceDialog({ open, onOpenChange, experience, onSave }: ExperienceDialogProps) {
  const [formData, setFormData] = useState({
    title: experience?.title || '',
    company: experience?.company || '',
    description: experience?.description || '',
    bullets: experience?.bullets.join('\n') || '',
    usedInPostings: experience?.usedInPostings || [],
  });

  const handleSave = () => {
    onSave({
      title: formData.title,
      company: formData.company || undefined,
      description: formData.description,
      bullets: formData.bullets.split('\n').filter(b => b.trim()),
      usedInPostings: formData.usedInPostings,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90%] rounded-2xl">
        <DialogHeader>
          <DialogTitle>{experience ? '경험 수정' : '경험 추가'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="expTitle">제목</Label>
            <Input
              id="expTitle"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 리드 프론트엔드 개발자"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expCompany">회사명</Label>
            <Input
              id="expCompany"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              placeholder="예: 스타트업 A"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expDesc">설명</Label>
            <Input
              id="expDesc"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="예: 프론트엔드 팀 리드"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expBullets">주요 성과 (줄바꿈으로 구분)</Label>
            <Textarea
              id="expBullets"
              value={formData.bullets}
              onChange={(e) => setFormData({ ...formData, bullets: e.target.value })}
              rows={4}
              placeholder="성과 1&#10;성과 2&#10;성과 3"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
              취소
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              저장
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
